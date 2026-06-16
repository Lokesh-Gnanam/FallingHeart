import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
  useFrameCallback,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { COLORS } from '../../theme';

interface FallingHeartProps {
  id: string;
  x: number;
  type: 'normal' | 'golden';
  speed: number;
  catcherX: Animated.SharedValue<number>;
  catcherWidth: number;
  catcherHeight: number;
  catcherY: number;
  heartSize: number;
  onCatch: (id: string, type: 'normal' | 'golden', x: number, y: number) => void;
  onMiss: (id: string) => void;
}

export const FallingHeart: React.FC<FallingHeartProps> = ({
  id,
  x,
  type,
  speed,
  catcherX,
  catcherWidth,
  catcherHeight,
  catcherY,
  heartSize,
  onCatch,
  onMiss,
}) => {
  const y = useSharedValue(-50);
  const hasCollidedShared = useSharedValue(false);

  useEffect(() => {
    // Start falling animation
    y.value = withTiming(
      catcherY + 120, // Fall past catcher slightly before removing
      {
        duration: speed,
        easing: Easing.linear,
      },
      (isFinished) => {
        if (isFinished && !hasCollidedShared.value) {
          runOnJS(onMiss)(id);
        }
      }
    );

    return () => {
      cancelAnimation(y);
    };
  }, []);

  // Frame callback for collision detection on UI thread
  useFrameCallback(() => {
    'worklet';
    if (hasCollidedShared.value) return;

    const currentY = y.value;
    const cx = catcherX.value;

    // Bounding box collision check (using slightly tight/forgiving horizontal overlap)
    const isColliding =
      currentY + heartSize >= catcherY &&
      currentY <= catcherY + catcherHeight &&
      x + heartSize >= cx - catcherWidth / 2 &&
      x <= cx + catcherWidth / 2;

    if (isColliding) {
      hasCollidedShared.value = true;
      cancelAnimation(y);
      runOnJS(onCatch)(id, type, x, currentY);
    }
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x },
        { translateY: y.value },
      ] as any,
    };
  });

  const heartColor = type === 'golden' ? '#FFD700' : COLORS.primary;
  const strokeColor = type === 'golden' ? '#FFA500' : COLORS.primary;

  return (
    <Animated.View style={[styles.heart, { width: heartSize, height: heartSize }, animatedStyle]}>
      <Heart
        size={heartSize}
        color={strokeColor}
        fill={heartColor}
        strokeWidth={1.5}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});
