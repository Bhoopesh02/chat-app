import React, { useState } from 'react';
import AnimatedSearchBar from './AnimatedSearchBar';
import { Modal, Avatar, Text } from './ui';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="New Conversation"
    >
      <AnimatedSearchBar 
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search users..."
        expandable={false}
        autoFocus={true}
        style={{ marginBottom: '0.75rem' }}
      />

      <div className="user-list">
        {filteredUsers.length === 0 ? (
          <Text align="center" color="light" style={{ padding: '1rem' }}>
            {query ? `No users found matching "${searchQuery}"` : 'No users found.'}
          </Text>
        ) : (
          filteredUsers.map(user => {
            const isCurrentUser = currentUser && user.id === currentUser.uid;
            const userName = (user.name || 'Unknown User') + (isCurrentUser ? ' (You)' : '');

            return (
              <div 
                key={user.id} 
                className="selectable-user"
                onClick={() => onStartChat(user.id)}
              >
                <Avatar
                  src={user.avatar}
                  name={userName}
                  size="sm"
                  status={user.status || 'online'}
                />
                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.75rem' }}>
                  <Text variant="body" weight={500}>{userName}</Text>
                  {user.email && <Text variant="caption" color="secondary">{user.email}</Text>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default NewChatModal;
