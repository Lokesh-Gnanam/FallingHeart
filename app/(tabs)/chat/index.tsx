import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Lock, Unlock, ChevronRight, Plus, MessageSquare } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useChatStore, Conversation, ChatPartner } from '../../../src/store/chatStore';
import { useAuthStore } from '../../../src/store/authStore';
import { ProfileAvatar } from '../../../src/components/ProfileAvatar';
import { OnlineIndicator } from '../../../src/components/OnlineIndicator';
import { useTheme, LIGHT_COLORS, TYPOGRAPHY, SHADOWS } from '../../../src/theme';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

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
      Alert.alert('Access Denied', 'Invalid Password.');
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
      <Plus size={20} color={colors.primary} />
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
            <Lock size={18} color={colors.primary} />
            <Text style={styles.lockButtonText}>LOCK</Text>
          </Pressable>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search username..."
            placeholderTextColor={colors.textSecondary}
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
                  <Lock size={18} color={colors.primary} />
                </View>
                <Text style={styles.hiddenCardTitle}>Hidden Chats</Text>
              </View>
              <View style={styles.hiddenCardRight}>
                {isHiddenChatsUnlocked && (
                  <Text style={styles.unlockedLabel}>UNLOCKED</Text>
                )}
                <ChevronRight size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          )}

          {activeTab === 'hidden' && (
            <View style={styles.hiddenHeader}>
              <Unlock size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.hiddenHeaderTitle}>Hidden Whispers</Text>
            </View>
          )}

          {/* Conversations List */}
          <Text style={styles.sectionHeader}>
            {activeTab === 'hidden' ? 'SECURE CONVERSATIONS' : 'MESSAGES'}
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={visibleConversations}
              keyExtractor={(item) => item.id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.chatListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MessageSquare size={40} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
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
        <Plus size={24} color={LIGHT_COLORS.white} />
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
            <Text style={styles.modalTitle}>Enter Password</Text>
            <Text style={styles.modalSubtitle}>Verify credentials to unlock hidden chats</Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={pinInput => setPinInput(pinInput)}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
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

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBarTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 20,
    color: colors.primary,
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
    color: colors.primary,
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
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(31, 22, 28, 0.6)',
    borderWidth: 1.5,
    borderColor: colors.border,
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
    color: colors.textPrimary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
  },
  hiddenChatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    color: colors.textPrimary,
  },
  hiddenCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedLabel: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 9,
    color: colors.primary,
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
    color: colors.primary,
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
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(31, 22, 28, 0.4)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  chatCardPressed: {
    backgroundColor: colors.cardBackground === '#FFFFFF' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 22, 28, 0.8)',
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
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  timestampText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  chatCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  lastMessageTextUnread: {
    fontFamily: TYPOGRAPHY.weights.medium,
    color: colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: colors.secondary,
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
    color: LIGHT_COLORS.white,
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
    borderBottomColor: colors.border,
  },
  searchItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchItemName: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  searchItemUsername: {
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.secondary,
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
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: TYPOGRAPHY.weights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  pinInput: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontFamily: TYPOGRAPHY.weights.regular,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: colors.cardBackground,
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
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: TYPOGRAPHY.weights.bold,
    fontSize: 14,
    color: LIGHT_COLORS.white,
  },
});
