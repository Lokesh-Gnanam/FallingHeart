import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../theme';

interface ProfileAvatarProps {
  uri?: string;
  name?: string;
  online?: boolean;
  size?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ uri, name = '?', online = false, size = 56 }) => {
  const innerSize = size - 4;
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <View style={[styles.innerBorder, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
          {uri ? (
            <Image
              source={{ uri }}
              style={[styles.avatar, { width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }]}
            />
          ) : (
            <View style={[styles.initialContainer, { width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }]}>
              <Text style={[styles.initialText, { fontSize: Math.floor(size * 0.4) }]}>{initial}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
      
      {online && (
        <View style={styles.dot} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  innerBorder: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    resizeMode: 'cover',
  },
  initialContainer: {
    backgroundColor: '#F3E5ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E', // Green dot
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
