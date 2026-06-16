import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Svg, { Path } from 'react-native-svg';
import { Share2, MessageCircle, Home, Trophy, Heart, Zap, Clock } from 'lucide-react-native';

import { useTheme, LIGHT_COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { useGameStore } from '../../src/game/store/gameStore';
import { PrimaryButton } from '../../src/components/PrimaryButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BrokenHeartSVG = ({ size = 100, color = LIGHT_COLORS.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 17.5 3 20.58 3 23 5.42 23 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fillOpacity={0.15}
    />
    <Path
      d="M12 5.09C12.5 5.06 12.8 5 13.1 5l-.1 1.5c-.5 0-1 .3-1.4.8l-1.6 2 2 2.5-2.5 2 2 3-1.5 1.5-1 3.05M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M12 5.09c1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export default function GameResultScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const { score, heartsCollected, maxCombo, gameDuration, highScore, startGame, endGame } = useGameStore();

  const isNewHighScore = score > 0 && score >= highScore;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAgain = () => {
    startGame(); // Sychronously reset game state BEFORE transitioning to avoid mounting race conditions
    router.replace('/game/play');
  };

  const handleBackToHome = () => {
    endGame(); // Clean up state
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Decorative blurs */}
      <View style={styles.blurBackground} pointerEvents="none">
        <View style={styles.blurTop} />
        <View style={styles.blurBottom} />
      </View>

      <View style={styles.content}>
        {/* Header Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700 }}
          style={styles.headerContainer}
        >
          <View style={styles.iconWrapper}>
            <BrokenHeartSVG size={90} color={colors.primary} />
          </View>
          <Text style={styles.title}>GAME OVER</Text>
          <Text style={styles.subtitle}>SESSION ENDED</Text>
        </MotiView>

        {/* Stats Glassmorphism Card */}
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 150 }}
          style={[styles.glassCard, SHADOWS.soft]}
        >
          {/* High Score Badge */}
          {isNewHighScore && (
            <View style={styles.highScoreBadge}>
              <Trophy size={14} color={LIGHT_COLORS.white} fill={LIGHT_COLORS.white} />
              <Text style={styles.highScoreBadgeText}>NEW HIGH SCORE</Text>
            </View>
          )}

          {/* Final Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.finalScoreValue}>{score}</Text>
            <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Heart size={20} color={colors.primary} fill={colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{heartsCollected}</Text>
              <Text style={styles.statLabel}>HEARTS</Text>
            </View>

            <View style={styles.statBox}>
              <Zap size={20} color={colors.primary} fill={colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>x{maxCombo}</Text>
              <Text style={styles.statLabel}>MAX COMBO</Text>
            </View>

            <View style={styles.statBox}>
              <Clock size={20} color={colors.primary} fill={colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatTime(gameDuration)}</Text>
              <Text style={styles.statLabel}>TIME SURVIVED</Text>
            </View>
          </View>

          {/* Highest Score Row */}
          <View style={styles.highScoreRow}>
            <Trophy size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.highScoreRowLabel}>HIGHEST SCORE: </Text>
            <Text style={styles.highScoreRowValue}>{highScore}</Text>
          </View>
        </MotiView>

        {/* Action Buttons */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 300 }}
          style={styles.buttonContainer}
        >
          <PrimaryButton
            title="PLAY AGAIN"
            onPress={handlePlayAgain}
            style={styles.playButton}
          />
          <Pressable
            style={[styles.homeButton, SHADOWS.soft]}
            onPress={handleBackToHome}
          >
            <Home size={18} color={colors.primary} />
            <Text style={styles.homeButtonText}>GO TO HOME</Text>
          </Pressable>
        </MotiView>

        {/* Share Section */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 1000, delay: 450 }}
          style={styles.challengeContainer}
        >
          <Text style={styles.challengeTitle}>CHALLENGE A SECRET ADMIRER</Text>
          <View style={styles.challengeButtons}>
            <Pressable style={[styles.circleButton, SHADOWS.soft]}>
              <Share2 size={18} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={[styles.circleButton, SHADOWS.soft]}>
              <MessageCircle size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
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
  blurTop: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(217, 0, 108, 0.05)',
  },
  blurBottom: {
    position: 'absolute',
    bottom: '15%',
    right: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(229, 0, 114, 0.04)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 32,
    color: colors.primary,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 4,
    marginTop: 4,
    textAlign: 'center',
  },
  glassCard: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 32,
    width: '100%',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  highScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
    marginBottom: 12,
  },
  highScoreBadgeText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: LIGHT_COLORS.white,
    letterSpacing: 1,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    width: '100%',
  },
  finalScoreValue: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 64,
    color: colors.primary,
    lineHeight: 70,
    letterSpacing: -2,
  },
  finalScoreLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 0, 108, 0.03)',
    marginHorizontal: 4,
  },
  statIcon: {
    marginBottom: 6,
    opacity: 0.85,
  },
  statValue: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 8,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },
  highScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
  },
  highScoreRowLabel: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  highScoreRowValue: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 15,
    color: colors.primary,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  playButton: {
    height: 54,
    borderRadius: 27,
  },
  homeButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  homeButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 15,
    color: colors.primary,
  },
  challengeContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  challengeTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 12,
    opacity: 0.65,
  },
  challengeButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
