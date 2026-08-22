import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, groupConsecutiveMedia } from '../services/chatService';
import MediaGrid from './MediaGrid';
import MediaLightbox from './MediaLightbox';
import PollMessage from './PollMessage';

const MessageList = ({ 
  messages = [], 
  currentUser, 
  allUsers, 
  isGroup,
  selectionMode = false,
  selectedMessages = new Set(),
  onToggleMessageSelection = () => {},
  searchQuery = '',
  disappearingDuration = null,
  disappearingSince = null,
  conversationId = null
}) => {
  const bottomRef = useRef(null);
  const knownMessageIdsRef = useRef(new Set());
  const hasLoadedInitialBatch = useRef(false);
  
  const [lightboxData, setLightboxData] = useState(null);

  // Opportunistic cleanup of expired messages
  useEffect(() => {
    if (conversationId && disappearingDuration && disappearingSince) {
      chatService.cleanupExpiredMessages(conversationId, messages, disappearingDuration, disappearingSince);
    }
  }, [conversationId, messages, disappearingDuration, disappearingSince]);

  const now = Date.now();
  const filteredMessages = messages.filter(msg => {
    if (msg.deletedFor?.[currentUser.uid]) return false;
    
    if (disappearingDuration && disappearingSince && msg.createdAt >= disappearingSince) {
      const age = now - msg.createdAt;
      if (age > disappearingDuration) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!msg.text || !msg.text.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  // Process messages for consecutive grouping
  const groupedMessages = groupConsecutiveMedia(filteredMessages);

  // Reset tracking when messages array is emptied (e.g. switching conversations)
  if (filteredMessages.length === 0) {
    hasLoadedInitialBatch.current = false;
    knownMessageIdsRef.current.clear();
  }

  // Auto-scroll to bottom when messages change or keyboard opens
  useEffect(() => {
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    scrollToBottom();
    
    // Listen for mobile keyboard opening (visualViewport resize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scrollToBottom);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', scrollToBottom);
      }
    };
  }, [messages]);

  const getSenderName = (senderId) => {
    if (senderId === currentUser.uid) return 'You';
    const sender = allUsers.find(u => u.id === senderId);
    return sender ? sender.name : 'Unknown';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    // RTDB timestamps are numeric (ms since epoch)
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusIcon = (status) => {
    if (status === 'read') {
      return <CheckCheck size={14} className="message-status-icon status-read" />;
    } else if (status === 'delivered') {
      return <CheckCheck size={14} className="message-status-icon status-delivered" />;
    }
    // Default: 'sent' or legacy messages without status
    return <Check size={14} className="message-status-icon status-sent" />;
  };

  // Determine if this is the first batch or if there are new messages
  const isInitialBatch = !hasLoadedInitialBatch.current && filteredMessages.length > 0;

  const renderText = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <mark key={i} style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '0 2px', borderRadius: '2px' }}>{part}</mark> : 
        part
    );
  };

  return (
    <div className="message-list">
      <AnimatePresence initial={false}>
      {groupedMessages.map((msg, index) => {
        let isNew = false;

        if (isInitialBatch) {
          knownMessageIdsRef.current.add(msg.id);
        } else if (hasLoadedInitialBatch.current) {
          if (!knownMessageIdsRef.current.has(msg.id)) {
            isNew = true;
            knownMessageIdsRef.current.add(msg.id);
          }
        }

        if (index === filteredMessages.length - 1 && isInitialBatch) {
          hasLoadedInitialBatch.current = true;
        }

        const isSystemMessage = msg.senderId === 'system';
        const isSentByMe = msg.senderId === currentUser.uid;
        const showSenderName = isGroup && !isSentByMe && !isSystemMessage &&
          (index === 0 || groupedMessages[index - 1].senderId !== msg.senderId);

        if (isSystemMessage) {
          return (
            <motion.div 
              key={msg.id} 
              className="system-message" 
              style={{ textAlign: 'center', margin: '0.5rem 0' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--background-secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                {msg.text}
              </span>
            </motion.div>
          );
        }

        return (
          <motion.div 
            key={msg.id} 
            className={`message-row ${isSentByMe ? 'sent' : 'received'}`} 
            style={{ display: 'flex', width: '100%', justifyContent: isSentByMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '0.5rem', cursor: selectionMode ? 'pointer' : 'default' }} 
            onClick={selectionMode ? () => onToggleMessageSelection(msg.id) : undefined}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {selectionMode && (
              <div style={{ flexShrink: 0, paddingLeft: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={selectedMessages.has(msg.id)} 
                  readOnly 
                  style={{ pointerEvents: 'none', width: '1.2rem', height: '1.2rem' }}
                />
              </div>
            )}
            <div 
              className={`message-wrapper ${isSentByMe ? 'message-sent' : 'message-received'} ${isNew ? 'message-new' : ''}`}
              style={selectionMode ? { pointerEvents: 'none' } : {}}
            >{showSenderName && (
              <span className="message-sender-name">{getSenderName(msg.senderId)}</span>
            )}
            <div className={`message-bubble ${msg.type && msg.type !== 'text' ? 'media-bubble' : ''}`}>
              {msg.deletedForEveryone ? (
                <div className="message-text" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  🚫 This message was deleted
                </div>
              ) : (
                <>
                  {msg.type === 'poll' && (
                    <PollMessage 
                      msg={msg} 
                      currentUser={currentUser} 
                      allUsers={allUsers} 
                      onVote={(msgId, optionId, allowMultiple) => chatService.castPollVote(conversationId, msgId, optionId, currentUser.uid, allowMultiple)}
                    />
                  )}
                  {msg.type === 'album' && (
                    <div className="message-media album-media">
                      <MediaGrid 
                        media={msg.media} 
                        onMediaClick={(idx) => setLightboxData({ mediaArray: msg.media, initialIndex: idx })} 
                      />
                      {msg.text && <div className="message-text">{msg.text}</div>}
                    </div>
                  )}
                  {msg.type === 'image' && (
                    <div 
                      className="message-media image-media single-media"
                      onClick={() => setLightboxData({ mediaArray: [msg], initialIndex: 0 })}
                    >
                      <img src={msg.mediaUrl} alt={msg.fileName || 'Image'} loading="lazy" />
                      {msg.text && <div className="message-text">{msg.text}</div>}
                    </div>
                  )}
                  {msg.type === 'video' && (
                    <div 
                      className="message-media video-media single-media"
                      onClick={() => setLightboxData({ mediaArray: [msg], initialIndex: 0 })}
                    >
                      <video src={msg.mediaUrl} poster={msg.thumbnailUrl} controls preload="metadata" />
                      {msg.text && <div className="message-text">{msg.text}</div>}
                    </div>
                  )}
                  {msg.type === 'raw' && (
                    <div className="message-media document-media">
                      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" download>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        <span>{msg.fileName || 'Download Document'}</span>
                      </a>
                    </div>
                  )}
                  {msg.type === 'audio' && (
                    <div className="message-media audio-media">
                      <audio src={msg.mediaUrl} controls preload="metadata" />
                    </div>
                  )}
                  {(!msg.type || msg.type === 'text' || msg.type === 'raw' || msg.type === 'audio') && msg.text && (
                    <div className="message-text">{renderText(msg.text)}</div>
                  )}
                </>
              )}
            </div>
            <div className="message-meta">
              <span className="message-time">
                {formatTime(msg.createdAt)}
              </span>
              {isSentByMe && renderStatusIcon(msg.status)}
            </div>
          </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
      {lightboxData && (
        <MediaLightbox 
          mediaArray={lightboxData.mediaArray}
          initialIndex={lightboxData.initialIndex}
          onClose={() => setLightboxData(null)}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;

