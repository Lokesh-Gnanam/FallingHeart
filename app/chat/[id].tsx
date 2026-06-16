import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, ShieldAlert } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useChatStore, Message } from '../../src/store/chatStore';
import { useProfileStore } from '../../src/store/profileStore';
import { useMessages } from '../../src/hooks/useMessages';
import { ChatBubble } from '../../src/components/ChatBubble';
import { MessageInput } from '../../src/components/MessageInput';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { OnlineIndicator } from '../../src/components/OnlineIndicator';
import { useTheme, LIGHT_COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme';

interface FloatingHeartData {
  id: string;
  left: number;
  size: number;
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as string;

  const { colors } = useTheme();
  const styles = getStyles(colors);

  const {
    conversations,
    messages,
    sendMessage,
    deleteMessage,
  } = useChatStore();

  const { settings, updateSetting } = useProfileStore();

  // Establish realtime message subscription
  useMessages(conversationId);

  const flatListRef = useRef<FlatList>(null);
  const [backgroundHearts, setBackgroundHearts] = useState<FloatingHeartData[]>([]);

  // Find target conversation meta
  const conversation = conversations.find((c) => c.id === conversationId);

  // Automatically scroll list to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const spawnFloatingHeart = () => {
    const newHeart: FloatingHeartData = {
      id: Math.random().toString(),
      left: Math.random() * 80 + 10, // keep padding from screen edges
      size: Math.random() * 14 + 12,
    };
    
    setBackgroundHearts((prev) => [...prev, newHeart]);
    
    // Cleanup heart from state
    setTimeout(() => {
      setBackgroundHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2800);
  };

  const handleSendMessage = async (text: string) => {
    const success = await sendMessage(conversationId, text, 'text', settings.vanishMode);
    if (success) {
      spawnFloatingHeart();
    }
  };

  const handleSendHeart = async () => {
    router.push('/game/play');
  };

  const handleVanishExpired = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.errorText}>Establishing secure channel...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Background Floating Hearts */}
      <View style={styles.heartsBackground} pointerEvents="none">
        {backgroundHearts.map((h) => (
          <MotiView
            key={h.id}
            from={{ translateY: 0, opacity: 0.8, scale: 0.6, rotate: '0deg' }}
            animate={{ translateY: -SCREEN_HEIGHT * 0.7, opacity: 0, scale: 1.3, rotate: '20deg' }}
            transition={{ type: 'timing', duration: 2500 }}
            style={[styles.floatingHeart, { left: `${h.left}%` }]}
          >
            <Heart size={h.size} color={colors.primary} fill={colors.primary} style={{ opacity: 0.25 }} />
          </MotiView>
        ))}
      </View>

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </Pressable>
          
          <ProfileAvatar
            uri={conversation.partner.avatarUrl}
            name={conversation.partner.displayName || conversation.partner.username}
            online={conversation.partner.online}
            size={40}
          />
          
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {conversation.partner.displayName || conversation.partner.username}
            </Text>
            <OnlineIndicator online={conversation.partner.online} lastSeen={conversation.partner.lastSeen} showText={true} />
          </View>
        </View>

        {/* Vanish mode quick toggle in top bar */}
        <Pressable
          onPress={() => updateSetting('vanishMode', !settings.vanishMode)}
          style={[
            styles.vanishToggle,
            settings.vanishMode ? styles.vanishToggleActive : styles.vanishToggleInactive,
          ]}
        >
          <Text style={[styles.vanishToggleText, settings.vanishMode ? styles.vanishTextActive : null]}>
            VANISH
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardView}
      >
        {/* Vanish Mode Banner */}
        {settings.vanishMode && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.vanishBanner}
          >
            <ShieldAlert size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.vanishBannerText}>
              Vanish Mode active. Seen messages will disappear after 10s.
            </Text>
          </MotiView>
        )}

        {/* Chat Canvas (Messages list) */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isCurrentUser={item.senderId !== conversation.partner.id}
              onVanishExpired={handleVanishExpired}
            />
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>This channel is end-to-end encrypted.</Text>
              <Text style={styles.emptySubtitle}>Start typing to whisper your secrets...</Text>
            </View>
          }
        />

        {/* Chat input footer */}
        <MessageInput onSend={handleSendMessage} onSendHeart={handleSendHeart} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  heartsBackground: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 80,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 14,
    color: colors.primary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(250, 248, 255, 0.8)' : 'rgba(31, 22, 28, 0.9)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  partnerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  partnerName: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  vanishToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  vanishToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  vanishToggleInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  vanishToggleText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.primary,
  },
  vanishTextActive: {
    color: LIGHT_COLORS.white,
  },
  vanishBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(172, 36, 113, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vanishBannerText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 10,
    color: colors.primary,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 13,
    color: colors.primary,
    opacity: 0.8,
  },
  emptySubtitle: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
