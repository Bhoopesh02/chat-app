import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const NewChatModal = ({ users = [], currentUser, onClose, onStartChat }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const query = (searchQuery || '').trim().toLowerCase();
  const filteredUsers = users.filter(user => {
    if (!query) return true;
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">New Conversation</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="search-box" style={{ border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
          <Search size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
            autoFocus
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="user-list">
          {filteredUsers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1rem' }}>
              {query ? `No users found matching "${searchQuery}"` : 'No users found.'}
            </p>
          ) : (
            filteredUsers.map(user => {
              const isCurrentUser = currentUser && user.id === currentUser.uid;
              const userName = (user.name || 'Unknown User') + (isCurrentUser ? ' (You)' : '');
              const userAvatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;
              return (
                <div 
                  key={user.id} 
                  className="selectable-user"
                  onClick={() => onStartChat(user.id)}
                >
                  <div className="avatar-container">
                    <img src={userAvatar} alt={userName} className="avatar-sm avatar" />
                    <span className={`status-indicator status-${user.status || 'online'}`} style={{width: '8px', height: '8px', borderWidth: '1px'}}></span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userName}</span>
                    {user.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewChatModal;

