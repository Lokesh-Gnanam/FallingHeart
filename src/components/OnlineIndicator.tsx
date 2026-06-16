import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface OnlineIndicatorProps {
  online: boolean;
  lastSeen?: string;
  showText?: boolean;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ online, lastSeen, showText = false }) => {
  if (showText) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, online ? styles.onlineDot : styles.offlineDot]} />
        <Text style={styles.text}>
          {online ? 'ACTIVE NOW' : lastSeen ? `LAST SEEN ${new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'OFFLINE'}
        </Text>
      </View>
    );
  }

  return online ? <View style={[styles.dot, styles.onlineDot]} /> : null;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: '#22C55E', // neon green
  },
  offlineDot: {
    backgroundColor: COLORS.textSecondary,
  },
  text: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 9,
    color: COLORS.primary,
    opacity: 0.7,
    letterSpacing: 1.5,
  },
});
