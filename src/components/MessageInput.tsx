import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Heart, Smile, Send } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useTheme, LIGHT_COLORS, TYPOGRAPHY } from '../theme';

interface MessageInputProps {
  onSend: (text: string) => void;
  onSendHeart: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, onSendHeart }) => {
  const [text, setText] = useState('');
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleSend = () => {
    if (text.trim().length === 0) return;
    onSend(text);
    setText('');
  };

  const isTyping = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.glassContainer}>
        {/* Heart reaction button */}
        <Pressable onPress={onSendHeart} style={styles.heartButton}>
          <MotiView
            animate={{
              scale: isTyping ? [1, 1.15, 1] : 1,
            }}
            transition={{
              type: 'timing',
              duration: 1200,
              loop: isTyping,
            }}
          >
            <Heart 
              size={22} 
              color={colors.primary} 
              fill={isTyping ? colors.primary : 'transparent'} 
              strokeWidth={2}
            />
          </MotiView>
        </Pressable>

        {/* Text Input capsule */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a Secret"
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={handleSend}
            autoCapitalize="none"
          />
          <Pressable style={styles.emojiButton}>
            <Smile size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={!isTyping}
          style={[styles.sendButton, isTyping ? styles.sendButtonActive : styles.sendButtonDisabled]}
        >
          <Send size={18} color={LIGHT_COLORS.white} />
        </Pressable>
      </View>
    </View>
  );
};

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  glassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(31, 22, 28, 0.82)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  heartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(244, 243, 251, 0.5)' : 'rgba(20, 15, 18, 0.5)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(172, 36, 113, 0.3)',
    shadowColor: 'transparent',
  },
});
