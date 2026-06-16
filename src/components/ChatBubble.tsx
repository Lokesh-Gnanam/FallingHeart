import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '../theme';
import { Message } from '../store/chatStore';

interface ChatBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onVanishExpired?: (id: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser, onVanishExpired }) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    // If vanish mode is active and expiresAt is set, start the countdown
    if (!message.vanish || !message.expiresAt) return;

    const calculateTimeLeft = () => {
      const diff = new Date(message.expiresAt!).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / 1000));
    };

    setSecondsLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setSecondsLeft(left);
      
      if (left <= 0) {
        clearInterval(timer);
        if (onVanishExpired) {
          onVanishExpired(message.id);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [message.vanish, message.expiresAt, message.id, onVanishExpired]);

  const showVanishCountdown = message.vanish && secondsLeft !== null;

  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUserContainer : styles.partnerContainer]}>
      <View
        style={[
          styles.bubble,
          isCurrentUser ? styles.currentUserBubble : styles.partnerBubble,
          message.vanish ? styles.vanishBubble : null,
        ]}
      >
        <Text style={[styles.text, isCurrentUser ? styles.currentUserText : styles.partnerText]}>
          {message.content}
        </Text>
        
        <View style={styles.meta}>
          <Text style={[styles.timeText, isCurrentUser ? styles.currentUserTimeText : styles.partnerTimeText]}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          {isCurrentUser && (
            <View style={styles.ticks}>
              {message.isRead ? (
                <CheckCheck size={14} color="#FF5CAD" strokeWidth={2.5} />
              ) : (
                <Check size={14} color={COLORS.textSecondary} style={{ opacity: 0.6 }} />
              )}
            </View>
          )}

          {showVanishCountdown && (
            <View style={styles.vanishBadge}>
              <Clock size={10} color={COLORS.primary} style={styles.vanishIcon} />
              <Text style={styles.vanishText}>{secondsLeft}s</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
    flexDirection: 'row',
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  partnerContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  currentUserBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  partnerBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomLeftRadius: 4,
  },
  vanishBubble: {
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  text: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  currentUserText: {
    color: COLORS.white,
  },
  partnerText: {
    color: COLORS.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 9,
  },
  currentUserTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  partnerTimeText: {
    color: COLORS.textSecondary,
  },
  ticks: {
    marginLeft: 2,
  },
  vanishBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(172, 36, 113, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  vanishIcon: {
    marginRight: 2,
  },
  vanishText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 9,
    color: COLORS.primary,
  },
});
