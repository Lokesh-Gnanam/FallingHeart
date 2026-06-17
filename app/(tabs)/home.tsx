import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, Dimensions, BackHandler, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { Heart, Trophy } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useGameStore } from '../../src/game/store/gameStore';
import { useAuthStore } from '../../src/store/authStore';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useTheme, LIGHT_COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingHeartItem {
  id: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export default function GameHomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const currentUser = useAuthStore((state) => state.user);
  const { highScore, fetchHighScore, startGame, isPaused, clearPausedGame, score } = useGameStore();

  // Load high score from Supabase on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchHighScore();
    }
  }, [currentUser]);

  // Intercept hardware back button to exit app when focused
  useEffect(() => {
    const onBackPress = () => {
      if (navigation.isFocused()) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Generate deterministic floating background hearts
  const backgroundHearts: FloatingHeartItem[] = [
    { id: '1', left: 15, size: 24, delay: 0, duration: 4000 },
    { id: '2', left: 40, size: 16, delay: 1000, duration: 5000 },
    { id: '3', left: 75, size: 32, delay: 500, duration: 4500 },
    { id: '4', left: 25, size: 20, delay: 2000, duration: 4800 },
    { id: '5', left: 85, size: 28, delay: 1500, duration: 5200 },
  ];

  const handlePlayGame = () => {
    if (isPaused) {
      router.push('/game/play');
    } else {
      startGame();
      router.push('/game/play');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        hidden={false}
        translucent={true}
        backgroundColor="transparent"
      />

      {/* Continue Game Modal Dialog */}
      <Modal
        visible={isPaused}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={[styles.modalCard, SHADOWS.soft]}
          >
            <View style={styles.modalHeartIconWrapper}>
              <Heart size={44} color={colors.primary} fill={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Resume Game?</Text>
            <Text style={styles.modalDescription}>
              You have a game in progress with a score of {score}. Would you like to continue or start a new game?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <PrimaryButton
                title="YES, CONTINUE"
                onPress={() => {
                  router.push('/game/play');
                }}
                style={styles.modalPrimaryButton}
              />
              <Pressable
                style={[styles.modalSecondaryButton, SHADOWS.soft]}
                onPress={() => {
                  clearPausedGame();
                  startGame();
                  router.push('/game/play');
                }}
              >
                <Text style={styles.modalSecondaryButtonText}>PLAY AGAIN</Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* Decorative Atmosphere Blurs */}
      <View style={styles.blurBackground} pointerEvents="none">
        <View style={styles.blurTopLeft} />
        <View style={styles.blurBottomRight} />
      </View>

      {/* Floating Background Hearts */}
      <View style={styles.heartsBackground} pointerEvents="none">
        {backgroundHearts.map((h) => (
          <MotiView
            key={h.id}
            from={{ translateY: SCREEN_HEIGHT * 0.7, opacity: 0, scale: 0.6, rotate: '0deg' }}
            animate={{ translateY: -100, opacity: [0, 0.25, 0.25, 0], scale: 1.2, rotate: '25deg' }}
            transition={{
              type: 'timing',
              duration: h.duration,
              delay: h.delay,
              loop: true,
            }}
            style={[styles.floatingHeart, { left: `${h.left}%` }]}
          >
            <Heart size={h.size} color={colors.primary} fill={colors.primary} />
          </MotiView>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Falling Hearts</Text>
      </View>

      <View style={styles.content}>
        {/* Center Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 30 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 100 }}
          style={[styles.centerCard, SHADOWS.soft]}
        >
          {/* Heart Icon Wrapper */}
          <MotiView
            from={{ scale: 0.95 }}
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{
              type: 'timing',
              duration: 1800,
              loop: true,
            }}
            style={styles.heartIconWrapper}
          >
            <Heart size={64} color={colors.primary} fill={colors.primary} />
          </MotiView>

          <Text style={styles.cardTitle}>CatchHeart</Text>
          <Text style={styles.cardDescription}>
            Catch falling hearts and earn points. Miss too many hearts and the game ends.
          </Text>
        </MotiView>

        {/* High Score Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={[styles.highScoreContainer, SHADOWS.soft]}
        >
          <View style={styles.trophyIconBg}>
            <Trophy size={20} color={colors.primary} fill={colors.primary} />
          </View>
          <View style={styles.highScoreTextContainer}>
            <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
            <Text style={styles.highScoreValue}>{highScore}</Text>
          </View>
        </MotiView>

        {/* Play Game Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 450 }}
          style={styles.buttonContainer}
        >
          <PrimaryButton
            title="PLAY GAME"
            onPress={handlePlayGame}
            style={styles.playButton}
          />
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blurBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  blurTopLeft: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(217, 0, 108, 0.05)',
  },
  blurBottomRight: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(229, 0, 114, 0.04)',
  },
  heartsBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  floatingHeart: {
    position: 'absolute',
    opacity: 0,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 22,
    color: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80, // TabBar offset
    zIndex: 5,
  },
  centerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  heartIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(217, 0, 108, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  cardDescription: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  trophyIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 0, 108, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  highScoreTextContainer: {
    flex: 1,
  },
  highScoreLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  highScoreValue: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 24,
    color: colors.primary,
    marginTop: 2,
  },
  buttonContainer: {
    width: '100%',
  },
  playButton: {
    height: 56,
    borderRadius: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalHeartIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217, 0, 108, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalDescription: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  modalButtonContainer: {
    width: '100%',
    gap: 12,
  },
  modalPrimaryButton: {
    height: 52,
    borderRadius: 26,
  },
  modalSecondaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalSecondaryButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 15,
    color: colors.primary,
  },
});
