import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';
import { Heart, Plus } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../theme';

interface HeartBasketProps {
  catcherX: Animated.SharedValue<number>;
  catcherWidth: number;
  catcherHeight: number;
  yPosition: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HeartBasket: React.FC<HeartBasketProps> = ({
  catcherX,
  catcherWidth,
  catcherHeight,
  yPosition,
}) => {
  const startX = useSharedValue(SCREEN_WIDTH / 2);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = catcherX.value;
      scale.value = withSpring(1.08, { damping: 10 });
    })
    .onUpdate((event) => {
      const nextX = startX.value + event.translationX;
      // Clamp between boundaries
      const minX = catcherWidth / 2;
      const maxX = SCREEN_WIDTH - catcherWidth / 2;
      catcherX.value = Math.max(minX, Math.min(maxX, nextX));
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 10 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: catcherX.value - catcherWidth / 2 },
        { scale: scale.value }
      ] as any,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          SHADOWS.glow,
          animatedStyle,
          {
            width: catcherWidth,
            height: catcherHeight,
            top: yPosition,
            borderRadius: catcherHeight / 2,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Heart size={36} color={COLORS.primary} fill={COLORS.primary} />
          <View style={styles.plusContainer}>
            <Plus size={16} color={COLORS.white} strokeWidth={4} />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 2,
    borderColor: 'rgba(194, 24, 117, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Glassmorphism blur
    backdropFilter: 'blur(20px)',
  } as any,
  iconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusContainer: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
