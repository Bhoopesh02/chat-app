import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Modal, Spinner, Text } from './ui';

const AddToListModal = ({ currentUser, userLists, conversationId, onClose }) => {
  const [activeLists, setActiveLists] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const currentLists = await chatService.getConversationLists(currentUser.uid, conversationId);
        setActiveLists(currentLists);
      } catch (err) {
        console.error("Error fetching lists for conversation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, [currentUser.uid, conversationId]);

  const handleToggle = async (list) => {
    if (saving) return;
    setSaving(true);
    
    const isCurrentlyAdded = activeLists[list.id];
    const newStatus = !isCurrentlyAdded;
    
    // Optimistic update
    setActiveLists(prev => ({
      ...prev,
      [list.id]: newStatus
    }));

    try {
      await chatService.toggleConversationInList(
        currentUser.uid,
        list.id,
        list.name,
        conversationId,
        newStatus
      );
    } catch (err) {
      console.error("Error toggling list:", err);
      // Revert on error
      setActiveLists(prev => ({
        ...prev,
        [list.id]: isCurrentlyAdded
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Add to List"
      maxWidth="350px"
    >
      <div className="user-list" style={{ maxHeight: '300px', marginTop: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', gap: '0.5rem' }}>
            <Spinner size="sm" color="primary" />
            <Text variant="caption" color="secondary">Loading lists...</Text>
          </div>
        ) : userLists.length === 0 ? (
          <Text align="center" color="light" style={{ padding: '1rem' }}>
            No custom lists found. Create one from Manage Lists.
          </Text>
        ) : (
          userLists.map(list => (
            <div 
              key={list.id} 
              className="selectable-user" 
              onClick={() => handleToggle(list)}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '20px', 
                height: '20px', 
                borderRadius: '4px', 
                border: `1px solid ${activeLists[list.id] ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                backgroundColor: activeLists[list.id] ? 'var(--primary-color)' : 'transparent', 
                color: 'white', 
                marginRight: '0.75rem' 
              }}>
                {activeLists[list.id] && <Check size={14} />}
              </div>
              <Text variant="body" weight={500} style={{ flex: 1 }}>{list.name}</Text>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default AddToListModal;
