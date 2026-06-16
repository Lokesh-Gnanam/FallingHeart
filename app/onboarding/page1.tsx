import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, Pressable } from 'react-native';
import { Heart, MessageSquare, Lock, ShieldCheck } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function OnboardingPage1() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/page2');
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <Text style={styles.navLogo}>FallingHearts</Text>
        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      </View>

      {/* Main Illustration Area */}
      <View style={styles.illustrationContainer}>
        {/* Floating Lock Icon (Left) */}
        <MotiView
          from={{ translateY: -10 }}
          animate={{ translateY: 10 }}
          transition={{
            type: 'timing',
            duration: 1800,
            loop: true,
            repeatReverse: true,
          }}
          style={[styles.floatingIcon, styles.lockIcon]}
        >
          <Lock size={30} color={COLORS.primary} strokeWidth={2} />
        </MotiView>

        {/* Central Large Heart */}
        <MotiView
          from={{ scale: 0.9 }}
          animate={{ scale: 1.05 }}
          transition={{
            type: 'timing',
            duration: 2500,
            loop: true,
            repeatReverse: true,
          }}
          style={styles.mainHeart}
        >
          <Heart size={120} color={COLORS.primary} fill="rgba(194,24,117,0.08)" strokeWidth={1.5} />
        </MotiView>

        {/* Floating Message Icon (Right) */}
        <MotiView
          from={{ translateY: 10 }}
          animate={{ translateY: -10 }}
          transition={{
            type: 'timing',
            duration: 2200,
            loop: true,
            repeatReverse: true,
          }}
          style={[styles.floatingIcon, styles.messageIcon]}
        >
          <MessageSquare size={36} color={COLORS.primary} strokeWidth={2} />
        </MotiView>
      </View>

      {/* Details Card */}
      <View style={styles.bottomWrapper}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 100 }}
          style={[styles.card, SHADOWS.soft]}
        >
          <Text style={styles.cardTitle}>Secret Whispers</Text>
          <Text style={styles.cardDescription}>
            Experience the magic of private, real-time conversations that disappear like whispers in the wind.
          </Text>

          {/* Encryption active status bar */}
          <View style={styles.encryptionBar}>
            <ShieldCheck size={16} color={COLORS.primary} />
            <Text style={styles.encryptionText}>LIVE ENCRYPTION ACTIVE</Text>
          </View>
        </MotiView>

        {/* Onboarding indicators */}
        <View style={styles.indicatorContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        {/* Next Button */}
        <PrimaryButton
          title="NEXT  →"
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    height: 56,
  },
  navLogo: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 20,
    color: COLORS.primary,
  },
  skipText: {
    fontFamily: TYPOGRAPHY.weights.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: 300,
  },
  mainHeart: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  floatingIcon: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lockIcon: {
    left: '20%',
    top: '25%',
  },
  messageIcon: {
    right: '18%',
    bottom: '22%',
  },
  bottomWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  encryptionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(194,24,117,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  encryptionText: {
    fontFamily: TYPOGRAPHY.weights.semiBold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.5,
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
    width: 24,
  },
  button: {
    width: '100%',
  },
});
