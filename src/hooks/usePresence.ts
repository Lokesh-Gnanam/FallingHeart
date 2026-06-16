import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePresenceStore } from '../store/presenceStore';

/**
 * Hook to track and subscribe to global user presence.
 * Syncs online status and last seen times to usePresenceStore in real time.
 */
export const usePresence = () => {
  const updateUserPresence = usePresenceStore((state) => state.updateUserPresence);

  useEffect(() => {
    // Fetch initial presence statuses
    const fetchInitialPresence = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, online, last_seen');

        if (data && !error) {
          data.forEach((profile) => {
            updateUserPresence(profile.id, profile.online, profile.last_seen);
          });
        }
      } catch (e) {
        console.error('Error fetching initial presence map:', e);
      }
    };

    fetchInitialPresence();

    // Subscribe to database updates on profiles table
    const channel = supabase
      .channel('global-presence-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload: any) => {
          const newProfile = payload.new;
          if (newProfile && newProfile.id) {
            updateUserPresence(newProfile.id, newProfile.online, newProfile.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateUserPresence]);
};
