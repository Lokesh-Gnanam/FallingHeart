import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface ChatPartner {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  online: boolean;
  lastSeen: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  isRead: boolean;
  vanish: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface Conversation {
  id: string;
  partner: ChatPartner;
  lastMessage?: Message;
  unreadCount: number;
  isHidden: boolean;
}

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  activeConversation: Conversation | null;
  isHiddenChatsUnlocked: boolean;
  loading: boolean;
  searchResults: ChatPartner[];

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: string, vanish?: boolean) => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleHideChat: (conversationId: string, isHidden: boolean) => Promise<void>;
  unlockHiddenChats: (secretKeyInput: string) => boolean;
  lockHiddenChats: () => void;
  searchUsers: (query: string) => Promise<void>;
  startConversation: (targetUserId: string) => Promise<string | null>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: [],
  activeConversation: null,
  isHiddenChatsUnlocked: false,
  loading: false,
  searchResults: [],

  fetchConversations: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    set({ loading: true });
    try {
      // 1. Fetch participants current user is involved with
      const { data: participations, error } = await supabase
        .from('participants')
        .select('conversation_id, is_hidden')
        .eq('user_id', currentUser.id);

      if (error || !participations || participations.length === 0) {
        set({ conversations: [], loading: false });
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);
      const isHiddenMap = new Map(participations.map((p) => [p.conversation_id, p.is_hidden]));

      // 2. Fetch the conversation partners' details
      const { data: partners, error: pError } = await supabase
        .from('participants')
        .select(`
          conversation_id,
          user:profiles (
            id,
            email,
            username,
            display_name,
            avatar_url,
            bio,
            online,
            last_seen
          )
        `)
        .in('conversation_id', conversationIds)
        .neq('user_id', currentUser.id);

      if (pError || !partners) throw pError || new Error('No partners');

      // 3. Fetch messages for unread count and last messages
      const { data: allMessages, error: mError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, message_type, is_read, vanish, created_at, expires_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      const messagesList = allMessages || [];

      // Process last messages
      const lastMessagesMap = new Map<string, Message>();
      const unreadCountMap = new Map<string, number>();

      // Initialize unread counts
      conversationIds.forEach((cid) => unreadCountMap.set(cid, 0));

      messagesList.forEach((msg) => {
        // Exclude vanished / expired messages from listing
        if (msg.expires_at && new Date(msg.expires_at) < new Date()) {
          return;
        }

        const cid = msg.conversation_id;
        
        // Save the first (most recent) message
        if (!lastMessagesMap.has(cid)) {
          lastMessagesMap.set(cid, {
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            content: msg.content,
            messageType: msg.message_type,
            isRead: msg.is_read,
            vanish: msg.vanish,
            createdAt: msg.created_at,
            expiresAt: msg.expires_at,
          });
        }

        // Increment unread count if applicable
        if (msg.sender_id !== currentUser.id && !msg.is_read) {
          unreadCountMap.set(cid, (unreadCountMap.get(cid) || 0) + 1);
        }
      });

      // Construct Conversations array
      const conversationsList: Conversation[] = partners.map((p: any) => {
        const cid = p.conversation_id;
        const u = p.user;

        return {
          id: cid,
          partner: {
            id: u.id,
            email: u.email,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            bio: u.bio,
            online: u.online,
            lastSeen: u.last_seen,
          },
          lastMessage: lastMessagesMap.get(cid),
          unreadCount: unreadCountMap.get(cid) || 0,
          isHidden: isHiddenMap.get(cid) || false,
        };
      });

      // Sort by last message time
      conversationsList.sort((a, b) => {
        const timeA = new Date(a.lastMessage?.createdAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.createdAt || 0).getTime();
        return timeB - timeA;
      });

      set({ conversations: conversationsList, loading: false });
    } catch (e) {
      console.error('Error fetching conversations:', e);
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const nowStr = new Date().toISOString();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .or(`expires_at.is.null,expires_at.gt.${nowStr}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        messageType: m.message_type,
        isRead: m.is_read,
        vanish: m.vanish,
        createdAt: m.created_at,
        expiresAt: m.expires_at,
      }));

      set({ messages: formattedMessages });
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  },

  sendMessage: async (conversationId, content, type = 'text', vanish = false) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return false;

    try {
      const payload: Record<string, any> = {
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content,
        message_type: type,
        vanish,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Optimistically add to messages
      const newMsg: Message = {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        messageType: data.message_type,
        isRead: data.is_read,
        vanish: data.vanish,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };

      set((state) => ({
        messages: [...state.messages, newMsg],
      }));

      // Update conversations list last message
      get().fetchConversations();
      return true;
    } catch (e) {
      console.error('Error sending message:', e);
      return false;
    }
  },

  markAsRead: async (conversationId) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    try {
      // 1. Mark in database
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id)
        .eq('is_read', false);

      if (error) throw error;

      // 2. For vanish mode messages, if the other person read it, set their expires_at to 10 seconds from now
      const { data: vanishMsgs } = await supabase
        .from('messages')
        .select('id, vanish, expires_at')
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id)
        .eq('vanish', true)
        .is('expires_at', null);

      if (vanishMsgs && vanishMsgs.length > 0) {
        const expireTime = new Date(Date.now() + 10 * 1000).toISOString();
        const ids = vanishMsgs.map((m) => m.id);
        
        await supabase
          .from('messages')
          .update({ expires_at: expireTime })
          .in('id', ids);
      }

      // Update local unread counts
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  },

  toggleHideChat: async (conversationId, isHidden) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('participants')
        .update({ is_hidden: isHidden })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, isHidden } : c
        ),
      }));
    } catch (e) {
      console.error('Error hiding/unhiding chat:', e);
    }
  },

  unlockHiddenChats: (secretKeyInput) => {
    const correctKey = useAuthStore.getState().secretKey;
    if (correctKey && secretKeyInput === correctKey) {
      set({ isHiddenChatsUnlocked: true });
      return true;
    }
    return false;
  },

  lockHiddenChats: () => {
    set({ isHiddenChatsUnlocked: false });
  },

  searchUsers: async (query) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || query.trim().length === 0) {
      set({ searchResults: [] });
      return;
    }

    try {
      const cleanQuery = query.trim().toLowerCase();
      // Search profiles by username, display name or code (secret keys hashed but user profile handles are searchable)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, display_name, avatar_url, bio, online, last_seen')
        .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
        .neq('id', currentUser.id)
        .limit(10);

      if (error) throw error;

      const results: ChatPartner[] = (data || []).map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        online: u.online,
        lastSeen: u.last_seen,
      }));

      set({ searchResults: results });
    } catch (e) {
      console.error('Error searching users:', e);
    }
  },

  startConversation: async (targetUserId) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return null;

    try {
      // 1. Check if a conversation already exists
      const { data: myConvs, error: myConvsErr } = await supabase
        .from('participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (myConvsErr) throw myConvsErr;

      const myConvIds = (myConvs || []).map((c) => c.conversation_id);

      if (myConvIds.length > 0) {
        const { data: commonConvs, error: commonConvsErr } = await supabase
          .from('participants')
          .select('conversation_id')
          .in('conversation_id', myConvIds)
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (!commonConvsErr && commonConvs) {
          // Unhide the chat if it was hidden
          await supabase
            .from('participants')
            .update({ is_hidden: false })
            .eq('conversation_id', commonConvs.conversation_id)
            .eq('user_id', currentUser.id);

          return commonConvs.conversation_id;
        }
      }

      // 2. Create new conversation
      const { data: newConv, error: newConvErr } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (newConvErr || !newConv) throw newConvErr || new Error('Failed to create conv');

      // 3. Add participants
      const { error: partErr } = await supabase.from('participants').insert([
        { conversation_id: newConv.id, user_id: currentUser.id, is_hidden: false },
        { conversation_id: newConv.id, user_id: targetUserId, is_hidden: false },
      ]);

      if (partErr) throw partErr;

      await get().fetchConversations();
      return newConv.id;
    } catch (e) {
      console.error('Error starting conversation:', e);
      return null;
    }
  },
}));
