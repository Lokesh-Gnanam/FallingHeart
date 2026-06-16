import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { hashSecretKey, checkBiometricsSupport, requestBiometricUnlock } from '../services/auth';

const SecureStoreAdapter = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  }
};

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthState {
  isOnboarded: boolean;
  isAuthenticated: boolean;
  user: User | null;
  secretKey: string | null;
  isBiometricsAvailable: boolean;
  loading: boolean;
  
  initialize: () => Promise<void>;
  setOnboarded: (val: boolean) => void;
  registerUser: (
    email: string,
    username: string,
    displayName: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginUser: (emailOrUsername: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
  biometricUnlock: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateSecretKey: (newPin: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isOnboarded: false,
  isAuthenticated: false,
  user: null,
  secretKey: null,
  isBiometricsAvailable: false,
  loading: false,

  updateSecretKey: async (newPin: string) => {
    const hashedKey = hashSecretKey(newPin);
    const user = get().user;
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ secret_key_hash: hashedKey })
        .eq('id', user.id);

      if (error) throw error;

      await SecureStoreAdapter.setItemAsync('secret_key', newPin);
      set({ secretKey: newPin });
      return true;
    } catch (e) {
      console.error('Error updating secret key:', e);
      return false;
    }
  },

  initialize: async () => {
    try {
      const onboardingCompleted = await SecureStoreAdapter.getItemAsync('onboarding_completed');
      const savedKey = await SecureStoreAdapter.getItemAsync('secret_key');
      const biometricsSupported = await checkBiometricsSupport();

      // Check if session exists in Supabase
      const { data: { session } } = await supabase.auth.getSession();

      let userProfile: User | null = null;
      if (session?.user) {
        // Fetch public profile details
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, username, display_name, avatar_url, bio')
          .eq('id', session.user.id)
          .single();

        if (profile && !error) {
          userProfile = {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            bio: profile.bio,
          };
        }
      }

      set({
        isOnboarded: onboardingCompleted === 'true',
        user: userProfile,
        secretKey: savedKey,
        isBiometricsAvailable: biometricsSupported,
        // If we have an active user session AND a valid saved secret key, they are authenticated
        isAuthenticated: !!session?.user && !!savedKey,
      });
    } catch (e) {
      console.error('Error initializing AuthStore', e);
    }
  },

  setOnboarded: async (val: boolean) => {
    await SecureStoreAdapter.setItemAsync('onboarding_completed', val ? 'true' : 'false');
    set({ isOnboarded: val });
  },

  registerUser: async (email, username, displayName, password) => {
    set({ loading: true });
    try {
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        set({ loading: false });
        return { success: false, error: 'Username is already taken' };
      }

      const hashedKey = hashSecretKey(password);
      
      // Sign up in Supabase auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
            secret_key_hash: hashedKey,
          },
        },
      });

      if (signUpError || !signUpData.user) {
        throw signUpError || new Error('Auth registration failed');
      }

      const userId = signUpData.user.id;

      // Manually upsert profile to double-ensure it exists immediately (fallback for trigger lag)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email.toLowerCase(),
          username: username.toLowerCase().trim(),
          display_name: displayName,
          secret_key_hash: hashedKey,
          online: true,
          last_seen: new Date().toISOString(),
        });

      if (profileError) {
        console.warn('Profile sync warning:', profileError.message);
      }

      // Save plain secret key locally (using password)
      await SecureStoreAdapter.setItemAsync('secret_key', password);

      const userProfile: User = {
        id: userId,
        email,
        username,
        displayName,
      };

      set({
        user: userProfile,
        secretKey: password,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (e: any) {
      console.error('Error registering user:', e);
      set({ loading: false });
      return { success: false, error: e.message || 'Registration failed' };
    }
  },

  loginUser: async (emailOrUsername, passwordInput) => {
    set({ loading: true });
    try {
      let resolvedEmail = emailOrUsername.trim();

      // Check if it is a username instead of email
      if (!resolvedEmail.includes('@')) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', resolvedEmail.toLowerCase())
          .maybeSingle();

        if (profile && !error) {
          resolvedEmail = profile.email;
        } else {
          set({ loading: false });
          return { success: false, error: 'User profile not found' };
        }
      }

      // Log in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: passwordInput,
      });

      if (authError || !authData.user) {
        throw authError || new Error('Credentials invalid');
      }

      const userId = authData.user.id;

      // Fetch user profile settings
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, username, display_name, avatar_url, bio')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw profileError || new Error('Profile not found');
      }

      // Store the password locally as the secret key to unlock hidden chats and biometrics
      await SecureStoreAdapter.setItemAsync('secret_key', passwordInput);

      // Set user online
      await supabase.from('profiles').update({ online: true, last_seen: new Date().toISOString() }).eq('id', userId);

      set({
        user: {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
        },
        secretKey: passwordInput,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (e: any) {
      console.error('Error logging in user:', e);
      set({ loading: false });
      return { success: false, error: e.message || 'Authentication failed' };
    }
  },

  biometricUnlock: async () => {
    try {
      const success = await requestBiometricUnlock();
      if (!success) return false;

      // Verify session exists and we have a local key saved
      const { data: { session } } = await supabase.auth.getSession();
      const savedKey = await SecureStoreAdapter.getItemAsync('secret_key');

      if (session?.user && savedKey) {
        // Fetch latest profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, username, display_name, avatar_url, bio')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Set user online
          await supabase.from('profiles').update({ online: true, last_seen: new Date().toISOString() }).eq('id', session.user.id);

          set({
            user: {
              id: profile.id,
              email: profile.email,
              username: profile.username,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              bio: profile.bio,
            },
            secretKey: savedKey,
            isAuthenticated: true,
          });
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Biometric unlock failed:', e);
      return false;
    }
  },

  logout: async () => {
    try {
      const currentUser = get().user;
      if (currentUser) {
        // Set offline status in DB
        await supabase
          .from('profiles')
          .update({ online: false, last_seen: new Date().toISOString() })
          .eq('id', currentUser.id);
      }
      
      await supabase.auth.signOut();
      await SecureStoreAdapter.deleteItemAsync('secret_key');

      set({
        isAuthenticated: false,
        user: null,
        secretKey: null,
      });
    } catch (e) {
      console.error('Error logging out:', e);
    }
  },
}));
