import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Heart } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface LogoHeaderProps {
  subtitle?: string;
  style?: ViewStyle;
  isUppercaseSubtitle?: boolean;
  subtitleLetterSpacing?: number;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({
  subtitle,
  style,
  isUppercaseSubtitle = false,
  subtitleLetterSpacing = 0,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Heart size={36} color={COLORS.primary} strokeWidth={2.5} />
      </View>
      <Text style={styles.title}>FallingHearts</Text>
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              letterSpacing: subtitleLetterSpacing,
              textTransform: isUppercaseSubtitle ? 'uppercase' : 'none',
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 32,
    color: COLORS.primary,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
