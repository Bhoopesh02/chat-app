import { 
  ref, 
  set, 
  push, 
  get, 
  onValue, 
  query, 
  orderByChild, 
  equalTo,
  serverTimestamp,
  update,
  off,
  onDisconnect,
  runTransaction,
  increment
} from 'firebase/database';
import { db } from '../firebase/firebase';
import { getAvatarFallback } from '../utils/stringUtils';

export const chatService = {
  
  /**
   * Checks if a username already exists in RTDB (case-insensitive)
   */
  checkUsernameExists: async (username) => {
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersObj = snapshot.val();
        const target = username.trim().toLowerCase();
        return Object.values(usersObj).some(user => user && user.name && user.name.trim().toLowerCase() === target);
      }
      return false;
    } catch (err) {
      console.error("Error checking username existence:", err);
      return false;
    }
  },

  /**
   * Creates a user profile in RTDB
   */
  createUserProfile: async (uid, name, email, photoUrl = null) => {
    const userRef = ref(db, `users/${uid}`);
    const avatar = photoUrl || getAvatarFallback(name, 'user');
    await set(userRef, {
      id: uid,
      name,
      email,
      avatar,
      status: 'online',
      createdAt: serverTimestamp()
    });
  },

  /**
   * Ensures a user profile exists in RTDB (useful for users migrating from Firestore or new Google sign-ins)
   */
  ensureUserProfile: async (uid, name, email, photoUrl = null) => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await chatService.createUserProfile(uid, name, email, photoUrl);
      const avatar = photoUrl || getAvatarFallback(name, 'user');
      return { id: uid, name, email, avatar };
    }
    return { id: uid, ...snapshot.val() };
  },

  /**
   * Updates the user's name
   */
  updateUserName: async (uid, name) => {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, { name });
  },

  /**
   * Updates the user's avatar
   */
  updateUserAvatar: async (uid, avatarUrl) => {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, { avatar: avatarUrl });
  },

  /**
   * Sets up presence tracking for a user
   */
  setPresence: (uid) => {
    const userStatusRef = ref(db, `users/${uid}/status`);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When disconnected, change status to offline
        onDisconnect(userStatusRef).set('offline').then(() => {
          // When connected, set status to online
          set(userStatusRef, 'online');
        });
      }
    });
  },

  /**
   * Subscribes to all users
   */
  subscribeToUsers: (callback) => {
    const usersRef = ref(db, 'users');
    const listener = onValue(usersRef, (snapshot) => {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        users.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      callback(users);
    });

    return () => off(usersRef, 'value', listener);
  },

  /**
   * Finds an existing private conversation between two users
   */
  findPrivateConversation: async (uid1, uid2) => {
    // RTDB can only query one child at a time.
    // We query conversations where uid1 is a participant, then filter locally for private and uid2.
    const convRef = query(ref(db, 'conversations'), orderByChild(`participants/${uid1}`), equalTo(true));
    const snapshot = await get(convRef);
    
    if (snapshot.exists()) {
      let foundId = null;
      snapshot.forEach((child) => {
        const conv = child.val();
        if (conv.type === 'private' && conv.participants && conv.participants[uid2] === true) {
          const pKeys = Object.keys(conv.participants);
          const expectedCount = uid1 === uid2 ? 1 : 2;
          if (pKeys.length === expectedCount) {
            foundId = child.key;
          }
        }
      });
      return foundId;
    }
    return null;
  },

  /**
   * Creates a new private conversation
   */
  createPrivateConversation: async (uid1, uid2) => {
    const existingId = await chatService.findPrivateConversation(uid1, uid2);
    if (existingId) return existingId;

    // Fetch user1 default duration
    const userRef = ref(db, `users/${uid1}`);
    const userSnap = await get(userRef);
    let defaultDuration = null;
    if (userSnap.exists()) {
      defaultDuration = userSnap.val().defaultDisappearingDuration || null;
    }

    const convRef = push(ref(db, 'conversations'));
    const timestamp = serverTimestamp();
    
    const participants = { [uid1]: true };
    if (uid1 !== uid2) {
      participants[uid2] = true;
    }

    const initialData = {
      type: 'private',
      participants,
      ...(uid1 === uid2 ? { isSelfChat: true } : {}),
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessage: '',
      lastMessageAt: null,
      settings: {
        disappearingDuration: defaultDuration,
        disappearingSince: defaultDuration ? timestamp : null,
        disappearingChangedBy: defaultDuration ? uid1 : null,
        addMembers: 'all',
        editInfo: 'all',
        sendMessages: 'all'
      }
    };

    if (defaultDuration) {
      const durationText = defaultDuration === 86400000 ? '24 hours' : defaultDuration === 604800000 ? '7 days' : '90 days';
      // Need a random key for the message
      const msgKey = push(ref(db)).key;
      initialData.messages = {
        [msgKey]: {
          senderId: 'system',
          text: `Disappearing messages turned on by default, set to ${durationText}`,
          createdAt: timestamp
        }
      };
    }

    await set(convRef, initialData);
    
    return convRef.key;
  },

  /**
   * Creates a new group conversation
   */
  createGroup: async (name, members, creatorId) => {
    const participantsObj = { [creatorId]: true };
    members.forEach(m => participantsObj[m] = true);
    
    const convRef = push(ref(db, 'conversations'));
    const timestamp = serverTimestamp();

    await set(convRef, {
      type: 'group',
      name: name,
      description: '',
      avatar: getAvatarFallback(name, 'group'),
      participants: participantsObj,
      admins: { [creatorId]: true },
      createdBy: creatorId,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessage: '',
      lastMessageAt: null,
      settings: {
        addMembers: 'all',
        editInfo: 'all',
        sendMessages: 'all',
        disappearingPermission: 'all'
      }
    });
    
    return convRef.key;
  },

  /**
   * Adds new members to an existing group conversation
   */
  addGroupMembers: async (conversationId, newMemberIds) => {
    const updates = {};
    newMemberIds.forEach(id => {
      updates[`participants/${id}`] = true;
    });
    
    const convRef = ref(db, `conversations/${conversationId}`);
    await update(convRef, updates);
  },

  /**
   * Makes a member an admin of the group
   */
  makeGroupAdmin: async (conversationId, targetUserId) => {
    const convRef = ref(db, `conversations/${conversationId}`);
    await update(convRef, {
      [`admins/${targetUserId}`]: true
    });
  },

  /**
   * Subscribes to all conversations for a specific user
   */
  subscribeToUserConversations: (uid, callback) => {
    const convQuery = query(ref(db, 'conversations'), orderByChild(`participants/${uid}`), equalTo(true));
    
    const listener = onValue(convQuery, (snapshot) => {
      let conversations = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        // Convert participants object back to array for UI compatibility
        const participantsArray = data.participants ? Object.keys(data.participants) : [];
        conversations.push({ 
          id: childSnapshot.key, 
          ...data,
          participants: participantsArray 
        });
      });
      
      // RTDB doesn't support multiple orderBys natively, so we sort client-side
      conversations.sort((a, b) => {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return timeB - timeA;
      });

      callback(conversations);
    });

    return () => off(convQuery, 'value', listener);
  },

  /**
   * Sends a message in a conversation and updates the conversation's last message info
   */
  sendMessage: async (conversationId, senderId, text, participants = [], mediaData = null) => {
    const messagesRef = push(ref(db, `conversations/${conversationId}/messages`));
    const timestamp = serverTimestamp();
    const msgId = messagesRef.key;

    const updates = {};
    
    // 1. Write the message with default 'sent' status
    const messagePayload = {
      senderId,
      text: text || '',
      type: mediaData ? mediaData.type : 'text',
      createdAt: timestamp,
      status: 'sent',
      deliveredAt: null,
      readAt: null
    };

    if (mediaData) {
      if (mediaData.type === 'poll') {
        messagePayload.pollData = mediaData.pollData;
      } else {
        messagePayload.mediaUrl = mediaData.mediaUrl;
        messagePayload.mediaPublicId = mediaData.mediaPublicId;
        messagePayload.fileName = mediaData.fileName;
        messagePayload.fileFormat = mediaData.fileFormat;
        if (mediaData.caption) {
          messagePayload.caption = mediaData.caption;
        }
      }
    }

    updates[`conversations/${conversationId}/messages/${msgId}`] = messagePayload;

    // 2. Update the parent conversation's last message info
    let lastMessageText = text;
    if (!lastMessageText && mediaData) {
      if (mediaData.type === 'poll') {
        lastMessageText = `📊 Poll: ${mediaData.pollData.question}`;
      } else if (mediaData.type === 'album' && mediaData.media) {
        lastMessageText = `📷 ${mediaData.media.length > 1 ? `${mediaData.media.length} items` : 'Photo'}`;
      } else {
        lastMessageText = `[${mediaData.type}] ${mediaData.fileName || 'Media'}`;
      }
    }
    updates[`conversations/${conversationId}/lastMessage`] = lastMessageText;
    updates[`conversations/${conversationId}/lastMessageAt`] = timestamp;
    updates[`conversations/${conversationId}/updatedAt`] = timestamp;

    // 3. Increment unreadCount for all participants except sender
    if (participants && participants.length > 0) {
      participants.forEach(uid => {
        if (uid !== senderId) {
          updates[`unreadCounts/${conversationId}/${uid}/count`] = increment(1);
        }
      });
    }

    console.log("Firebase updates payload:", updates);
    await update(ref(db), updates);
  },

  /**
   * Marks specific incoming messages in a conversation as delivered
   */
  markMessagesAsDelivered: async (conversationId, messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    const updates = {};
    const timestamp = serverTimestamp();
    messageIds.forEach((msgId) => {
      updates[`conversations/${conversationId}/messages/${msgId}/status`] = 'delivered';
      updates[`conversations/${conversationId}/messages/${msgId}/deliveredAt`] = timestamp;
    });
    try {
      await update(ref(db), updates);
    } catch (err) {
      console.error("Error marking messages as delivered:", err);
    }
  },

  /**
   * Marks specific incoming messages in a conversation as read
   */
  markMessagesAsRead: async (conversationId, messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    const updates = {};
    const timestamp = serverTimestamp();
    messageIds.forEach((msgId) => {
      updates[`conversations/${conversationId}/messages/${msgId}/status`] = 'read';
      updates[`conversations/${conversationId}/messages/${msgId}/readAt`] = timestamp;
    });
    try {
      await update(ref(db), updates);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  },

  /**
   * Scans user conversations for incoming messages in 'sent' state and marks them as delivered
   */
  processIncomingDelivery: (uid, rawConversations) => {
    if (!rawConversations || !Array.isArray(rawConversations)) return;
    rawConversations.forEach((conv) => {
      if (!conv.messages) return;
      const unreadUndeliveredIds = [];
      Object.entries(conv.messages).forEach(([msgId, msg]) => {
        if (msg && msg.senderId !== uid && (!msg.status || msg.status === 'sent')) {
          unreadUndeliveredIds.push(msgId);
        }
      });
      if (unreadUndeliveredIds.length > 0) {
        chatService.markMessagesAsDelivered(conv.id, unreadUndeliveredIds);
      }
    });
  },

  /**
   * Subscribes to messages within a specific conversation
   */
  subscribeToMessages: (conversationId, callback) => {
    const messagesQuery = query(ref(db, `conversations/${conversationId}/messages`), orderByChild('createdAt'));
    
    const listener = onValue(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      callback(messages);
    });

    return () => off(messagesQuery, 'value', listener);
  },

  /**
   * Leaves a group conversation, automatically promoting a new admin if necessary,
   * or deleting the conversation if the last participant leaves.
   */
  leaveGroup: async (conversationId, userId, userName) => {
    const convRef = ref(db, `conversations/${conversationId}`);
    
    let isDeleted = false;

    await runTransaction(convRef, (conv) => {
      if (!conv) {
        return conv;
      }

      if (conv.participants) {
        delete conv.participants[userId];
      }
      
      if (conv.admins) {
        delete conv.admins[userId];
      }

      const remainingParticipants = conv.participants ? Object.keys(conv.participants) : [];
      
      const remainingAdmins = conv.admins ? Object.keys(conv.admins) : [];

      if (remainingAdmins.length === 0 && remainingParticipants.length > 0) {
        // Last admin left, but there are still participants
        // Deterministically pick the next admin (alphabetically first UID)
        const nextAdminId = remainingParticipants.sort()[0];
        if (!conv.admins) conv.admins = {};
        conv.admins[nextAdminId] = true;
      }

      return conv;
    });

    if (!isDeleted) {
      // Send a system message that the user left
      await chatService.sendMessage(conversationId, 'system', `${userName} left the group`);
    }
  },

  /**
   * Updates group name and description
   */
  updateGroupInfo: async (conversationId, name, description) => {
    const convRef = ref(db, `conversations/${conversationId}`);
    await update(convRef, {
      name,
      description,
      avatar: getAvatarFallback(name, 'group')
    });
  },

  /**
   * Updates group permissions settings
   */
  updateGroupSettings: async (conversationId, settings) => {
    const settingsRef = ref(db, `conversations/${conversationId}/settings`);
    await update(settingsRef, settings);
  },

  /**
   * Removes a member from a group
   */
  removeGroupMember: async (conversationId, userId, removerName, removedUserName) => {
    const convRef = ref(db, `conversations/${conversationId}`);
    
    await runTransaction(convRef, (conv) => {
      if (!conv) return conv;
      if (conv.participants) {
        delete conv.participants[userId];
      }
      if (conv.admins) {
        delete conv.admins[userId];
      }
      return conv;
    });

    await chatService.sendMessage(conversationId, 'system', `${removedUserName} was removed by ${removerName}`);
  },

  /**
   * Demotes an admin to a regular member
   */
  demoteGroupAdmin: async (conversationId, userId) => {
    const adminRef = ref(db, `conversations/${conversationId}/admins/${userId}`);
    await set(adminRef, null);
  },

  /**
   * Transfers ownership to a new user (demotes old owner, promotes new owner if not already admin)
   */
  transferOwnership: async (conversationId, oldOwnerId, newOwnerId) => {
    const convRef = ref(db, `conversations/${conversationId}`);
    await runTransaction(convRef, (conv) => {
      if (!conv) return conv;
      if (!conv.admins) conv.admins = {};
      conv.admins[newOwnerId] = true;
      delete conv.admins[oldOwnerId];
      return conv;
    });
  },

  /**
   * Toggles the mute status for a specific conversation for a user
   */
  toggleMuteConversation: async (uid, conversationId, isMuted) => {
    const muteRef = ref(db, `users/${uid}/mutedConversations/${conversationId}`);
    await set(muteRef, isMuted);
  },

  /**
   * Updates notification preferences for a specific conversation for a user
   */
  updateNotificationPreferences: async (uid, conversationId, preference) => {
    const prefRef = ref(db, `users/${uid}/notificationPreferences/${conversationId}`);
    await set(prefRef, preference);
  },

  /**
   * Clears all messages in a chat history for a specific user
   */
  clearChatHistory: async (conversationId, uid) => {
    if (!uid) return;
    const clearRef = ref(db, `conversations/${conversationId}/clearedAt/${uid}`);
    await set(clearRef, serverTimestamp());
  },

  /**
   * Resets unread count for a user in a specific conversation
   */
  resetUnreadCount: async (conversationId, userId) => {
    const updates = {};
    updates[`unreadCounts/${conversationId}/${userId}/count`] = 0;
    updates[`unreadCounts/${conversationId}/${userId}/lastReadTimestamp`] = serverTimestamp();
    await update(ref(db), updates);
  },

  /**
   * Marks a conversation as read (manual action)
   */
  markAsRead: async (conversationId, userId) => {
    await chatService.resetUnreadCount(conversationId, userId);
  },

  /**
   * Subscribes to the unread count for a specific user and conversation
   */
  subscribeToUnreadCount: (conversationId, userId, callback) => {
    const unreadRef = ref(db, `unreadCounts/${conversationId}/${userId}/count`);
    const listener = onValue(unreadRef, (snapshot) => {
      callback(snapshot.val() || 0);
    });
    return () => off(unreadRef, 'value', listener);
  },

  /**
   * Subscribes to all media messages (image, video, album) in a conversation
   */
  subscribeToConversationMedia: (conversationId, callback) => {
    const messagesQuery = query(ref(db, `conversations/${conversationId}/messages`), orderByChild('createdAt'));
    
    const listener = onValue(messagesQuery, (snapshot) => {
      const mediaItems = [];
      snapshot.forEach((childSnapshot) => {
        const msg = { id: childSnapshot.key, ...childSnapshot.val() };
        if (msg.type === 'image' || msg.type === 'video') {
          mediaItems.push(msg);
        } else if (msg.type === 'album' && Array.isArray(msg.media)) {
          msg.media.forEach((item, index) => {
            mediaItems.push({
              ...msg,
              id: `${msg.id}-${index}`, // Unique ID for flattened item
              mediaUrl: item.mediaUrl,
              type: item.type,
              thumbnailUrl: item.thumbnailUrl,
              fileFormat: item.fileFormat,
              fileName: item.fileName,
              width: item.width,
              height: item.height
            });
          });
        }
      });
      // Sort reverse chronological (newest first)
      mediaItems.sort((a, b) => b.createdAt - a.createdAt);
      callback(mediaItems);
    });

    return () => off(messagesQuery, 'value', listener);
  },

  /**
   * Stars or unstars a message for a user
   */
  starMessage: async (uid, msgId, isStarred) => {
    const starRef = ref(db, `users/${uid}/starredMessages/${msgId}`);
    await set(starRef, isStarred ? true : null);
  },

  /**
   * Fetches starred messages for a user
   */
  subscribeToStarredMessages: (uid, callback) => {
    const starRef = ref(db, `users/${uid}/starredMessages`);
    const listener = onValue(starRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
    return () => off(starRef, 'value', listener);
  },

  /**
   * Toggles a conversation as favorite
   */
  toggleFavouriteConversation: async (uid, conversationId, isFavourite) => {
    const favRef = ref(db, `users/${uid}/favouriteConversations/${conversationId}`);
    await set(favRef, isFavourite ? true : null);
  },

  /**
   * Subscribes to user favorites
   */
  subscribeToFavourites: (uid, callback) => {
    const favRef = ref(db, `users/${uid}/favouriteConversations`);
    const listener = onValue(favRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
    return () => off(favRef, 'value', listener);
  },

  /**
   * Get all favourite conversations
   */
  getFavouriteConversations: async (uid) => {
    const favRef = ref(db, `users/${uid}/favouriteConversations`);
    const snapshot = await get(favRef);
    return snapshot.val() || {};
  },

  /**
   * Toggles a conversation in a custom list
   */
  toggleConversationInList: async (uid, listId, listName, conversationId, isAdded) => {
    const listRef = ref(db, `users/${uid}/lists/${listId}`);
    const revRef = ref(db, `users/${uid}/conversationLists/${conversationId}/${listId}`);
    
    if (isAdded) {
      const snapshot = await get(listRef);
      if (snapshot.exists()) {
        await update(listRef, {
          [`conversations/${conversationId}`]: true
        });
      } else {
        await set(listRef, {
          name: listName,
          createdAt: serverTimestamp(),
          order: Date.now(),
          conversations: { [conversationId]: true }
        });
      }
      await set(revRef, true);
    } else {
      const convInListRef = ref(db, `users/${uid}/lists/${listId}/conversations/${conversationId}`);
      await set(convInListRef, null);
      await set(revRef, null);
    }
  },

  /**
   * Create a new custom list
   */
  createList: async (uid, listName) => {
    const listsRef = push(ref(db, `users/${uid}/lists`));
    await set(listsRef, {
      name: listName,
      createdAt: serverTimestamp(),
      order: Date.now(),
      conversations: {}
    });
    return listsRef.key;
  },

  /**
   * Rename a custom list
   */
  renameList: async (uid, listId, newName) => {
    const listRef = ref(db, `users/${uid}/lists/${listId}`);
    await update(listRef, { name: newName });
  },

  /**
   * Delete a custom list
   */
  deleteList: async (uid, listId) => {
    const listRef = ref(db, `users/${uid}/lists/${listId}`);
    const snapshot = await get(listRef);
    if (snapshot.exists()) {
      const listData = snapshot.val();
      if (listData.conversations) {
        const updates = {};
        Object.keys(listData.conversations).forEach(convId => {
          updates[`users/${uid}/conversationLists/${convId}/${listId}`] = null;
        });
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }
    }
    await set(listRef, null);
  },

  /**
   * Get all lists a conversation belongs to
   */
  getConversationLists: async (uid, conversationId) => {
    const revRef = ref(db, `users/${uid}/conversationLists/${conversationId}`);
    const snapshot = await get(revRef);
    return snapshot.val() || {};
  },

  /**
   * Subscribes to user lists
   */
  subscribeToLists: (uid, callback) => {
    const listsRef = ref(db, `users/${uid}/lists`);
    const listener = onValue(listsRef, (snapshot) => {
      const lists = [];
      snapshot.forEach((child) => {
        lists.push({ id: child.key, ...child.val() });
      });
      callback(lists);
    });
    return () => off(listsRef, 'value', listener);
  },

  /**
   * Deletes a private chat (leaves it or deletes completely if self-chat)
   */
  deletePrivateChat: async (conversationId, uid) => {
    const convRef = ref(db, `conversations/${conversationId}`);
    const snapshot = await get(convRef);
    if (snapshot.exists()) {
      const conv = snapshot.val();
      if (conv.isSelfChat) {
        // Safe to delete entirely
        await set(convRef, null);
      } else {
        // Remove participant only
        await set(ref(db, `conversations/${conversationId}/participants/${uid}`), null);
      }
    }
  },

  /**
   * Delete messages
   * mode can be 'me' or 'everyone'
   */
  deleteMessages: async (conversationId, messageIds, mode, uid) => {
    if (!messageIds || messageIds.length === 0) return;
    const updates = {};
    if (mode === 'everyone') {
      messageIds.forEach(msgId => {
        updates[`conversations/${conversationId}/messages/${msgId}/deletedForEveryone`] = true;
      });
    } else if (mode === 'me') {
      messageIds.forEach(msgId => {
        updates[`conversations/${conversationId}/messages/${msgId}/deletedFor/${uid}`] = true;
      });
    }
    await update(ref(db), updates);
  },

  /**
   * Sets disappearing duration
   */
  setDisappearingDuration: async (conversationId, durationMs, uid, userName) => {
    const settingsRef = ref(db, `conversations/${conversationId}/settings`);
    const timestamp = serverTimestamp();
    
    await update(settingsRef, {
      disappearingDuration: durationMs || null,
      disappearingSince: timestamp,
      disappearingChangedBy: uid
    });
    
    const durationText = durationMs ? (durationMs === 86400000 ? '24 hours' : durationMs === 604800000 ? '7 days' : '90 days') : 'Off';
    const msg = durationMs ? `${userName} turned on disappearing messages, set to ${durationText}` : `${userName} turned off disappearing messages`;
    await chatService.sendMessage(conversationId, 'system', msg);
  },

  /**
   * Updates default disappearing duration for a user
   */
  updateDefaultDisappearingDuration: async (uid, durationMs) => {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, {
      defaultDisappearingDuration: durationMs || null
    });
  },

  /**
   * Cleans up expired disappearing messages opportunistically
   */
  cleanupExpiredMessages: async (conversationId, messages, disappearingDuration, disappearingSince) => {
    if (!disappearingDuration || !disappearingSince || !messages || messages.length === 0) return;
    const now = Date.now();
    const updates = {};
    let hasDeletes = false;
    
    messages.forEach(msg => {
      // Must have been sent after the setting was turned on
      if (msg.createdAt >= disappearingSince) {
        if (now - msg.createdAt > disappearingDuration) {
          updates[`conversations/${conversationId}/messages/${msg.id}`] = null;
          hasDeletes = true;
        }
      }
    });
    
    if (hasDeletes) {
      try {
        await update(ref(db), updates);
      } catch (err) {
        // Silently ignore, likely race condition with another client deleting at the same time
      }
    }
  },

  /**
   * Cast or remove a vote in a poll message
   */
  castPollVote: async (conversationId, messageId, optionId, userId, allowMultiple) => {
    const msgRef = ref(db, `conversations/${conversationId}/messages/${messageId}`);
    
    await runTransaction(msgRef, (msg) => {
      if (!msg || msg.type !== 'poll' || !msg.pollData) return msg;

      const options = msg.pollData.options;
      let userCurrentlyVotedFor = [];

      // Find where the user has already voted
      options.forEach(opt => {
        if (opt.votes && opt.votes[userId]) {
          userCurrentlyVotedFor.push(opt.id);
        }
      });

      const optionIndex = options.findIndex(o => o.id === optionId);
      if (optionIndex === -1) return msg;

      if (!options[optionIndex].votes) {
        options[optionIndex].votes = {};
      }

      if (!allowMultiple) {
        // Single choice: remove from all others, and toggle the current one
        options.forEach((opt, idx) => {
          if (idx !== optionIndex && opt.votes && opt.votes[userId]) {
            delete opt.votes[userId];
          }
        });
        
        if (options[optionIndex].votes[userId]) {
          delete options[optionIndex].votes[userId]; // Retract vote
        } else {
          options[optionIndex].votes[userId] = Date.now();
        }
      } else {
        // Multiple choice: toggle just this one
        if (options[optionIndex].votes[userId]) {
          delete options[optionIndex].votes[userId];
        } else {
          options[optionIndex].votes[userId] = Date.now();
        }
      }

      return msg;
    });
  }
};

