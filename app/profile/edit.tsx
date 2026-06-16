import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { useAuthStore } from '../../src/store/authStore';
import { useProfileStore } from '../../src/store/profileStore';
import { uploadAvatar } from '../../src/services/chat';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { useTheme, LIGHT_COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const currentUser = useAuthStore((state) => state.user);
  const updateSecretKey = useAuthStore((state) => state.updateSecretKey);
  
  const { updateProfile, loading } = useProfileStore();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [pin, setPin] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Denied', 'Please allow gallery access to upload an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        setUploading(true);
        const uploadedUrl = await uploadAvatar(uri);
        setUploading(false);

        if (uploadedUrl) {
          setAvatarUrl(uploadedUrl);
          Alert.alert('Success', 'Avatar uploaded successfully!');
        } else {
          Alert.alert('Upload Failed', 'Failed to upload avatar to Supabase bucket. Make sure the "avatars" bucket is created and public.');
        }
      }
    } catch (e) {
      setUploading(false);
      console.error('Pick image error:', e);
      Alert.alert('Error', 'An error occurred while picking the image.');
    }
  };

  const handleSave = async () => {
    if (!displayName.trim() || !username.trim()) {
      Alert.alert('Validation Error', 'Display Name and Username are required.');
      return;
    }

    if (pin.trim() && pin.trim().length < 4) {
      Alert.alert('Validation Error', 'Hidden Chat PIN must be at least 4 characters.');
      return;
    }

    const success = await updateProfile(
      displayName.trim(),
      username.trim(),
      bio.trim(),
      avatarUrl
    );

    if (success) {
      if (pin.trim()) {
        const pinSuccess = await updateSecretKey(pin.trim());
        if (!pinSuccess) {
          Alert.alert('Warning', 'Profile updated, but failed to update Hidden Chat PIN.');
          return;
        }
      }
      Alert.alert('Identity Updated', 'Your profile details have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Save Error', 'Failed to save profile changes. Please verify username uniqueness.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <ProfileAvatar
                uri={avatarUrl}
                name={displayName || username}
                size={120}
              />
              <Pressable
                onPress={handlePickImage}
                disabled={uploading}
                style={[styles.cameraButton, SHADOWS.soft]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Camera size={18} color={LIGHT_COLORS.white} />
                )}
              </Pressable>
            </View>
            <Text style={styles.avatarLabel}>Click camera to upload avatar</Text>
          </View>

          {/* Form Fields Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.formContainer}
          >
            <View style={[styles.inputGroup, SHADOWS.soft]}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display Name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, SHADOWS.soft]}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.usernameInputWrapper}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 0 }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, SHADOWS.soft]}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Write a secret bio..."
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.inputGroup, SHADOWS.soft]}>
              <Text style={styles.inputLabel}>Hidden Chat PIN (Password)</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter new PIN to change"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={true}
              />
            </View>
          </MotiView>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading || uploading}
            style={({ pressed }) => [
              styles.saveButton,
              pressed ? styles.saveButtonPressed : null,
              loading || uploading ? styles.saveButtonDisabled : null,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={LIGHT_COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 18,
    color: colors.primary,
  },
  spacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarLabel: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputGroup: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 40,
    paddingVertical: 0,
  },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSymbol: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 15,
    color: colors.primary,
    marginRight: 4,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 8,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(172, 36, 113, 0.5)',
  },
  saveButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 16,
    color: LIGHT_COLORS.white,
    letterSpacing: 1,
  },
});
