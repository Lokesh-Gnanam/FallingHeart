import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { hashSecretKey, checkBiometricsSupport, requestBiometricUnlock } from '../services/auth';

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
    password: string,
    secretKeyInput: string
  ) => Promise<boolean>;
  loginUser: (emailOrUsername: string, passwordInput: string, secretKeyInput: string) => Promise<boolean>;
  biometricUnlock: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isOnboarded: false,
  isAuthenticated: false,
  user: null,
  secretKey: null,
  isBiometricsAvailable: false,
  loading: false,

  initialize: async () => {
    try {
      const onboardingCompleted = await SecureStore.getItemAsync('onboarding_completed');
      const savedKey = await SecureStore.getItemAsync('secret_key');
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
    await SecureStore.setItemAsync('onboarding_completed', val ? 'true' : 'false');
    set({ isOnboarded: val });
  },

  registerUser: async (email, username, displayName, password, secretKeyInput) => {
    set({ loading: true });
    try {
      const hashedKey = hashSecretKey(secretKeyInput);
      
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

      // Save plain secret key locally
      await SecureStore.setItemAsync('secret_key', secretKeyInput);

      const userProfile: User = {
        id: userId,
        email,
        username,
        displayName,
      };

      set({
        user: userProfile,
        secretKey: secretKeyInput,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (e) {
      console.error('Error registering user:', e);
      set({ loading: false });
      return false;
    }
  },

  loginUser: async (emailOrUsername, passwordInput, secretKeyInput) => {
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
          return false;
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

      // Fetch user profile settings and secret key hash
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, username, display_name, avatar_url, bio, secret_key_hash')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw profileError || new Error('Profile not found');
      }

      // Verify the Secret Key matches
      const hashedInputKey = hashSecretKey(secretKeyInput);
      if (profile.secret_key_hash !== hashedInputKey) {
        // Disconnect session since secret key did not match
        await supabase.auth.signOut();
        throw new Error('Secret key incorrect');
      }

      // Store secret key locally
      await SecureStore.setItemAsync('secret_key', secretKeyInput);

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
        secretKey: secretKeyInput,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (e) {
      console.error('Error logging in user:', e);
      set({ loading: false });
      return false;
    }
  },

  biometricUnlock: async () => {
    try {
      const success = await requestBiometricUnlock();
      if (!success) return false;

      // Verify session exists and we have a local key saved
      const { data: { session } } = await supabase.auth.getSession();
      const savedKey = await SecureStore.getItemAsync('secret_key');

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
      await SecureStore.deleteItemAsync('secret_key');

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
