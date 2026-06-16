import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter, Redirect } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../src/theme';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useAuthStore } from '../src/store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleStart = () => {
    router.push('/onboarding/page1');
  };

  if (isAuthenticated && user) {
    return <Redirect href="/(tabs)/chat" />;
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Pulsing Heart Logo */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.logoWrapper}
        >
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{
              type: 'timing',
              duration: 1400,
              loop: true,
            }}
            style={styles.heartContainer}
          >
            <Heart size={64} color={COLORS.primary} strokeWidth={2.5} />
          </MotiView>
        </MotiView>

        {/* Fading in Titles */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 300 }}
          style={styles.textWrapper}
        >
          <Text style={styles.title}>FallingHearts</Text>
          <Text style={styles.subtitle}>DIGITAL INTIMACY REFINED</Text>
        </MotiView>
      </View>

      {/* Bottom Actions section */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 800, delay: 600 }}
        style={styles.bottomWrapper}
      >
        <PrimaryButton
          title="GETTING STARTED  →"
          onPress={handleStart}
          variant="white"
          style={styles.button}
        />

        {/* Page indicators */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Terms footer */}
        <Text style={styles.footerText}>
          BY CONTINUING, YOU ACCEPT OUR PRIVATE TERMS
        </Text>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartContainer: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  textWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 40,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '85%',
    marginTop: 24,
  },
  authCard: {
    alignItems: 'flex-start',
  },
  authLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 8,
  },
  authText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  bottomWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  button: {
    marginBottom: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 24, // Capsule active dot
  },
  footerText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