/**
 * Pure function to visually group consecutive media messages
 */
export const groupConsecutiveMedia = (messages) => {
  if (!messages || messages.length === 0) return [];
  
  const grouped = [];
  let currentGroup = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    // Check if message qualifies for grouping (image or video)
    if (msg.type === 'image' || msg.type === 'video') {
      if (!currentGroup) {
        // Start a new group
        currentGroup = {
          id: `group-${msg.id}`,
          type: 'album',
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          status: msg.status,
          media: [{
            mediaUrl: msg.mediaUrl,
            type: msg.type,
            thumbnailUrl: msg.thumbnailUrl,
            fileFormat: msg.fileFormat,
            fileName: msg.fileName
          }],
          originalMessages: [msg]
        };
      } else {
        // Check if it belongs to current group
        const timeDiff = Math.abs(msg.createdAt - currentGroup.originalMessages[currentGroup.originalMessages.length - 1].createdAt);
        const isSameSender = msg.senderId === currentGroup.senderId;
        const isWithin2Mins = timeDiff <= 2 * 60 * 1000;
        
        if (isSameSender && isWithin2Mins) {
          currentGroup.media.push({
            mediaUrl: msg.mediaUrl,
            type: msg.type,
            thumbnailUrl: msg.thumbnailUrl,
            fileFormat: msg.fileFormat,
            fileName: msg.fileName
          });
          currentGroup.originalMessages.push(msg);
          // Update group timestamp to the latest
          currentGroup.createdAt = msg.createdAt;
          // Status becomes whatever the latest is
          currentGroup.status = msg.status;
        } else {
          // Push current group and start new one
          if (currentGroup.media.length === 1) {
            grouped.push(currentGroup.originalMessages[0]);
          } else {
            grouped.push(currentGroup);
          }
          currentGroup = {
            id: `group-${msg.id}`,
            type: 'album',
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            status: msg.status,
            media: [{
              mediaUrl: msg.mediaUrl,
              type: msg.type,
              thumbnailUrl: msg.thumbnailUrl,
              fileFormat: msg.fileFormat,
              fileName: msg.fileName
            }],
            originalMessages: [msg]
          };
        }
      }
    } else {
      // Not an image/video. If we have an active group, close it.
      if (currentGroup) {
        if (currentGroup.media.length === 1) {
          grouped.push(currentGroup.originalMessages[0]);
        } else {
          grouped.push(currentGroup);
        }
        currentGroup = null;
      }
      grouped.push(msg);
    }
  }

  // Push any remaining group
  if (currentGroup) {
    if (currentGroup.media.length === 1) {
      grouped.push(currentGroup.originalMessages[0]);
    } else {
      grouped.push(currentGroup);
    }
  }

  return grouped;
};
