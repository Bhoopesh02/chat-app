import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { chatService } from '../services/chatService';

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
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '350px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h2 className="modal-title">Add to List</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="user-list" style={{ maxHeight: '300px', marginTop: '1rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1rem' }}>
              Loading...
            </p>
          ) : userLists.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1rem' }}>
              No custom lists found. Create one from Manage Lists.
            </p>
          ) : (
            userLists.map(list => (
              <div 
                key={list.id} 
                className="selectable-user" 
                onClick={() => handleToggle(list)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', border: `1px solid ${activeLists[list.id] ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: activeLists[list.id] ? 'var(--primary-color)' : 'transparent', color: 'white', marginRight: '0.75rem' }}>
                  {activeLists[list.id] && <Check size={14} />}
                </div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 500, flex: 1 }}>{list.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;
