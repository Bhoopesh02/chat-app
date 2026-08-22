import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ChatOverflowMenu from './ChatOverflowMenu';
import { capitalizeName, getDisplayAvatar } from '../utils/stringUtils';

const ChatHeader = ({ 
  chat, currentUser, allUsers, onBack, onViewProfile, onViewGroupDetails,
  onSearch, onSelectMessages, onClearChat, onDeleteChat, onDisappearingMessages,
  onMuteToggle, onAddToFavourites, onAddToList, isMuted, isFavourite
}) => {
  if (!chat) return null;

  let otherUser = null;

  let title = '';
  let subtitle = '';
  let avatarUrl = '';
  let status = null;

  if (chat.type === 'private') {
    let otherUserId = chat.participants.find(p => p !== currentUser.uid);
    if (!otherUserId && chat.participants.includes(currentUser.uid)) {
      otherUserId = currentUser.uid;
    }
    otherUser = allUsers.find(u => u.id === otherUserId);
    if (otherUser) {
      if (otherUser.id === currentUser.uid) {
        title = capitalizeName(otherUser.name || 'You') + ' (You)';
      } else {
        title = capitalizeName(otherUser.name);
      }
      subtitle = otherUser.status === 'offline' ? 'Offline' : 'Online';
      avatarUrl = getDisplayAvatar(otherUser.avatar, otherUser.name, 'user');
      status = otherUser.status || 'online';
    }
  } else if (chat.type === 'group') {
    title = capitalizeName(chat.name);
    subtitle = `${chat.participants.length} members`;
    avatarUrl = getDisplayAvatar(chat.avatar, chat.name, 'group');
  }

  const handleInfoClick = () => {
    if (chat.type === 'private' && otherUser && onViewProfile) {
      onViewProfile(otherUser);
    } else if (chat.type === 'group' && onViewGroupDetails) {
      onViewGroupDetails();
    }
  };

  const isCurrentUserAdmin = chat.admins && chat.admins[currentUser.uid];
  const disappearingPermission = chat.settings?.disappearingPermission || 'all';
  const canChangeDisappearing = chat.type === 'group' ? (disappearingPermission === 'all' || isCurrentUserAdmin) : true;
  const activeDisappearingDuration = chat.settings?.disappearingDuration || null;

  return (
    <div className="chat-header">
      <button className="btn-icon back-button" onClick={onBack}>
        <ArrowLeft size={20} />
      </button>
      
      <div 
        className="avatar-container"
        onClick={handleInfoClick}
        style={{ cursor: 'pointer' }}
      >
        <img src={avatarUrl} alt={title} className="avatar" />
        {status && <span className={`status-indicator status-${status}`}></span>}
      </div>
      
      <div 
        className="chat-header-info"
        onClick={handleInfoClick}
        style={{ cursor: 'pointer', flex: 1 }}
      >
        {chat.type === 'group' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem', fontWeight: 600 }}>
            <span>{title}</span>
            {activeDisappearingDuration && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
            <span style={{ color: 'var(--text-secondary)' }}>·</span>
            <span style={{ color: 'var(--success-color)' }}>{chat.participants.length} members</span>
          </div>
        ) : (
          <>
            <span className="chat-header-name">
              {title}
              {activeDisappearingDuration && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
            </span>
            <span className="chat-header-status">{subtitle}</span>
          </>
        )}
      </div>

      <ChatOverflowMenu
        chatType={chat.type === 'private' && otherUser?.id === currentUser.uid ? 'self' : chat.type}
        onSearch={onSearch}
        onSelectMessages={onSelectMessages}
        onClearChat={onClearChat}
        onDeleteChat={onDeleteChat}
        onDisappearingMessages={onDisappearingMessages}
        canChangeDisappearing={canChangeDisappearing}
        activeDisappearingDuration={activeDisappearingDuration}
        onContactInfo={handleInfoClick}
        onMuteToggle={onMuteToggle}
        onAddToFavourites={onAddToFavourites}
        onAddToList={onAddToList}
        isMuted={isMuted}
        isFavourite={isFavourite}
      />
    </div>
  );
};

export default ChatHeader;
