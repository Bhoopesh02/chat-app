import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedSearchBar from './AnimatedSearchBar';

const CreateGroupModal = ({ users = [], onClose, onCreateGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  const handleToggleMember = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreateGroup(groupName.trim(), selectedMembers);
    }
  };

  const query = memberSearch.trim().toLowerCase();
  const filteredUsers = users.filter(user => {
    if (!query) return true;
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const isFormValid = groupName.trim() && selectedMembers.length > 0;

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
          <h2 className="modal-title">Create Group</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Group Name" 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={50}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Select Members ({selectedMembers.length} selected)</h3>
        </div>

        <AnimatedSearchBar 
          value={memberSearch}
          onChange={setMemberSearch}
          placeholder="Search members to add..."
          expandable={false}
          style={{ marginBottom: '0.75rem' }}
        />
        
        <div className="user-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1rem' }}>
              {query ? `No users found matching "${memberSearch}"` : 'No users found.'}
            </p>
          ) : (
            filteredUsers.map(user => {
              const userName = user.name || 'Unknown User';
              const userAvatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;
              return (
                <label key={user.id} className="selectable-user">
                  <input 
                    type="checkbox" 
                    checked={selectedMembers.includes(user.id)}
                    onChange={() => handleToggleMember(user.id)}
                  />
                  <div className="avatar-container">
                    <img src={userAvatar} alt={userName} className="avatar-sm avatar" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userName}</span>
                    {user.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <button 
          className="btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          Create Group {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default CreateGroupModal;

