import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Lock, Unlock, ChevronRight, Plus, MessageSquare } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useChatStore, Conversation, ChatPartner } from '../../../src/store/chatStore';
import { useAuthStore } from '../../../src/store/authStore';
import { ProfileAvatar } from '../../../src/components/ProfileAvatar';
import { OnlineIndicator } from '../../../src/components/OnlineIndicator';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../../src/theme';

export default function ChatListScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  
  const {
    conversations,
    loading,
    searchResults,
    isHiddenChatsUnlocked,
    fetchConversations,
    searchUsers,
    startConversation,
    unlockHiddenChats,
    lockHiddenChats,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'hidden'>('chats');

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    
    // Auto lock hidden chats on mount
    lockHiddenChats();
  }, []);

  // Run search when query changes
  useEffect(() => {
    searchUsers(searchQuery);
  }, [searchQuery]);

  const handleUnlockHidden = () => {
    if (!pinInput) return;
    const success = unlockHiddenChats(pinInput);
    setPinInput('');
    if (success) {
      setPinModalVisible(false);
      setActiveTab('hidden');
    } else {
      Alert.alert('Access Denied', 'Invalid Secret Key.');
    }
  };

  const handleCreateChat = async (partnerId: string) => {
    setSearchQuery('');
    const convId = await startConversation(partnerId);
    if (convId) {
      router.push(`/chat/${convId}`);
    } else {
      Alert.alert('Error', 'Failed to establish encrypted channel.');
    }
  };

  // Filter conversations based on visibility settings
  const visibleConversations = conversations.filter((c) => {
    if (activeTab === 'hidden') {
      return c.isHidden;
    }
    return !c.isHidden;
  });

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isUnread = item.unreadCount > 0;
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.chatCardWrapper}
      >
        <Pressable
          onPress={() => router.push(`/chat/${item.id}`)}
          style={({ pressed }) => [
            styles.chatCard,
            pressed ? styles.chatCardPressed : null,
          ]}
        >
          <ProfileAvatar
            uri={item.partner.avatarUrl}
            name={item.partner.displayName || item.partner.username}
            online={item.partner.online}
            size={56}
          />
          
          <View style={styles.chatCardContent}>
            <View style={styles.chatCardHeader}>
              <Text style={styles.partnerName} numberOfLines={1}>
                {item.partner.displayName || item.partner.username}
              </Text>
              {item.lastMessage && (
                <Text style={styles.timestampText}>
                  {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
            
            <View style={styles.chatCardBody}>
              <Text 
                style={[
                  styles.lastMessageText,
                  isUnread ? styles.lastMessageTextUnread : null
                ]} 
                numberOfLines={1}
              >
                {item.lastMessage ? item.lastMessage.content : 'No messages yet'}
              </Text>
              
              {isUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </MotiView>
    );
  };

  const renderSearchItem = ({ item }: { item: ChatPartner }) => (
    <Pressable
      onPress={() => handleCreateChat(item.id)}
      style={styles.searchItem}
    >
      <ProfileAvatar
        uri={item.avatarUrl}
        name={item.displayName || item.username}
        online={item.online}
        size={44}
      />
      <View style={styles.searchItemInfo}>
        <Text style={styles.searchItemName}>{item.displayName || item.username}</Text>
        <Text style={styles.searchItemUsername}>@{item.username}</Text>
      </View>
      <Plus size={20} color={COLORS.primary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Application Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <ProfileAvatar
            uri={currentUser?.avatarUrl}
            name={currentUser?.displayName || currentUser?.username}
            size={40}
          />
          <Text style={styles.appBarTitle}>Secret Hearts</Text>
        </View>
        
        {activeTab === 'hidden' && (
          <Pressable
            onPress={() => {
              lockHiddenChats();
              setActiveTab('chats');
            }}
            style={styles.lockButton}
          >
            <Lock size={18} color={COLORS.primary} />
            <Text style={styles.lockButtonText}>LOCK</Text>
          </Pressable>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search username or secret code..."
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Search Results / Recent list switcher */}
      {searchQuery.trim().length > 0 ? (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.sectionHeader}>SEARCH RESULTS</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.searchListContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No users matched your query.</Text>
            }
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {/* Hidden Chats Access trigger (only shown when in normal chat view) */}
          {activeTab === 'chats' && (
            <Pressable
              onPress={() => {
                if (isHiddenChatsUnlocked) {
                  setActiveTab('hidden');
                } else {
                  setPinModalVisible(true);
                }
              }}
              style={[styles.hiddenChatsCard, SHADOWS.soft]}
            >
              <View style={styles.hiddenCardLeft}>
                <View style={styles.lockIconBg}>
                  <Lock size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.hiddenCardTitle}>Hidden Chats</Text>
              </View>
              <View style={styles.hiddenCardRight}>
                {isHiddenChatsUnlocked && (
                  <Text style={styles.unlockedLabel}>UNLOCKED</Text>
                )}
                <ChevronRight size={18} color={COLORS.textSecondary} />
              </View>
            </Pressable>
          )}

          {activeTab === 'hidden' && (
            <View style={styles.hiddenHeader}>
              <Unlock size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.hiddenHeaderTitle}>Hidden Whispers</Text>
            </View>
          )}

          {/* Conversations List */}
          <Text style={styles.sectionHeader}>
            {activeTab === 'hidden' ? 'SECURE CONVERSATIONS' : 'MESSAGES'}
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={visibleConversations}
              keyExtractor={(item) => item.id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.chatListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MessageSquare size={40} color={COLORS.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Text style={styles.emptyText}>
                    {activeTab === 'hidden'
                      ? 'No hidden chats locked.'
                      : 'Create a secret heart to start chatting.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={() => Alert.alert('Discreet Invite', 'Invite friends by searching their exact username in the bar above.')}
        style={[styles.fab, SHADOWS.glow]}
      >
        <Plus size={24} color={COLORS.white} />
      </Pressable>

      {/* Passcode Entry Modal */}
      <Modal
        visible={pinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.modalCard}
          >
            <Text style={styles.modalTitle}>Enter Secret Key</Text>
            <Text style={styles.modalSubtitle}>Verify credentials to unlock hidden enclave</Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={pinInput => setPinInput(pinInput)}
              placeholder="Secret Key"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry={true}
              autoFocus={true}
              autoCapitalize="none"
              onSubmitEditing={handleUnlockHidden}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setPinModalVisible(false);
                  setPinInput('');
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleUnlockHidden}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Unlock</Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 223, 0.4)',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBarTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 20,
    color: COLORS.primary,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(172, 36, 113, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  lockButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: COLORS.primary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
  },
  hiddenChatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  hiddenCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(172, 36, 113, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenCardTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  hiddenCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 9,
    color: COLORS.primary,
    backgroundColor: 'rgba(172, 36, 113, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hiddenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(172, 36, 113, 0.06)',
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 8,
  },
  hiddenHeaderTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  chatListContent: {
    paddingBottom: 100, // leave space for FAB and floating tab bar
  },
  chatCardWrapper: {
    marginVertical: 4,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  chatCardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  chatCardContent: {
    flex: 1,
  },
  chatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  partnerName: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  timestampText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chatCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  lastMessageTextUnread: {
    fontFamily: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  unreadBadge: {
    backgroundColor: COLORS.secondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  unreadBadgeText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchListContent: {
    paddingBottom: 100,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 223, 0.2)',
  },
  searchItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchItemName: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  searchItemUsername: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loader: {
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 122 : 112, // sits exactly above the custom floating tab bar
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 27, 33, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  pinInput: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: COLORS.white,
  },
});
