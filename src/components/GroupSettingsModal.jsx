import React, { useState, useEffect } from 'react';
import { X, Save, Shield, UserX, Trash2, ArrowRightLeft, Bell, BellOff, MessageSquare, Edit3, UserPlus, AlertTriangle } from 'lucide-react';
import { chatService } from '../services/chatService';
import { motion } from 'framer-motion';

const GroupSettingsModal = ({ chat, users, currentUser, onClose, userPreferences, onUpdatePreferences }) => {
  const [activeTab, setActiveTab] = useState('info'); // info, members, permissions, danger
  const [name, setName] = useState(chat.name || '');
  const [description, setDescription] = useState(chat.description || '');
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    addMembers: chat.settings?.addMembers || 'all',
    editInfo: chat.settings?.editInfo || 'all',
    sendMessages: chat.settings?.sendMessages || 'all',
    disappearingPermission: chat.settings?.disappearingPermission || 'all'
  });

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Member management state
  const [transferConfirmId, setTransferConfirmId] = useState(null);

  const hasAdmins = chat.admins && Object.keys(chat.admins).length > 0;
  const isCurrentUserAdmin = chat.admins ? chat.admins[currentUser.uid] : !hasAdmins;
  const isCreator = chat.createdBy === currentUser.uid;

  // Permissions check
  const canEditInfo = isCurrentUserAdmin || settings.editInfo === 'all';
  const canManageMembers = isCurrentUserAdmin; // Only admins can remove/promote/demote

  const participantsList = Array.isArray(chat?.participants) 
    ? chat.participants 
    : (chat?.participants ? Object.keys(chat.participants) : []);
    
  const groupMembers = (users || []).filter(u => participantsList.includes(u.id));

  // derived metadata
  const creatorUser = users?.find(u => u.id === chat.createdBy);
  const creatorName = creatorUser ? creatorUser.name : 'Unknown';
  const createdDate = chat.createdAt ? new Date(chat.createdAt).toLocaleDateString() : 'Unknown date';

  // Notifications state
  const isMuted = userPreferences?.mutedConversations?.[chat.id] || false;
  const notifPref = userPreferences?.notificationPreferences?.[chat.id] || 'all';

  const handleSaveInfo = async () => {
    if (!canEditInfo) return;
    setIsSaving(true);
    try {
      await chatService.updateGroupInfo(chat.id, name, description);
    } catch (err) {
      console.error('Failed to update group info', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    if (!isCurrentUserAdmin) return;
    setSettings(newSettings);
    try {
      await chatService.updateGroupSettings(chat.id, newSettings);
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!canManageMembers) return;
    if (window.confirm(`Are you sure you want to remove ${userName}?`)) {
      try {
        await chatService.removeGroupMember(chat.id, userId, currentUser.displayName || currentUser.name || 'Admin', userName);
      } catch (err) {
        console.error('Failed to remove member', err);
      }
    }
  };

  const handlePromoteAdmin = async (userId) => {
    if (!canManageMembers) return;
    try {
      await chatService.makeGroupAdmin(chat.id, userId);
    } catch (err) {
      console.error('Failed to promote to admin', err);
    }
  };

  const handleDemoteAdmin = async (userId) => {
    if (!canManageMembers) return;
    if (window.confirm(`Are you sure you want to demote this admin?`)) {
      try {
        await chatService.demoteGroupAdmin(chat.id, userId);
      } catch (err) {
        console.error('Failed to demote admin', err);
      }
    }
  };

  const handleTransferOwnership = async (newOwnerId) => {
    if (!isCreator && !isCurrentUserAdmin) return;
    try {
      await chatService.transferOwnership(chat.id, currentUser.uid, newOwnerId);
      setTransferConfirmId(null);
    } catch (err) {
      console.error('Failed to transfer ownership', err);
    }
  };

  const handleClearHistory = async () => {
    if (!isCreator && !isCurrentUserAdmin) return;
    try {
      await chatService.clearChatHistory(chat.id, currentUser.uid);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const handleToggleMute = async () => {
    try {
      const newState = !isMuted;
      await chatService.toggleMuteConversation(currentUser.uid, chat.id, newState);
      if (onUpdatePreferences) onUpdatePreferences('mutedConversations', chat.id, newState);
    } catch (err) {
      console.error('Failed to toggle mute', err);
    }
  };

  const handleChangeNotifPref = async (e) => {
    const val = e.target.value;
    try {
      await chatService.updateNotificationPreferences(currentUser.uid, chat.id, val);
      if (onUpdatePreferences) onUpdatePreferences('notificationPreferences', chat.id, val);
    } catch (err) {
      console.error('Failed to change notification preference', err);
    }
  };

  const tabStyle = (tab) => ({
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
    fontWeight: activeTab === tab ? 600 : 400,
    background: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '0.9rem'
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
        style={{ maxWidth: '500px' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="modal-header">
          <h2>Group Settings</h2>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', overflowX: 'auto' }}>
          <button style={tabStyle('info')} onClick={() => setActiveTab('info')}>General</button>
          <button style={tabStyle('members')} onClick={() => setActiveTab('members')}>Members</button>
          {isCurrentUserAdmin && <button style={tabStyle('permissions')} onClick={() => setActiveTab('permissions')}>Permissions</button>}
          <button style={tabStyle('notifications')} onClick={() => setActiveTab('notifications')}>Notifications</button>
          {isCurrentUserAdmin && <button style={tabStyle('danger')} onClick={() => setActiveTab('danger')} className="text-danger">Danger Zone</button>}
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          
          {/* GENERAL INFO TAB */}
          {activeTab === 'info' && (
            <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <img 
                  src={chat.avatar} 
                  alt={chat.name} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '0.75rem', border: '3px solid var(--border-color)' }} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Group Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  disabled={!canEditInfo}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: canEditInfo ? 'var(--background-color)' : 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Description / Topic</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEditInfo}
                  rows={3}
                  placeholder="Add a description..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: canEditInfo ? 'var(--background-color)' : 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              {canEditInfo && (
                <button 
                  className="btn-primary" 
                  onClick={handleSaveInfo}
                  disabled={isSaving || !name.trim() || (name === chat.name && description === chat.description)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>Created on {createdDate} by <strong>{creatorName}</strong></p>
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Manage group members and roles.
              </p>
              
              <div className="user-list" style={{ margin: 0 }}>
                {groupMembers.map(user => {
                  const isAdmin = chat.admins && chat.admins[user.id];
                  const isSelf = user.id === currentUser.uid;
                  
                  return (
                    <div key={user.id} className="selectable-user" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={user.avatar} alt={user.name} className="avatar-sm avatar" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.name} {isSelf ? '(You)' : ''}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isAdmin && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(24, 169, 153, 0.1)', color: 'var(--primary-color)', padding: '0.25rem 0.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Shield size={12} /> Admin
                          </span>
                        )}
                        
                        {canManageMembers && !isSelf && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {transferConfirmId === user.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <button className="btn-icon text-danger" onClick={() => handleTransferOwnership(user.id)} title="Confirm Transfer">
                                  <AlertTriangle size={16} /> Confirm
                                </button>
                                <button className="btn-icon" onClick={() => setTransferConfirmId(null)}>
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                {!isAdmin ? (
                                  <button className="btn-icon" onClick={() => handlePromoteAdmin(user.id)} title="Promote to Admin">
                                    <Shield size={16} />
                                  </button>
                                ) : (
                                  <>
                                    <button className="btn-icon" onClick={() => handleDemoteAdmin(user.id)} title="Demote Admin">
                                      <Shield size={16} strokeOpacity={0.5} />
                                    </button>
                                    <button className="btn-icon" onClick={() => setTransferConfirmId(user.id)} title="Transfer Ownership">
                                      <ArrowRightLeft size={16} />
                                    </button>
                                  </>
                                )}
                                <button className="btn-icon text-danger" onClick={() => handleRemoveMember(user.id, user.name)} title="Remove Member">
                                  <UserX size={16} color="var(--danger-color)" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERMISSIONS TAB */}
          {activeTab === 'permissions' && isCurrentUserAdmin && (
            <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Control what members can do in this group.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="permission-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <UserPlus size={18} color="var(--text-primary)" />
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Who can add members?</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="addMembers" 
                        value="all" 
                        checked={settings.addMembers === 'all'} 
                        onChange={() => handleSaveSettings({ ...settings, addMembers: 'all' })}
                      /> All members
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="addMembers" 
                        value="admins" 
                        checked={settings.addMembers === 'admins'} 
                        onChange={() => handleSaveSettings({ ...settings, addMembers: 'admins' })}
                      /> Admins only
                    </label>
                  </div>
                </div>

                <div className="permission-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Edit3 size={18} color="var(--text-primary)" />
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Who can edit group info?</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="editInfo" 
                        value="all" 
                        checked={settings.editInfo === 'all'} 
                        onChange={() => handleSaveSettings({ ...settings, editInfo: 'all' })}
                      /> All members
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="editInfo" 
                        value="admins" 
                        checked={settings.editInfo === 'admins'} 
                        onChange={() => handleSaveSettings({ ...settings, editInfo: 'admins' })}
                      /> Admins only
                    </label>
                  </div>
                </div>

                <div className="permission-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MessageSquare size={18} color="var(--text-primary)" />
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Who can send messages?</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="sendMessages" 
                        value="all" 
                        checked={settings.sendMessages === 'all'} 
                        onChange={() => handleSaveSettings({ ...settings, sendMessages: 'all' })}
                      /> All members
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="sendMessages" 
                        value="admins" 
                        checked={settings.sendMessages === 'admins'} 
                        onChange={() => handleSaveSettings({ ...settings, sendMessages: 'admins' })}
                      /> Admins only
                    </label>
                  </div>
                </div>

                <div className="permission-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Who can change disappearing messages?</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="disappearingPermission" 
                        value="all" 
                        checked={settings.disappearingPermission === 'all'} 
                        onChange={() => handleSaveSettings({ ...settings, disappearingPermission: 'all' })}
                      /> All members
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="disappearingPermission" 
                        value="admins" 
                        checked={settings.disappearingPermission === 'admins'} 
                        onChange={() => handleSaveSettings({ ...settings, disappearingPermission: 'admins' })}
                      /> Admins only
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                These settings only apply to you.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isMuted ? <BellOff size={20} color="var(--text-secondary)" /> : <Bell size={20} color="var(--primary-color)" />}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Mute Conversation</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stop receiving push notifications</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isMuted} onChange={handleToggleMute} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Notification Preferences</div>
                <select 
                  value={notifPref} 
                  onChange={handleChangeNotifPref}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-primary)' }}
                >
                  <option value="all">All messages</option>
                  <option value="mentions">Mentions only</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && isCurrentUserAdmin && (
            <div style={{ animation: 'fadeIn var(--transition-fast) var(--ease-out-expo) forwards' }}>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Irreversible actions for this group.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--danger-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger-color)', fontSize: '0.9rem' }}>Clear Chat History</h4>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>This will remove all messages for everyone. The group will remain.</p>
                  
                  {showClearConfirm ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-danger" style={{ flex: 1, padding: '0.5rem' }} onClick={handleClearHistory}>Confirm Clear</button>
                      <button style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} onClick={() => setShowClearConfirm(false)}>Cancel</button>
                    </div>
                  ) : (
                    <button 
                      style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => setShowClearConfirm(true)}
                    >
                      Clear History
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupSettingsModal;
