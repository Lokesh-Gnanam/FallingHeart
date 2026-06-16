import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

let appStateSubscription: any = null;

/**
 * Starts tracking AppState changes to update the user's online status in Supabase.
 * Sets online=true when active, and online=false when backgrounded or closed.
 */
export const startPresenceTracker = () => {
  if (appStateSubscription) return;

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const isOnline = nextAppState === 'active';
    try {
      await supabase
        .from('profiles')
        .update({
          online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to update presence status in database:', e);
    }
  };

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  
  // Initial mark active on launch
  handleAppStateChange(AppState.currentState);
};

/**
 * Stops tracking AppState changes and marks the user as offline.
 */
export const stopPresenceTracker = async () => {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  const user = useAuthStore.getState().user;
  if (user) {
    try {
      await supabase
        .from('profiles')
        .update({
          online: false,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to mark user offline on exit:', e);
    }
  }
};
