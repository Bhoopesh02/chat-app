import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Users, LogOut, X, Filter, MoreVertical, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { chatService } from '../services/chatService';
import { capitalizeName, getDisplayAvatar } from '../utils/stringUtils';

const Sidebar = ({ 
  user, 
  users = [], 
  conversations = [], 
  groups = [], 
  activeChat, 
  onSelectChat, 
  searchQuery = '', 
  onSearchChange,
  onNewChat,
  onCreateGroup,
  onOpenSettings,
  onLogout,
  onViewProfile,
  onStartChat,
  onManageLists,
  onAddToList,
  onToggleFavourite,
  unreadCounts = {},
  totalUnread = 0,
  mutedConversations = {},
  favouriteConversations = {},
  userLists = []
}) => {
  const [viewMode, setViewMode] = useState('all'); // 'all', 'unread', 'favourites', 'groups', listId
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const [activeContextMenu, setActiveContextMenu] = useState(null); // conversationId
  const contextMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setIsHeaderMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setActiveContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const applyViewMode = (conv) => {
    if (viewMode === 'all') return true;
    if (viewMode === 'unread') return (unreadCounts[conv.id] || 0) > 0;
    if (viewMode === 'groups') return conv.type === 'group';
    if (viewMode === 'favourites') return favouriteConversations[conv.id] === true;
    const list = userLists.find(l => l.id === viewMode);
    if (list && list.conversations) {
      return list.conversations[conv.id] === true;
    }
    return false;
  };
  
  // Helper to get the other participant in a private chat
  const getOtherUser = (participants) => {
    if (!participants || !Array.isArray(participants)) return null;
    let otherId = participants.find(p => p !== user?.uid);
    if (!otherId && participants.includes(user?.uid)) {
      otherId = user?.uid; // Self-chat
    }
    const other = users.find(u => u.id === otherId);
    if (other && other.id === user?.uid) {
      return { ...other, name: (other.name || 'You') + ' (You)' };
    }
    return other;
  };

  const query = (searchQuery || '').trim().toLowerCase();

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!applyViewMode(conv)) return false;
    if (!query) return true;
    const otherUser = getOtherUser(conv.participants);
    const userName = (otherUser?.name || '').toLowerCase();
    const userEmail = (otherUser?.email || '').toLowerCase();
    const lastMsg = (conv.lastMessage || '').toLowerCase();
    return userName.includes(query) || userEmail.includes(query) || lastMsg.includes(query);
  });

  // Filter groups
  const filteredGroups = groups.filter(group => {
    if (!applyViewMode(group)) return false;
    if (!query) return true;
    const groupName = (group?.name || '').toLowerCase();
    return groupName.includes(query);
  });

  // Other users (contacts) matching search query who aren't already displayed in filteredConversations
  const matchingOtherUsers = query ? users.filter(u => {
    if (u.id === user?.uid) return false;
    const uName = (u.name || '').toLowerCase();
    const uEmail = (u.email || '').toLowerCase();
    const matches = uName.includes(query) || uEmail.includes(query);
    if (!matches) return false;

    const alreadyInFiltered = filteredConversations.some(conv => {
      const other = getOtherUser(conv.participants);
      return other?.id === u.id;
    });
    return !alreadyInFiltered;
  }) : [];

  const fullCurrentUser = users.find(u => u.id === user?.uid) || user || {};
  const currentUserStatus = fullCurrentUser.status || 'online';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    // RTDB timestamps are numeric (ms since epoch)
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasAnyResults = filteredConversations.length > 0 || filteredGroups.length > 0 || matchingOtherUsers.length > 0;

  const handleContextMenu = (e, conversationId) => {
    e.preventDefault();
    chatService.markAsRead(conversationId, user.uid);
  };

  const renderBadge = (conversationId) => {
    const isMuted = mutedConversations[conversationId];
    const count = unreadCounts[conversationId] || 0;
    
    if (isMuted && count > 0) {
      return <div className="muted-dot" title="New messages (muted)"></div>;
    }
    
    if (!isMuted && count > 0) {
      return (
        <div className="unread-badge">
          {count > 99 ? '99+' : count}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="sidebar">
      {/* Header / Profile */}
      <div className="sidebar-header">
        <div className="user-profile" onClick={onOpenSettings} style={{ cursor: 'pointer' }}>
          <div className="avatar-container">
            <img src={getDisplayAvatar(fullCurrentUser.avatar, fullCurrentUser.name || 'You', 'user')} alt={fullCurrentUser.name || 'You'} className="avatar" />
            <span className={`status-indicator status-${currentUserStatus}`}></span>
          </div>
          <div className="user-info">
            <span className="user-name">{capitalizeName(fullCurrentUser.name || 'You')}</span>
            <span className="user-status-text">{currentUserStatus === 'offline' ? 'Offline' : 'Online'}</span>
          </div>
        </div>
        <div style={{ position: 'relative' }} ref={headerMenuRef}>
          <button className="btn-icon" onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} title="Menu">
            <MoreVertical size={20} />
          </button>
          {isHeaderMenuOpen && (
            <div className="dropdown-menu" style={{ position: 'absolute', right: 0, top: '100%', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minWidth: '150px', zIndex: 100, padding: '0.5rem 0', display: 'flex', flexDirection: 'column' }}>
              <button className="dropdown-item" style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }} onClick={() => { setIsHeaderMenuOpen(false); if (onManageLists) onManageLists(); }}>
                Manage Lists
              </button>
              <button className="dropdown-item" style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }} onClick={() => { setIsHeaderMenuOpen(false); onOpenSettings(); }}>
                Settings
              </button>
              <button className="dropdown-item" style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--error-color)' }} onClick={() => { setIsHeaderMenuOpen(false); onLogout(); }}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="search-box">
          <Search size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onSearchChange('');
              }
            }}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => onSearchChange('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
        
        {/* Horizontal Filter Tabs */}
        <div className="filter-tabs" style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.25rem' }}>
          {['all', 'unread', 'favourites', 'groups'].map(tab => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`filter-tab ${viewMode === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          {userLists.map(list => (
            <button
              key={list.id}
              onClick={() => setViewMode(list.id)}
              className={`filter-tab ${viewMode === list.id ? 'active' : ''}`}
            >
              {list.name}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="actions-container">
        <button className="btn-primary" onClick={onNewChat}>
          <Plus size={16} /> New Chat
        </button>
        <button className="btn-primary" onClick={onCreateGroup} style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}>
          <Users size={16} /> Create Group
        </button>
      </div>

      {/* Lists */}
      <motion.div 
        className="conversation-list-container"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {query && !hasAnyResults && (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem 1rem', fontSize: '0.875rem' }}>
            No results found for "{searchQuery}"
          </div>
        )}

        {filteredConversations.length > 0 && (
          <div className="list-section">
            <h3 className="list-title">
              Conversations
            </h3>
            {filteredConversations.map(conv => {
              const otherUser = getOtherUser(conv.participants);
              const otherUserName = otherUser?.name || 'Unknown User';
              const otherUserAvatar = getDisplayAvatar(otherUser?.avatar, otherUserName, 'user');
              
              return (
                <motion.div 
                  key={conv.id} 
                  className={`conversation-item ${activeChat === conv.id ? 'active' : ''}`}
                  onClick={() => onSelectChat(conv.id)}
                  onContextMenu={(e) => handleContextMenu(e, conv.id)}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <div 
                    className="avatar-container"
                    onClick={(e) => {
                      if (onViewProfile && otherUser) {
                        e.stopPropagation();
                        onViewProfile(otherUser);
                      }
                    }}
                    style={{ cursor: (onViewProfile && otherUser) ? 'pointer' : 'default' }}
                  >
                    <img src={otherUserAvatar} alt={otherUserName} className="avatar" />
                    <span className={`status-indicator status-${otherUser?.status || 'online'}`}></span>
                  </div>
                  <div className="conversation-item-info">
                    <div className="conversation-item-header">
                      <span className="conversation-name">{capitalizeName(otherUserName)}</span>
                      {conv.lastMessageAt && (
                        <span className="conversation-time">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <div className="conversation-last-message">
                        {conv.lastMessage}
                      </div>
                    )}
                  </div>
                  {renderBadge(conv.id)}
                  
                  {/* Context Menu Trigger */}
                  <div className="chat-context-trigger" onClick={(e) => { e.stopPropagation(); setActiveContextMenu(activeContextMenu === conv.id ? null : conv.id); }}>
                    <ChevronDown size={20} />
                  </div>
                  {activeContextMenu === conv.id && (
                    <div ref={contextMenuRef} className="chat-context-menu">
                      <button onClick={(e) => { e.stopPropagation(); if(onToggleFavourite) onToggleFavourite(conv.id); setActiveContextMenu(null); }}>
                        {favouriteConversations[conv.id] ? 'Remove from Favourites' : 'Mark as Favourite'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if(onAddToList) onAddToList(conv.id); setActiveContextMenu(null); }}>
                        Add to List
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredGroups.length > 0 && (
          <div className="list-section">
            <h3 className="list-title">Groups</h3>
            {filteredGroups.map(group => {
              const groupName = group.name || 'Unnamed Group';
              const groupAvatar = getDisplayAvatar(group.avatar, groupName, 'group');
              
              return (
                <motion.div 
                  key={group.id} 
                  className={`conversation-item ${activeChat === group.id ? 'active' : ''}`}
                  onClick={() => onSelectChat(group.id)}
                  onContextMenu={(e) => handleContextMenu(e, group.id)}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <img src={groupAvatar} alt={groupName} className="avatar" />
                  <div className="conversation-item-info">
                    <div className="conversation-item-header">
                      <span className="conversation-name">{capitalizeName(groupName)}</span>
                      {group.lastMessageAt && (
                        <span className="conversation-time">
                          {formatTime(group.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {group.lastMessage && (
                      <div className="conversation-last-message">
                        {group.lastMessage}
                      </div>
                    )}
                  </div>
                  {renderBadge(group.id)}

                  {/* Context Menu Trigger */}
                  <div className="chat-context-trigger" onClick={(e) => { e.stopPropagation(); setActiveContextMenu(activeContextMenu === group.id ? null : group.id); }}>
                    <ChevronDown size={20} />
                  </div>
                  {activeContextMenu === group.id && (
                    <div ref={contextMenuRef} className="chat-context-menu">
                      <button onClick={(e) => { e.stopPropagation(); if(onToggleFavourite) onToggleFavourite(group.id); setActiveContextMenu(null); }}>
                        {favouriteConversations[group.id] ? 'Remove from Favourites' : 'Mark as Favourite'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if(onAddToList) onAddToList(group.id); setActiveContextMenu(null); }}>
                        Add to List
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {matchingOtherUsers.length > 0 && (
          <div className="list-section">
            <h3 className="list-title">Users</h3>
            {matchingOtherUsers.map(otherUser => {
              const otherUserName = otherUser.name || 'Unknown User';
              const otherUserAvatar = getDisplayAvatar(otherUser.avatar, otherUserName, 'user');
              
              return (
                <motion.div 
                  key={otherUser.id} 
                  className="conversation-item"
                  onClick={() => {
                    if (onStartChat) {
                      onStartChat(otherUser.id);
                    }
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <div 
                    className="avatar-container"
                    onClick={(e) => {
                      if (onViewProfile) {
                        e.stopPropagation();
                        onViewProfile(otherUser);
                      }
                    }}
                    style={{ cursor: onViewProfile ? 'pointer' : 'default' }}
                  >
                    <img src={otherUserAvatar} alt={otherUserName} className="avatar" />
                    <span className={`status-indicator status-${otherUser.status || 'online'}`}></span>
                  </div>
                  <div className="conversation-item-info">
                    <div className="conversation-item-header">
                      <span className="conversation-name">{capitalizeName(otherUserName)}</span>
                    </div>
                    <div className="conversation-last-message" style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                      {otherUser.email || 'Click to start chat'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Sidebar;
