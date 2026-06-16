import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, Pressable } from 'react-native';
import { ShieldAlert, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LogoHeader } from '../../src/components/LogoHeader';
import { useAuthStore } from '../../src/store/authStore';

export default function OnboardingPage2() {
  const router = useRouter();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  const handleFinish = async () => {
    await setOnboarded(true);
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Logo */}
      <View style={styles.headerContainer}>
        <LogoHeader style={styles.header} />
      </View>

      {/* Floating Quote Card Area */}
      <View style={styles.illustrationContainer}>
        <MotiView
          from={{ translateY: -8, rotate: '-3deg' }}
          animate={{ translateY: 8, rotate: '1deg' }}
          transition={{
            type: 'timing',
            duration: 2500,
            loop: true,
            repeatReverse: true,
          }}
          style={[styles.quoteCard, SHADOWS.glow]}
        >
          <View style={styles.quoteBubblePin} />
          <Text style={styles.quoteText}>
            "This secret will disappear forever..."
          </Text>
          <View style={styles.trashIconContainer}>
            <Trash2 size={16} color={COLORS.primary} strokeWidth={2} />
          </View>
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
          {/* Privacy Tag */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRIVACY FIRST</Text>
          </View>

          <Text style={styles.cardTitle}>Vanish Mode</Text>
          <Text style={styles.cardDescription}>
            Experience the thrill of ephemeral connection. In Vanish Mode, your messages dissolve into digital dust the moment they are read.
          </Text>
        </MotiView>

        {/* Onboarding indicators */}
        <View style={styles.indicatorContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        {/* Next Button */}
        <PrimaryButton
          title="NEXT  →"
          onPress={handleFinish}
          style={styles.button}
        />

        {/* Skip Intro small footer link */}
        <Pressable onPress={handleFinish} style={styles.skipContainer}>
          <Text style={styles.skipText}>Skip Intro</Text>
        </Pressable>
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
  headerContainer: {
    paddingTop: 16,
  },
  header: {
    paddingVertical: 0,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  quoteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    position: 'relative',
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quoteBubblePin: {
    position: 'absolute',
    bottom: -10,
    left: '20%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
  },
  quoteText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 14,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  trashIconContainer: {
    backgroundColor: 'rgba(194,24,117,0.08)',
    padding: 6,
    borderRadius: 10,
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
    position: 'relative',
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
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
  skipContainer: {
    marginTop: 16,
    paddingVertical: 4,
  },
  skipText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
});
