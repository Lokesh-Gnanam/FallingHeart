import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

/**
 * Uploads an avatar image from a local file URI to the Supabase Storage 'avatars' bucket.
 * Converts the file to a Blob using XMLHttpRequest to ensure compatibility across Android, iOS and Web.
 */
export const uploadAvatar = async (uri: string): Promise<string | null> => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return null;

    // Convert file URI to blob using XMLHttpRequest (Fetch base64/ArrayBuffer fails on Android)
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Local file network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
    
    const fileExt = uri.split('.').pop() || 'jpg';
    // Store in user-specific folder to keep files organized
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) throw error;

    // Retrieve the public URL for the newly uploaded file
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (e) {
    console.error('Avatar upload failed:', e);
    return null;
  }
};
