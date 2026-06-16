import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'gradient' | 'white';
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'gradient',
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  if (variant === 'white') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          styles.whiteButton,
          SHADOWS.soft,
          animatedStyle,
          style,
          disabled ? { opacity: 0.6 } : null
        ]}
      >
        <Text style={[styles.text, styles.whiteButtonText, textStyle]}>{title}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button, 
        animatedStyle, 
        style,
        disabled ? { opacity: 0.6 } : null
      ]}
    >
      <LinearGradient
        colors={COLORS.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.text, styles.gradientButtonText, textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  whiteButton: {
    backgroundColor: COLORS.white,
  },
  text: {
    fontFamily: TYPOGRAPHY.weights.semiBold,
    fontSize: 16,
    letterSpacing: 1,
  },
  whiteButtonText: {
    color: COLORS.primary,
  },
  gradientButtonText: {
    color: COLORS.white,
  },
});
