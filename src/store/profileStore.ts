import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface ProfileSettings {
  pushNotifications: boolean;
  onlineStatus: boolean;
  readReceipts: boolean;
  vanishMode: boolean;
  darkMode: boolean;
}

interface ProfileState {
  settings: ProfileSettings;
  loading: boolean;
  
  fetchSettings: () => Promise<void>;
  updateSetting: (key: keyof ProfileSettings, value: boolean) => Promise<void>;
  updateProfile: (displayName: string, username: string, bio: string, avatarUrl?: string) => Promise<boolean>;
  subscribeToProfileChanges: () => () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  settings: {
    pushNotifications: true,
    onlineStatus: true,
    readReceipts: true,
    vanishMode: false,
    darkMode: false,
  },
  loading: false,

  fetchSettings: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('push_notifications, online, read_receipts, vanish_mode, dark_mode')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        set({
          settings: {
            pushNotifications: data.push_notifications,
            onlineStatus: data.online,
            readReceipts: data.read_receipts,
            vanishMode: data.vanish_mode,
            darkMode: data.dark_mode,
          },
        });
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    } finally {
      set({ loading: false });
    }
  },

  updateSetting: async (key, value) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Optimistically update local state
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));

    try {
      // Map state keys to DB fields
      const dbFields: Record<string, string> = {
        pushNotifications: 'push_notifications',
        onlineStatus: 'online',
        readReceipts: 'read_receipts',
        vanishMode: 'vanish_mode',
        darkMode: 'dark_mode',
      };

      const dbKey = dbFields[key];
      const { error } = await supabase
        .from('profiles')
        .update({ [dbKey]: value })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
    } catch (e) {
      console.error(`Error updating setting ${key}:`, e);
      // Revert on error
      get().fetchSettings();
    }
  },

  updateProfile: async (displayName, username, bio, avatarUrl) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    set({ loading: true });
    try {
      const updateData: Record<string, any> = {
        display_name: displayName,
        username: username.toLowerCase().trim(),
        bio,
        avatar_url: avatarUrl || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update authStore state
      useAuthStore.setState({
        user: {
          ...user,
          displayName,
          username: username.toLowerCase().trim(),
          bio,
          avatarUrl: avatarUrl || undefined,
        },
      });

      return true;
    } catch (e) {
      console.error('Error updating profile:', e);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  subscribeToProfileChanges: () => {
    const user = useAuthStore.getState().user;
    if (!user) return () => {};

    const channel = supabase
      .channel(`profile-settings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new;
          set({
            settings: {
              pushNotifications: data.push_notifications,
              onlineStatus: data.online,
              readReceipts: data.read_receipts,
              vanishMode: data.vanish_mode,
              darkMode: data.dark_mode,
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
