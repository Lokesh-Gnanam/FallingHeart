import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MotiView } from 'moti';
import { COLORS } from '../../theme';

export interface FloatingScoreItem {
  id: string;
  x: number;
  y: number;
  points: number;
  isComboBonus: boolean;
  type: 'normal' | 'golden';
}

export interface ParticleItem {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

interface ScoreEffectProps {
  scoreItem: FloatingScoreItem;
  particles: ParticleItem[];
}

export const ScoreEffect: React.FC<ScoreEffectProps> = ({ scoreItem, particles }) => {
  const isGolden = scoreItem.type === 'golden';
  const textColor = isGolden ? '#FFA500' : COLORS.primary;
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Particle Burst */}
      {particles.map((p) => (
        <MotiView
          key={p.id}
          from={{
            opacity: 1,
            translateX: p.x,
            translateY: p.y,
            scale: 1,
          }}
          animate={{
            opacity: 0,
            translateX: p.x + p.dx,
            translateY: p.y + p.dy,
            scale: 0.2,
          }}
          transition={{
            type: 'timing',
            duration: 500,
          }}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
            },
          ]}
        />
      ))}

      {/* Floating Score Badge */}
      <MotiView
        from={{
          opacity: 1,
          translateY: scoreItem.y,
          scale: 0.8,
        }}
        animate={{
          opacity: 0,
          translateY: scoreItem.y - 70,
          scale: 1.3,
        }}
        transition={{
          type: 'timing',
          duration: 600,
        }}
        style={[styles.floatingScore, { left: scoreItem.x }]}
      >
        <Text style={[styles.scoreText, { color: textColor }, isGolden && styles.goldenTextShadow]}>
          +{scoreItem.points}
        </Text>
        {scoreItem.isComboBonus && (
          <Text style={styles.comboMultiplierText}>COMBO x2</Text>
        )}
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingScore: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(255, 92, 173, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  goldenTextShadow: {
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
  },
  comboMultiplierText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FF5CAD',
    marginTop: -4,
  },
});
