import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Mail, User, Lock, Key, Fingerprint } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { LogoHeader } from '../../src/components/LogoHeader';
import { TextField } from '../../src/components/TextField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { registerUser, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    displayName?: string;
    password?: string;
    confirmPassword?: string;
    secretKey?: string;
  }>({});

  const handleSignUp = async () => {
    const newErrors: typeof errors = {};
    
    if (!email) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
    
    if (!username) newErrors.username = 'Username is required';
    else if (username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!displayName) newErrors.displayName = 'Display Name is required';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';
    
    if (!secretKey) newErrors.secretKey = 'Secret Key is mandatory';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const success = await registerUser(email, username, displayName, password, secretKey);
    if (success) {
      Alert.alert(
        'Identity Encrypted',
        'Your profile has been created and your keys have been generated.',
        [{ text: 'Enter App', onPress: () => router.replace('/(tabs)/chat') }]
      );
    } else {
      Alert.alert('Encryption Error', 'Failed to complete registration. Please try a different email/username.');
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

          {/* Registration Fields Card */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 100 }}
            style={[styles.card, SHADOWS.soft]}
          >
            <TextField
              placeholder="Email Address"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextField
              placeholder="Username"
              icon={User}
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
            />

            <TextField
              placeholder="Display Name"
              icon={User}
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
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
              placeholder="Confirm Password"
              icon={Lock}
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />

            <TextField
              placeholder="Secret Key (Mandatory)"
              icon={Key}
              secureTextEntry={true}
              value={secretKey}
              onChangeText={setSecretKey}
              error={errors.secretKey}
            />

            {/* Sign Up Button */}
            <PrimaryButton
              title={loading ? "Generating Enclave..." : "Sign Up"}
              onPress={handleSignUp}
              style={styles.signUpButton}
              disabled={loading}
            />
          </MotiView>

          {/* Redirect link to login */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkLabel}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
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
  signUpButton: {
    width: '100%',
    marginTop: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginLinkLabel: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
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
