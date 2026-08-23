import React, { useState } from 'react';
import { X, Search, UserPlus, Shield, Settings, Image as ImageIcon, ChevronRight, UserMinus } from 'lucide-react';
import { capitalizeName, getDisplayAvatar } from '../utils/stringUtils';
import { motion } from 'framer-motion';
import AnimatedSearchBar from './AnimatedSearchBar';

const GroupDetailsModal = ({ chat, users, currentUser, onClose, onAddMembers, onMakeAdmin, onRemoveMember, onLeaveGroup, onOpenSettings, onOpenMediaGallery }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);


  // Check if current user is admin, or if the group has no admins (legacy fallback)
  const hasAdmins = chat.admins && Object.keys(chat.admins).length > 0;
  const isCurrentUserAdmin = chat.admins ? chat.admins[currentUser.uid] : !hasAdmins;

  const participantsList = Array.isArray(chat?.participants) 
    ? chat.participants 
    : (chat?.participants ? Object.keys(chat.participants) : []);

  // Filter members for view mode
  const groupMembers = (users || []).filter(u => participantsList.includes(u.id));
  const filteredMembers = groupMembers.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    const query = (searchQuery || '').toLowerCase().trim();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  // Filter non-members for add mode
  const nonMembers = (users || []).filter(u => !participantsList.includes(u.id));
  const filteredNonMembers = nonMembers.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    const query = (searchQuery || '').toLowerCase().trim();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const handleToggleNewMember = (userId) => {
    setSelectedNewMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddSubmit = () => {
    if (selectedNewMembers.length > 0) {
      onAddMembers(chat.id, selectedNewMembers);
      setIsAddingMembers(false);
      setIsSearchingMembers(false);
      setSelectedNewMembers([]);
      setSearchQuery('');
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content" 
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="modal-header" style={{ flexShrink: 0, paddingBottom: '0.5rem' }}>
          <h2 style={{ lineHeight: '1.2', paddingTop: '0.1rem' }}>{isAddingMembers ? 'Add Members' : 'Group Details'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onOpenSettings && (
              <button className="btn-icon" onClick={onOpenSettings} title="Group Settings">
                <Settings size={20} />
              </button>
            )}
            <button className="btn-icon" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {!isAddingMembers ? (
          <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards', overflowY: 'auto', paddingRight: '0.25rem', paddingBottom: '1rem', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
              <img 
                src={getDisplayAvatar(chat.avatar, chat.name, 'group')} 
                alt={chat.name} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '0.75rem', border: '3px solid var(--border-color)' }} 
              />
              <h3 className="modal-title">{capitalizeName(chat.name)}</h3>
              <p style={{ margin: '0.25rem 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {chat.participants.length} members
              </p>
              
              {onOpenMediaGallery && (
                <div 
                  style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--background-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1rem'
                  }}
                  onClick={onOpenMediaGallery}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                    <ImageIcon size={20} />
                    <span style={{ fontWeight: 500 }}>Media, links, and docs</span>
                  </div>
                  <ChevronRight size={20} color="var(--text-secondary)" />
                </div>
              )}
            </div>

            {isSearchingMembers ? (
              <div style={{ padding: '0.25rem 0.5rem 0.75rem 0.5rem', marginTop: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <AnimatedSearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search members..."
                  expandable={false}
                  autoFocus={true}
                  onClose={() => {
                    setIsSearchingMembers(false);
                    setSearchQuery('');
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.5rem 1rem 0.5rem', marginTop: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {chat.participants.length} members
                </span>
                <button 
                  type="button"
                  className="btn-icon"
                  onClick={() => setIsSearchingMembers(true)}
                  title="Search members"
                  style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Search size={18} />
                </button>
              </div>
            )}

            <div className="user-list" style={{ maxHeight: '300px', margin: 0, marginTop: '0.5rem' }}>
              {isCurrentUserAdmin && !searchQuery && (
                <div 
                  className="selectable-user" 
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '0.5rem' }}
                  onClick={() => {
                    setIsAddingMembers(true);
                    setIsSearchingMembers(false);
                    setSearchQuery('');
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <UserPlus size={20} />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--text-primary)' }}>Add member</span>
                </div>
              )}
              {filteredMembers.length > 0 ? (
                filteredMembers.map(user => {
                  const isAdmin = chat.admins && chat.admins[user.id];
                  return (
                    <div key={user.id} className="selectable-user" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={getDisplayAvatar(user.avatar, user.name, 'user')} alt={user.name} className="avatar-sm avatar" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{capitalizeName(user.name)} {user.id === currentUser.uid ? '(You)' : ''}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isAdmin && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(24, 169, 153, 0.1)', color: 'var(--primary-color)', padding: '0.25rem 0.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Shield size={12} /> Admin
                          </span>
                        )}
                        {isCurrentUserAdmin && user.id !== currentUser.uid && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {!isAdmin && (
                              <button 
                                style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  fontSize: '0.75rem', 
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: 'var(--radius-sm)', 
                                  color: 'var(--text-primary)', 
                                  cursor: 'pointer' 
                                }}
                                onClick={() => onMakeAdmin(chat.id, user.id)}
                              >
                                Make Admin
                              </button>
                            )}
                            <button 
                              className="btn-icon"
                              style={{ 
                                padding: '0.25rem', 
                                color: 'var(--danger-color)',
                                width: '26px',
                                height: '26px'
                              }}
                              onClick={() => onRemoveMember && onRemoveMember(chat.id, user.id)}
                              title="Remove from Group"
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-users-message" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                  No members found matching "{searchQuery}"
                </div>
              )}
            </div>

            {isConfirmingLeave ? (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-color)' }}>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '0.9rem', textAlign: 'center' }}>
                  Are you sure you want to leave this group?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                    onClick={() => setIsConfirmingLeave(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger"
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none' }}
                    onClick={() => {
                      setIsConfirmingLeave(false);
                      if (onLeaveGroup) onLeaveGroup(chat.id);
                    }}
                  >
                    Leave
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button 
                  style={{ 
                    color: 'var(--danger-color)', 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setIsConfirmingLeave(true)}
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards', overflowY: 'auto', paddingRight: '0.25rem', paddingBottom: '1rem', flex: 1 }}>
            <div className="search-container" style={{ padding: '0', marginBottom: '1rem', border: 'none' }}>
              <AnimatedSearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search users to add..."
                expandable={false}
                autoFocus={true}
              />
            </div>

            <div className="user-list" style={{ maxHeight: '300px', margin: 0, marginBottom: '1.5rem' }}>
              {filteredNonMembers.length > 0 ? (
                filteredNonMembers.map(user => (
                  <label 
                    key={user.id} 
                    className="selectable-user"
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedNewMembers.includes(user.id)}
                      onChange={() => handleToggleNewMember(user.id)}
                    />
                    <div className="avatar-container">
                      <img src={getDisplayAvatar(user.avatar, user.name, 'user')} alt={user.name} className="avatar-sm avatar" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{capitalizeName(user.name)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                    </div>
                  </label>
                ))
              ) : (
                <div className="no-users-message">
                  {searchQuery ? "No users found matching your search." : "All registered users are already in this group."}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'transparent', 
                  fontWeight: 500, 
                  color: 'var(--text-primary)' 
                }}
                onClick={() => {
                  setIsAddingMembers(false);
                  setIsSearchingMembers(false);
                  setSearchQuery('');
                  setSelectedNewMembers([]);
                }}
              >
                Back
              </button>
              <button 
                className="btn-primary"
                style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                disabled={selectedNewMembers.length === 0}
                onClick={handleAddSubmit}
              >
                Add {selectedNewMembers.length > 0 ? `(${selectedNewMembers.length})` : ''}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GroupDetailsModal;
