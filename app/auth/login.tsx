import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Mail, Lock, Key, Fingerprint } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { LogoHeader } from '../../src/components/LogoHeader';
import { TextField } from '../../src/components/TextField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { loginUser, biometricUnlock, isBiometricsAvailable, user, loading } = useAuthStore();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  const [errors, setErrors] = useState<{ 
    emailOrUsername?: string; 
    password?: string;
    secretKey?: string;
  }>({});

  // Trigger biometrics automatically if available
  useEffect(() => {
    if (isBiometricsAvailable && user) {
      handleBiometrics();
    }
  }, [isBiometricsAvailable, user]);

  const handleBiometrics = async () => {
    const success = await biometricUnlock();
    if (success) {
      router.replace('/(tabs)/chat');
    }
  };

  const handleSignIn = async () => {
    const newErrors: typeof errors = {};
    if (!emailOrUsername) newErrors.emailOrUsername = 'Email or Username is required';
    if (!password) newErrors.password = 'Password is required';
    if (!secretKey) newErrors.secretKey = 'Secret Key is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
    const success = await loginUser(emailOrUsername, password, secretKey);
    
    if (success) {
      router.replace('/(tabs)/chat');
    } else {
      Alert.alert('Access Denied', 'Authentication failed. Please verify your credentials and Secret Key.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header */}
          <LogoHeader
            subtitle="SECRET ACCESS PORTAL"
            isUppercaseSubtitle={true}
            subtitleLetterSpacing={2}
            style={styles.header}
          />

          {/* Form Card */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 100 }}
            style={[styles.card, SHADOWS.soft]}
          >
            <TextField
              placeholder="Email or Username"
              icon={Mail}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              error={errors.emailOrUsername}
              autoCapitalize="none"
            />

            <TextField
              placeholder="Password"
              icon={Lock}
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <TextField
              placeholder="Secret Key"
              icon={Key}
              secureTextEntry={true}
              value={secretKey}
              onChangeText={setSecretKey}
              error={errors.secretKey}
            />

            {/* Forgot Password */}
            <Pressable
              onPress={() => Alert.alert('Discreet Recovery', 'Please contact support or clear app data to reset your local key.')}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            {/* Sign In Button */}
            <PrimaryButton
              title={loading ? "Authenticating..." : "Sign In"}
              onPress={handleSignIn}
              style={styles.signInButton}
              disabled={loading}
            />
          </MotiView>

          {/* Biometrics option (if available on hardware and registered) */}
          {isBiometricsAvailable && user && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.biometricContainer}
            >
              <Pressable onPress={handleBiometrics} style={styles.biometricButton}>
                <Fingerprint size={32} color={COLORS.primary} />
              </Pressable>
              <Text style={styles.biometricText}>Tap to unlock with Biometrics</Text>
            </MotiView>
          )}

          {/* Bottom navigation switcher */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupLabel}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer */}
        <Text style={styles.footerText}>ENCRYPTED & DISCREET • EST. 2024</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 13,
    color: COLORS.primary,
  },
  signInButton: {
    width: '100%',
  },
  biometricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  biometricButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(172,36,113,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  biometricText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupLabel: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  footerText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 1.5,
    paddingBottom: 16,
  },
});
