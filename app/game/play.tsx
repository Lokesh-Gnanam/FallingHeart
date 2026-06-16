import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { Heart, HeartOff, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSharedValue } from 'react-native-reanimated';

import { useTheme, LIGHT_COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
import { useGameStore } from '../../src/game/store/gameStore';
import { HeartBasket } from '../../src/game/components/HeartBasket';
import { FallingHeart } from '../../src/game/components/FallingHeart';
import { ScoreEffect, FloatingScoreItem, ParticleItem } from '../../src/game/components/ScoreEffect';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeartData {
  id: string;
  x: number;
  type: 'normal' | 'golden';
  speed: number;
}

export default function GamePlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, insets);

  const {
    score,
    lives,
    combo,
    isPlaying,
    isGameOver,
    gameDuration,
    heartsCollected,
    maxCombo,
    startGame,
    catchHeart,
    missHeart,
    incrementDuration,
    updateGameStats,
    endGame,
  } = useGameStore();

  const [hearts, setHearts] = useState<HeartData[]>([]);
  const [scoreBadges, setScoreBadges] = useState<FloatingScoreItem[]>([]);
  const [particles, setParticles] = useState<ParticleItem[]>([]);

  // Draggable catcher dimensions and dynamic position calculation
  const catcherX = useSharedValue(SCREEN_WIDTH / 2);
  const CATCHER_WIDTH = 120;
  const CATCHER_HEIGHT = 65;
  
  const headerHeight = 60;
  const statusHeight = 52;
  const gameAreaHeight = SCREEN_HEIGHT - insets.top - insets.bottom - headerHeight - statusHeight;
  const CATCHER_Y = gameAreaHeight - 85; // Perfectly places the basket near the bottom boundary
  const HEART_SIZE = 36;

  // Initialize and Reset Game when mounting
  useEffect(() => {
    startGame();
    setHearts([]);
    setScoreBadges([]);
    setParticles([]);
  }, []);

  // Monitor Game Over to sync scores and transition
  useEffect(() => {
    if (isGameOver) {
      // Sync game statistics with Supabase
      updateGameStats(score, heartsCollected, maxCombo).then(() => {
        router.replace('/game/result');
      });
    }
  }, [isGameOver]);

  // Track Game Duration Timer
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const timer = setInterval(() => {
      incrementDuration(1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver]);

  // Difficulty Scaling
  const level = 1 + Math.floor(gameDuration / 20);
  const spawnRate = Math.max(350, 800 - (level - 1) * 75);
  const fallSpeed = Math.max(1200, 3000 - (level - 1) * 250);

  // Spawning Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const spawnInterval = setInterval(() => {
      const isGolden = Math.random() < 0.10;
      const newHeart: HeartData = {
        id: Math.random().toString(36).substring(7),
        x: Math.random() * (SCREEN_WIDTH - HEART_SIZE - 40) + 20,
        type: isGolden ? 'golden' : 'normal',
        speed: fallSpeed,
      };
      setHearts((prev) => [...prev, newHeart]);
    }, spawnRate);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, isGameOver, spawnRate, fallSpeed]);

  const handleCatch = (id: string, type: 'normal' | 'golden', x: number, y: number) => {
    const { points, isComboBonus } = catchHeart(type);

    if (type === 'golden') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setHearts((prev) => prev.filter((h) => h.id !== id));

    const newBadge: FloatingScoreItem = {
      id: Math.random().toString(),
      x,
      y,
      points,
      isComboBonus,
      type,
    };
    setScoreBadges((prev) => [...prev, newBadge]);

    const newParticles: ParticleItem[] = Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 2 * Math.PI;
      const speed = Math.random() * 40 + 20;
      return {
        id: `${id}-p-${i}`,
        x: x + HEART_SIZE / 2,
        y: y + HEART_SIZE / 2,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 15,
        size: Math.random() * 6 + 4,
        color: type === 'golden' ? '#FFD700' : colors.primary,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setScoreBadges((prev) => prev.filter((b) => b.id !== newBadge.id));
      setParticles((prev) => prev.filter((p) => !p.id.startsWith(id)));
    }, 600);
  };

  const handleMiss = (id: string) => {
    missHeart();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setHearts((prev) => prev.filter((h) => h.id !== id));
  };

  const handleBackToHome = () => {
    endGame();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Decorative Atmosphere Blurs */}
      <View style={styles.blurBackground} pointerEvents="none">
        <View style={styles.blurTopLeft} />
        <View style={styles.blurBottomRight} />
      </View>

      {/* Header Bar */}
      <View style={styles.header}>
        {/* Left Back Button */}
        <Pressable onPress={handleBackToHome} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>

        {/* Center score capsule */}
        <View style={[styles.scoreCapsule, SHADOWS.soft]}>
          <Text style={styles.scoreCapsuleLabel}>SCORE</Text>
          <Text style={styles.scoreCapsuleValue}>{score}</Text>
        </View>

        {/* Right spacing */}
        <View style={{ width: 40 }} />
      </View>

      {/* Top Status Bar: Lives & Combo Badge */}
      <View style={styles.statusBarContainer}>
        {/* Lives Display */}
        <View style={styles.livesContainer}>
          {Array.from({ length: 3 }).map((_, index) => (
            <MotiView
              key={index}
              animate={{
                scale: index < lives ? 1 : 0.8,
                opacity: index < lives ? 1 : 0.25,
              }}
              transition={{ type: 'spring' }}
              style={styles.heartIcon}
            >
              {index < lives ? (
                <Heart size={28} color={colors.primary} fill={colors.primary} />
              ) : (
                <HeartOff size={28} color={colors.textSecondary} />
              )}
            </MotiView>
          ))}
        </View>

        {/* Combo Badge popup */}
        <AnimatePresence>
          {combo >= 5 && (
            <MotiView
              key={`combo-${combo}`}
              from={{ opacity: 0, scale: 0.3, rotate: '-10deg' }}
              animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ type: 'spring', damping: 12 }}
              style={[styles.comboBadge, SHADOWS.glow]}
            >
              <Text style={styles.comboText}>COMBO x{combo}</Text>
              <Text style={styles.comboSubtitle}>2X MULTIPLIER</Text>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* Gameplay area */}
      <View style={styles.gameArea}>
        {/* Falling Hearts */}
        {hearts.map((h) => (
          <FallingHeart
            key={h.id}
            id={h.id}
            x={h.x}
            type={h.type}
            speed={h.speed}
            catcherX={catcherX}
            catcherWidth={CATCHER_WIDTH}
            catcherHeight={CATCHER_HEIGHT}
            catcherY={CATCHER_Y}
            heartSize={HEART_SIZE}
            onCatch={handleCatch}
            onMiss={handleMiss}
          />
        ))}

        {/* Score & Particle effects */}
        {scoreBadges.map((badge) => (
          <ScoreEffect
            key={badge.id}
            scoreItem={badge}
            particles={particles.filter((p) => p.id.startsWith(badge.id.split('-')[0]))}
          />
        ))}

        {/* Draggable Basket */}
        <HeartBasket
          catcherX={catcherX}
          catcherWidth={CATCHER_WIDTH}
          catcherHeight={CATCHER_HEIGHT}
          yPosition={CATCHER_Y}
        />
      </View>
    </View>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets.top, // Dynamic Safe Area padding for status bar/notches
    paddingBottom: insets.bottom,
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
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 22, 28, 0.8)',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  scoreCapsuleLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1,
  },
  scoreCapsuleValue: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 16,
    color: colors.primary,
  },
  statusBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    height: 52,
    zIndex: 10,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  heartIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboBadge: {
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 22, 28, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 0, 108, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  comboText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 12,
    color: colors.primary,
  },
  comboSubtitle: {
    fontFamily: TYPOGRAPHY.weights.semiBold,
    fontSize: 8,
    color: '#FF5CAD',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 5,
  },
});
