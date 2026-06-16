import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Heart, MessageSquare, User } from 'lucide-react-native';
import { usePresence } from '../../src/hooks/usePresence';
import { COLORS, SHADOWS } from '../../src/theme';

export default function TabLayout() {
  // Start tracking and subscribing to global user presence in real-time
  usePresence();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide standard tab bar to overlay our custom glass card
        },
      }}
      tabBar={({ state, navigation }) => {
        return (
          <View style={styles.floatingTabBarContainer} pointerEvents="box-none">
            <View style={styles.floatingTabBar}>
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                
                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                const renderIcon = () => {
                  const color = isFocused ? COLORS.white : COLORS.textSecondary;
                  const size = 24;

                  if (route.name === 'index') {
                    return <Heart size={size} color={color} fill={isFocused ? COLORS.white : 'transparent'} />;
                  } else if (route.name === 'chat/index') {
                    return <MessageSquare size={size} color={color} fill={isFocused ? COLORS.white : 'transparent'} />;
                  } else if (route.name === 'profile/index') {
                    return <User size={size} color={color} fill={isFocused ? COLORS.white : 'transparent'} />;
                  }
                  return null;
                };

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={[
                      styles.tabItem,
                      isFocused ? styles.tabItemActive : null
                    ]}
                  >
                    {renderIcon()}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Play' }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chats' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingTabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 24,
    right: 24,
    height: 72,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  floatingTabBar: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    ...SHADOWS.soft,
  },
  tabItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
