import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  Eye, 
  CheckCheck, 
  Trash2, 
  Moon, 
  ChevronRight, 
  LogOut, 
  Edit2 
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { useAuthStore } from '../../../src/store/authStore';
import { useProfileStore } from '../../../src/store/profileStore';
import { ProfileAvatar } from '../../../src/components/ProfileAvatar';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const { settings, fetchSettings, updateSetting, subscribeToProfileChanges } = useProfileStore();

  // Load and listen to settings in real-time
  useEffect(() => {
    fetchSettings();
    const unsubscribe = subscribeToProfileChanges();
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const renderSettingToggle = (
    icon: React.ReactNode,
    title: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <View style={styles.settingIconBg}>{icon}</View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#dcbfc9', true: COLORS.secondary }}
        thumbColor={COLORS.white}
        ios_backgroundColor="#dcbfc9"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        {/* Profile Card Info */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.profileSection}
        >
          <View style={styles.avatarWrapper}>
            <ProfileAvatar
              uri={currentUser?.avatarUrl}
              name={currentUser?.displayName || currentUser?.username}
              online={settings.onlineStatus}
              size={110}
            />
            <Pressable
              onPress={() => router.push('/profile/edit')}
              style={[styles.editButton, SHADOWS.soft]}
            >
              <Edit2 size={16} color={COLORS.primary} />
            </Pressable>
          </View>
          
          <Text style={styles.displayName}>{currentUser?.displayName || 'User'}</Text>
          <Text style={styles.username}>@{currentUser?.username || 'handle'}</Text>
          
          {currentUser?.bio && (
            <Text style={styles.bioText} numberOfLines={2}>{currentUser.bio}</Text>
          )}
        </MotiView>

        {/* Communication settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COMMUNICATION</Text>
          <View style={[styles.card, SHADOWS.soft]}>
            {renderSettingToggle(
              <Bell size={18} color={COLORS.secondary} />,
              'Push Notifications',
              settings.pushNotifications,
              (val) => updateSetting('pushNotifications', val)
            )}
            
            <View style={styles.separator} />
            
            {renderSettingToggle(
              <Eye size={18} color={COLORS.secondary} />,
              'Online Status',
              settings.onlineStatus,
              (val) => updateSetting('onlineStatus', val)
            )}
            
            <View style={styles.separator} />
            
            {renderSettingToggle(
              <CheckCheck size={18} color={COLORS.secondary} />,
              'Read Receipts',
              settings.readReceipts,
              (val) => updateSetting('readReceipts', val)
            )}
          </View>
        </View>

        {/* Privacy settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PRIVACY & SECURITY</Text>
          <View style={[styles.card, SHADOWS.soft]}>
            {renderSettingToggle(
              <Trash2 size={18} color={COLORS.secondary} />,
              'Vanish Mode',
              settings.vanishMode,
              (val) => updateSetting('vanishMode', val)
            )}
            
            <View style={styles.separator} />
            
            {/* Hidden Chat PIN Navigation item */}
            <Pressable
              onPress={() => Alert.alert('Secure Key', 'Your secret chat code is protected. To change it, edit your profile.')}
              style={styles.navigationRow}
            >
              <View style={styles.settingInfo}>
                <View style={styles.settingIconBg}>
                  <CheckCheck size={18} color={COLORS.secondary} />
                </View>
                <Text style={styles.settingTitle}>Hidden Chat PIN</Text>
              </View>
              <View style={styles.navigationRight}>
                <Text style={styles.badgeLabel}>SECURE</Text>
                <ChevronRight size={18} color={COLORS.textSecondary} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Appearance settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPEARANCE</Text>
          <View style={[styles.card, SHADOWS.soft]}>
            {renderSettingToggle(
              <Moon size={18} color={COLORS.secondary} />,
              'Dark Mode',
              settings.darkMode,
              (val) => updateSetting('darkMode', val)
            )}
          </View>
        </View>

        {/* Log Out Action */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed ? styles.logoutButtonPressed : null,
          ]}
        >
          <LogOut size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </Pressable>

        <Text style={styles.footerText}>
          Secret Hearts v2.4.0 • Made with Love
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110, // space for tab bar
  },
  header: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 223, 0.2)',
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 18,
    color: COLORS.primary,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 191, 201, 0.3)',
  },
  displayName: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  username: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  bioText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    paddingVertical: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(226, 22, 95, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(232, 214, 223, 0.3)',
    marginHorizontal: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 8,
    color: COLORS.primary,
    backgroundColor: 'rgba(172, 36, 113, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(172, 36, 113, 0.2)',
    marginTop: 12,
    marginBottom: 20,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(172, 36, 113, 0.05)',
  },
  logoutButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  footerText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
    paddingBottom: 20,
  },
});
