import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useChatStore, Message } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to subscribe to messages in a specific conversation.
 * Appends new messages, updates edited/read receipts, handles deletions (for vanish mode),
 * and automatically triggers marking partner's messages as read.
 */
export const useMessages = (conversationId: string) => {
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const markAsRead = useChatStore((state) => state.markAsRead);

  useEffect(() => {
    if (!conversationId) return;

    // Load initial messages for active chat room
    fetchMessages(conversationId);
    markAsRead(conversationId);

    // Subscribe to realtime database operations on the messages table
    const hookId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`chat-messages-room-${conversationId}-${hookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const currentUser = useAuthStore.getState().user;
          if (!currentUser) return;

          if (payload.eventType === 'INSERT') {
            const msg = payload.new;
            const newMsg: Message = {
              id: msg.id,
              conversationId: msg.conversation_id,
              senderId: msg.sender_id,
              content: msg.content,
              messageType: msg.message_type,
              isRead: msg.is_read,
              vanish: msg.vanish,
              createdAt: msg.created_at,
              expiresAt: msg.expires_at,
            };

            // Prevent duplicate message rendering
            useChatStore.setState((state) => {
              if (state.messages.some((m) => m.id === newMsg.id)) {
                return state;
              }
              return { messages: [...state.messages, newMsg] };
            });

            // Automatically mark received messages as read
            if (msg.sender_id !== currentUser.id) {
              await markAsRead(conversationId);
            }
          } else if (payload.eventType === 'UPDATE') {
            const msg = payload.new;
            const updatedMsg: Message = {
              id: msg.id,
              conversationId: msg.conversation_id,
              senderId: msg.sender_id,
              content: msg.content,
              messageType: msg.message_type,
              isRead: msg.is_read,
              vanish: msg.vanish,
              createdAt: msg.created_at,
              expiresAt: msg.expires_at,
            };

            useChatStore.setState((state) => ({
              messages: state.messages.map((m) =>
                m.id === updatedMsg.id ? updatedMsg : m
              ),
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            useChatStore.setState((state) => ({
              messages: state.messages.filter((m) => m.id !== deletedId),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages, markAsRead]);
};
