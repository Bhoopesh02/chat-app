import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase/firebase';
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import NewChatModal from '../components/NewChatModal';
import CreateGroupModal from '../components/CreateGroupModal';
import SettingsModal from '../components/SettingsModal';
import UserProfileModal from '../components/UserProfileModal';
import GroupDetailsModal from '../components/GroupDetailsModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import ChatMediaGallery from '../components/ChatMediaGallery';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ManageListsModal from '../components/ManageListsModal';
import AddToListModal from '../components/AddToListModal';
import { Copy, Star, Trash2, Forward, X } from 'lucide-react';
import { chatService } from '../services/chatService';

const Chat = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // id of active conversation/group
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [favourites, setFavourites] = useState({});
  const [userLists, setUserLists] = useState([]);
  
  // New feature states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null); // { type: 'chat' | 'clear' | 'messages', ids?: [] }
  const [isForwarding, setIsForwarding] = useState(false);
  
  // Modals state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedUserToView, setSelectedUserToView] = useState(null);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const [isManageListsOpen, setIsManageListsOpen] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [selectedChatForList, setSelectedChatForList] = useState(null);

  // Mobile sidebar state
  const [isSidebarActive, setIsSidebarActive] = useState(true);

  // Real-time listeners
  useEffect(() => {
    const unsubscribeUsers = chatService.subscribeToUsers(setUsers);
    const unsubscribeConversations = chatService.subscribeToUserConversations(currentUser.uid, (loadedConversations) => {
      setConversations(loadedConversations);
      // Automatically mark incoming messages as delivered when received by recipient's active client
      chatService.processIncomingDelivery(currentUser.uid, loadedConversations);
    });

    const unsubFav = chatService.subscribeToFavourites(currentUser.uid, setFavourites);
    const unsubLists = chatService.subscribeToLists(currentUser.uid, setUserLists);

    return () => {
      unsubscribeUsers();
      unsubscribeConversations();
      unsubFav();
      unsubLists();
    };
  }, [currentUser.uid]);

  // Messages listener (only for active chat)
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const unsubscribeMessages = chatService.subscribeToMessages(activeChat, setMessages);
    
    return () => {
      unsubscribeMessages();
    };
  }, [activeChat]);

  // Listen to unread counts for all conversations
  useEffect(() => {
    if (!currentUser || conversations.length === 0) return;
    
    const unsubscribes = conversations.map(conv => {
      return chatService.subscribeToUnreadCount(conv.id, currentUser.uid, (count) => {
        setUnreadCounts(prev => ({
          ...prev,
          [conv.id]: count
        }));
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [conversations, currentUser.uid]);

  const currentUserProfile = users.find(u => u.id === currentUser.uid) || {};

  // Compute total unread count (excluding muted conversations)
  const totalUnread = Object.entries(unreadCounts).reduce((acc, [convId, count]) => {
    const isMuted = currentUserProfile.mutedConversations?.[convId];
    return acc + (isMuted ? 0 : count);
  }, 0);

  useEffect(() => {
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Chat App`;
    } else {
      document.title = 'Chat App';
    }
  }, [totalUnread]);

  // Mark incoming messages in active conversation as read when visible
  useEffect(() => {
    if (!activeChat || messages.length === 0) return;

    const markActiveMessagesAsRead = () => {
      if (document.visibilityState === 'visible') {
        const unreadMsgIds = messages
          .filter(msg => msg.senderId !== currentUser.uid && msg.status !== 'read')
          .map(msg => msg.id);

        if (unreadMsgIds.length > 0) {
          chatService.markMessagesAsRead(activeChat, unreadMsgIds);
        }

        // Also reset the new unreadCount badge
        chatService.resetUnreadCount(activeChat, currentUser.uid);
      }
    };

    markActiveMessagesAsRead();

    const handleVisibilityChange = () => {
      markActiveMessagesAsRead();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeChat, messages, currentUser.uid]);

  // When a chat is selected, hide sidebar on mobile
  const handleSelectChat = (chatId) => {
    setActiveChat(chatId);
    setIsSidebarActive(false);
    setSelectionMode(false);
    setSelectedMessages(new Set());
    setIsSearchActive(false);
    setChatSearchQuery('');
  };

  const handleBackToSidebar = () => {
    setIsSidebarActive(true);
    setActiveChat(null);
    setIsGroupDetailsOpen(false);
    setIsGroupSettingsOpen(false);
    setIsMediaGalleryOpen(false);
  };

  const handleSendMessage = async (text, mediaData = null) => {
    if (!activeChat || (!text.trim() && !mediaData) || !activeChatData) return;
    try {
      await chatService.sendMessage(activeChat, currentUser.uid, text ? text.trim() : '', activeChatData.participants, mediaData);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleStartChat = async (targetUserId) => {
    try {
      const convId = await chatService.createPrivateConversation(currentUser.uid, targetUserId);
      
      if (isForwarding) {
        // Forward selected messages
        for (const msgId of selectedMessages) {
          const msg = messages.find(m => m.id === msgId);
          if (msg) {
            let mediaData = null;
            if (msg.type !== 'text' && msg.type !== 'system') {
              mediaData = { type: msg.type, mediaUrl: msg.mediaUrl, fileName: msg.fileName, fileFormat: msg.fileFormat };
            }
            if (msg.type !== 'system') {
              await chatService.sendMessage(convId, currentUser.uid, msg.text, [], mediaData);
            }
          }
        }
        setIsForwarding(false);
        setSelectionMode(false);
        setSelectedMessages(new Set());
      }
      
      handleSelectChat(convId);
      setIsNewChatOpen(false);
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  const handleCreateGroup = async (name, selectedMembers) => {
    try {
      const convId = await chatService.createGroup(name, selectedMembers, currentUser.uid);
      handleSelectChat(convId);
      setIsCreateGroupOpen(false);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const handleAddGroupMembers = async (conversationId, memberIds) => {
    try {
      await chatService.addGroupMembers(conversationId, memberIds);
    } catch (err) {
      console.error("Error adding members:", err);
    }
  };

  const handleMakeGroupAdmin = async (conversationId, userId) => {
    try {
      await chatService.makeGroupAdmin(conversationId, userId);
    } catch (err) {
      console.error("Error making admin:", err);
    }
  };

  const handleLeaveGroup = async (conversationId) => {
    try {
      await chatService.leaveGroup(
        conversationId, 
        currentUser.uid, 
        currentUser.displayName || currentUser.name || 'A user'
      );
      setIsGroupDetailsOpen(false);
      handleBackToSidebar();
    } catch (err) {
      console.error("Error leaving group:", err);
    }
  };

  const handleRemoveGroupMember = async (conversationId, userId) => {
    try {
      const removedUser = users.find(u => u.id === userId);
      const removedUserName = removedUser ? removedUser.name : 'A user';
      await chatService.removeGroupMember(
        conversationId, 
        userId, 
        currentUser.displayName || currentUser.name || 'Admin',
        removedUserName
      );
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleToggleFavourite = async () => {
    if (!activeChat) return;
    const isFav = favourites[activeChat];
    await chatService.toggleFavouriteConversation(currentUser.uid, activeChat, !isFav);
  };

  const handleToggleFavouriteById = async (chatId) => {
    const isFav = favourites[chatId];
    await chatService.toggleFavouriteConversation(currentUser.uid, chatId, !isFav);
  };

  const handleMuteToggle = async () => {
    if (!activeChat) return;
    const isMuted = currentUserProfile.mutedConversations?.[activeChat];
    await chatService.toggleMuteConversation(currentUser.uid, activeChat, !isMuted);
  };

  const handleDeleteChatRequest = () => {
    setDeleteConfirmTarget({ type: 'chat' });
  };
  
  const handleClearChatRequest = () => {
    setDeleteConfirmTarget({ type: 'clear' });
  };

  const handleDisappearingMessages = (duration) => {
    if (!activeChat || !activeChatData) return;
    chatService.setDisappearingDuration(activeChat, duration, currentUser.uid, currentUser.name || 'A user');
  };

  const handleCopyMessages = () => {
    const texts = Array.from(selectedMessages).map(id => {
      const msg = messages.find(m => m.id === id);
      return msg ? msg.text : '';
    }).filter(Boolean);
    if (texts.length > 0) {
      navigator.clipboard.writeText(texts.join('\n'));
    }
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleStarMessages = async () => {
    for (const id of selectedMessages) {
      await chatService.starMessage(currentUser.uid, id, true);
    }
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleDeleteMessagesRequest = () => {
    setDeleteConfirmTarget({ type: 'messages', ids: Array.from(selectedMessages) });
  };

  const handleForwardMessagesRequest = () => {
    setIsForwarding(true);
    setIsNewChatOpen(true);
  };

  const handleConfirmDelete = async (mode) => {
    if (!deleteConfirmTarget || !activeChat) return;

    if (deleteConfirmTarget.type === 'messages') {
      await chatService.deleteMessages(activeChat, deleteConfirmTarget.ids, mode, currentUser.uid);
      setSelectionMode(false);
      setSelectedMessages(new Set());
    } else if (deleteConfirmTarget.type === 'chat') {
      if (activeChatData.type === 'group') {
        await chatService.leaveGroup(activeChat, currentUser.uid, currentUser.name);
      } else {
        await chatService.deletePrivateChat(activeChat, currentUser.uid);
      }
      handleBackToSidebar();
    } else if (deleteConfirmTarget.type === 'clear') {
      await chatService.clearChatHistory(activeChat, currentUser.uid);
    }
    
    setDeleteConfirmTarget(null);
  };

  // Find active chat data
  const activeChatData = conversations.find(c => c.id === activeChat);

  // Filter messages based on clearedAt and deletedFor
  const clearedAt = activeChatData?.clearedAt?.[currentUser.uid] || 0;
  const filteredChatMessages = messages.filter(msg => 
    msg.createdAt > clearedAt && !msg.deletedFor?.[currentUser.uid]
  );

  // Check if user can send messages in current chat
  let canSendMessages = true;
  if (activeChatData && activeChatData.type === 'group' && activeChatData.settings?.sendMessages === 'admins') {
    const hasAdmins = activeChatData.admins && Object.keys(activeChatData.admins).length > 0;
    const isCurrentUserAdmin = activeChatData.admins ? activeChatData.admins[currentUser.uid] : !hasAdmins;
    if (!isCurrentUserAdmin) {
      canSendMessages = false;
    }
  }

  // Separate conversations and groups for the Sidebar (since they are in one collection now)
  const privateChats = conversations.filter(c => c.type === 'private');
  const groupChats = conversations.filter(c => c.type === 'group');

  return (
    <motion.div 
      className={`chat-container ${!isSidebarActive ? 'conversation-active' : ''}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Sidebar 
        user={currentUser}
        users={users}
        conversations={privateChats}
        groups={groupChats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={() => setIsNewChatOpen(true)}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onViewProfile={setSelectedUserToView}
        onStartChat={handleStartChat}
        onManageLists={() => setIsManageListsOpen(true)}
        onAddToList={(id) => { setSelectedChatForList(id); setIsAddToListOpen(true); }}
        onToggleFavourite={handleToggleFavouriteById}
        unreadCounts={unreadCounts}
        totalUnread={totalUnread}
        mutedConversations={currentUserProfile.mutedConversations || {}}
        favouriteConversations={favourites}
        userLists={userLists}
      />
      
      <div className="chat-area">
        {activeChatData ? (
          <>
            <ChatHeader 
              chat={activeChatData} 
              currentUser={currentUser}
              allUsers={users}
              onBack={handleBackToSidebar}
              onViewProfile={setSelectedUserToView}
              onViewGroupDetails={() => setIsGroupDetailsOpen(true)}
              chatSearchQuery={chatSearchQuery}
              onSearchChange={(query) => {
                setChatSearchQuery(query);
                if (query) setIsSearchActive(true);
              }}
              onSearchClose={() => {
                setIsSearchActive(false);
                setChatSearchQuery('');
              }}
              isSearchActive={isSearchActive}
              onSearch={() => setIsSearchActive(!isSearchActive)}
              onSelectMessages={() => setSelectionMode(!selectionMode)}
              onClearChat={handleClearChatRequest}
              onDeleteChat={handleDeleteChatRequest}
              onDisappearingMessages={handleDisappearingMessages}
              onMuteToggle={handleMuteToggle}
              onAddToFavourites={handleToggleFavourite}
              onAddToList={() => { setSelectedChatForList(activeChat); setIsAddToListOpen(true); }}
              isMuted={currentUserProfile.mutedConversations?.[activeChat]}
              isFavourite={favourites[activeChat]}
            />
            {selectionMode && (
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => { setSelectionMode(false); setSelectedMessages(new Set()); }} style={{ color: 'white' }}>
                    <X size={20} />
                  </button>
                  <span style={{ fontWeight: 500 }}>{selectedMessages.size} selected</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={handleStarMessages} disabled={selectedMessages.size === 0} style={{ color: selectedMessages.size > 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    <Star size={20} />
                  </button>
                  <button className="btn-icon" onClick={handleCopyMessages} disabled={selectedMessages.size === 0} style={{ color: selectedMessages.size > 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    <Copy size={20} />
                  </button>
                  <button className="btn-icon" onClick={handleForwardMessagesRequest} disabled={selectedMessages.size === 0} style={{ color: selectedMessages.size > 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    <Forward size={20} />
                  </button>
                  <button className="btn-icon" onClick={handleDeleteMessagesRequest} disabled={selectedMessages.size === 0} style={{ color: selectedMessages.size > 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}
            <MessageList 
              messages={filteredChatMessages} 
              currentUser={currentUser} 
              allUsers={users}
              isGroup={activeChatData.type === 'group'}
              selectionMode={selectionMode}
              selectedMessages={selectedMessages}
              onToggleMessageSelection={(msgId) => {
                const newSelected = new Set(selectedMessages);
                if (newSelected.has(msgId)) {
                  newSelected.delete(msgId);
                } else {
                  newSelected.add(msgId);
                }
                setSelectedMessages(newSelected);
              }}
              searchQuery={chatSearchQuery}
              disappearingDuration={activeChatData.settings?.disappearingDuration}
              disappearingSince={activeChatData.settings?.disappearingSince}
              conversationId={activeChatData.id}
            />
            {canSendMessages ? (
              <MessageInput onSendMessage={handleSendMessage} />
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                Only admins can send messages in this group.
              </div>
            )}
          </>
        ) : (
          <div className="empty-chat">
            <h2>Select a conversation to start chatting</h2>
          </div>
        )}
      </div>

      <AnimatePresence>
      {isNewChatOpen && (
        <NewChatModal 
          users={users}
          currentUser={currentUser}
          onClose={() => { setIsNewChatOpen(false); setIsForwarding(false); }}
          onStartChat={handleStartChat}
        />
      )}

      {isCreateGroupOpen && (
        <CreateGroupModal 
          users={users.filter(u => u.id !== currentUser.uid)}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          user={users.find(u => u.id === currentUser.uid) || currentUser}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {selectedUserToView && !isMediaGalleryOpen && (
        <UserProfileModal 
          user={selectedUserToView}
          onClose={() => setSelectedUserToView(null)}
          onOpenMediaGallery={activeChatData ? () => {
            setIsMediaGalleryOpen(true);
          } : undefined}
        />
      )}

      {isGroupDetailsOpen && activeChatData && activeChatData.type === 'group' && !isMediaGalleryOpen && (
        <GroupDetailsModal 
          chat={activeChatData}
          users={users}
          currentUser={currentUser}
          onClose={() => setIsGroupDetailsOpen(false)}
          onAddMembers={handleAddGroupMembers}
          onMakeAdmin={handleMakeGroupAdmin}
          onRemoveMember={handleRemoveGroupMember}
          onLeaveGroup={handleLeaveGroup}
          onOpenSettings={() => {
            setIsGroupDetailsOpen(false);
            setIsGroupSettingsOpen(true);
          }}
          onOpenMediaGallery={() => {
            setIsMediaGalleryOpen(true);
          }}
        />
      )}

      {isGroupSettingsOpen && activeChatData && activeChatData.type === 'group' && (
        <GroupSettingsModal 
          chat={activeChatData}
          users={users}
          currentUser={currentUser}
          userPreferences={currentUserProfile}
          onClose={() => setIsGroupSettingsOpen(false)}
        />
      )}

      {isMediaGalleryOpen && activeChatData && (
        <ChatMediaGallery
          chat={activeChatData}
          onClose={() => setIsMediaGalleryOpen(false)}
        />
      )}

      {isManageListsOpen && (
        <ManageListsModal
          currentUser={currentUser}
          userLists={userLists}
          onClose={() => setIsManageListsOpen(false)}
        />
      )}

      {isAddToListOpen && selectedChatForList && (
        <AddToListModal
          currentUser={currentUser}
          userLists={userLists}
          conversationId={selectedChatForList}
          onClose={() => {
            setIsAddToListOpen(false);
            setSelectedChatForList(null);
          }}
        />
      )}

      {deleteConfirmTarget && (
        <DeleteConfirmModal 
          title={deleteConfirmTarget.type === 'messages' ? 'Delete messages?' : deleteConfirmTarget.type === 'clear' ? 'Clear chat?' : 'Delete chat?'}
          message={deleteConfirmTarget.type === 'messages' ? `Are you sure you want to delete ${deleteConfirmTarget.ids.length} message(s)?` : `Are you sure you want to ${deleteConfirmTarget.type === 'chat' ? 'delete' : 'clear'} this conversation?`}
          canDeleteForEveryone={
            deleteConfirmTarget.type === 'messages' && 
            deleteConfirmTarget.ids.every(id => {
              const msg = messages.find(m => m.id === id);
              return msg && msg.senderId === currentUser.uid;
            })
          }
          onClose={() => setDeleteConfirmTarget(null)}
          onDeleteForMe={() => handleConfirmDelete('me')}
          onDeleteForEveryone={() => handleConfirmDelete('everyone')}
        />
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Chat;
