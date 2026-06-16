import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Set standard foreground notification handler behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the device for push notifications.
 * Requests user permission if not already granted, fetches the Expo Push Token,
 * and updates the token in the Supabase profiles table.
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token: permission not granted');
      return null;
    }

    // Get project ID from Expo constants for EAS project tracking
    const projectId = Device.default?.expoConfig?.extra?.eas?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;

    // Save token to profile
    const user = useAuthStore.getState().user;
    if (user) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);
    }

    return token;
  } catch (e) {
    console.error('Error registering for push notifications:', e);
    return null;
  }
};
