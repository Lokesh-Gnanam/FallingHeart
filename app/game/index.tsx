import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { Heart, Bell, MessageSquare, User, HeartOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSharedValue } from 'react-native-reanimated';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';
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

export default function GameScreen() {
  const router = useRouter();
  const {
    score,
    lives,
    combo,
    isPlaying,
    isGameOver,
    gameDuration,
    startGame,
    catchHeart,
    missHeart,
    incrementDuration,
  } = useGameStore();

  const [hearts, setHearts] = useState<HeartData[]>([]);
  const [scoreBadges, setScoreBadges] = useState<FloatingScoreItem[]>([]);
  const [particles, setParticles] = useState<ParticleItem[]>([]);

  // Draggable catcher coordinates
  const catcherX = useSharedValue(SCREEN_WIDTH / 2);
  const CATCHER_WIDTH = 120;
  const CATCHER_HEIGHT = 65;
  const CATCHER_Y = SCREEN_HEIGHT - 210;
  const HEART_SIZE = 36;

  // Initialize and Reset Game when mounting
  useEffect(() => {
    startGame();
    setHearts([]);
    setScoreBadges([]);
    setParticles([]);
  }, []);

  // Monitor Game Over to transition
  useEffect(() => {
    if (isGameOver) {
      router.replace('/game/gameover');
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
  // Every 20 seconds, speed increases and spawn interval decreases
  const level = 1 + Math.floor(gameDuration / 20);
  const spawnRate = Math.max(350, 800 - (level - 1) * 75); // starts at 800ms, decreases by 75ms per lvl, capped at 350ms
  const fallSpeed = Math.max(1200, 3000 - (level - 1) * 250); // starts at 3000ms, decreases by 250ms per lvl, capped at 1200ms

  // Spawning Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const spawnInterval = setInterval(() => {
      const isGolden = Math.random() < 0.10; // 10% golden hearts
      const newHeart: HeartData = {
        id: Math.random().toString(36).substring(7),
        x: Math.random() * (SCREEN_WIDTH - HEART_SIZE - 40) + 20, // keep padding from edges
        type: isGolden ? 'golden' : 'normal',
        speed: fallSpeed,
      };
      setHearts((prev) => [...prev, newHeart]);
    }, spawnRate);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, isGameOver, spawnRate, fallSpeed]);

  const handleCatch = (id: string, type: 'normal' | 'golden', x: number, y: number) => {
    const { points, isComboBonus } = catchHeart(type);

    // Dynamic Haptics
    if (type === 'golden') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Remove heart
    setHearts((prev) => prev.filter((h) => h.id !== id));

    // Spawn score badge
    const newBadge: FloatingScoreItem = {
      id: Math.random().toString(),
      x,
      y,
      points,
      isComboBonus,
      type,
    };
    setScoreBadges((prev) => [...prev, newBadge]);

    // Spawn 8 exploding particles
    const newParticles: ParticleItem[] = Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 2 * Math.PI;
      const speed = Math.random() * 40 + 20;
      return {
        id: `${id}-p-${i}`,
        x: x + HEART_SIZE / 2,
        y: y + HEART_SIZE / 2,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 15, // float slightly upward
        size: Math.random() * 6 + 4,
        color: type === 'golden' ? '#FFD700' : COLORS.primary,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);

    // Cleanup effects after animation completes
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Decorative Atmosphere Blurs */}
      <View style={styles.blurBackground} pointerEvents="none">
        <View style={styles.blurTopLeft} />
        <View style={styles.blurBottomRight} />
      </View>

      {/* Header Bar */}
      <View style={styles.header}>
        {/* Left Logo */}
        <View style={styles.headerLeft}>
          <Heart size={22} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>CatchHeart</Text>
        </View>

        {/* Center score capsule */}
        <View style={[styles.scoreCapsule, SHADOWS.soft]}>
          <Text style={styles.scoreCapsuleLabel}>SCORE</Text>
          <Text style={styles.scoreCapsuleValue}>{score}</Text>
        </View>

        {/* Right Notification Icon */}
        <Pressable style={styles.iconButton}>
          <Bell size={22} color={COLORS.textSecondary} />
        </Pressable>
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
                <Heart size={28} color={COLORS.primary} fill={COLORS.primary} />
              ) : (
                <HeartOff size={28} color={COLORS.textSecondary} />
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomNavContent}>
          <Pressable style={[styles.navButton, styles.activeNavButton]}>
            <Heart size={24} color={COLORS.primary} fill={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.disabledNavButton} disabled>
            <MessageSquare size={24} color={COLORS.textSecondary} />
          </Pressable>

          <Pressable style={styles.disabledNavButton} disabled>
            <User size={24} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: 'rgba(194, 24, 117, 0.08)',
    // React Native does not support blur filter natively on absolute divs without Expo BlurView,
    // but a soft translucent background circle provides a very similar premium aesthetic.
  },
  blurBottomRight: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 92, 173, 0.06)',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 223, 0.4)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 20,
    color: COLORS.primary,
  },
  scoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  scoreCapsuleLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  scoreCapsuleValue: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 16,
    color: COLORS.primary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(194, 24, 117, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  comboText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 12,
    color: COLORS.primary,
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
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: 'rgba(194, 24, 117, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    borderRadius: 999,
  },
  activeNavButton: {
    backgroundColor: 'rgba(194, 24, 117, 0.08)',
  },
  disabledNavButton: {
    padding: 10,
    opacity: 0.4,
  },
});
