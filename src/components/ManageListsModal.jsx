import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { chatService } from '../services/chatService';

const ManageListsModal = ({ currentUser, userLists, onClose }) => {
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      await chatService.createList(currentUser.uid, newListName.trim());
      setNewListName('');
    } catch (err) {
      console.error("Error creating list:", err);
    }
  };

  const startEdit = (list) => {
    setEditingListId(list.id);
    setEditName(list.name);
  };

  const saveEdit = async () => {
    if (!editName.trim() || !editingListId) {
      setEditingListId(null);
      return;
    }
    try {
      await chatService.renameList(currentUser.uid, editingListId, editName.trim());
      setEditingListId(null);
    } catch (err) {
      console.error("Error renaming list:", err);
    }
  };

  const handleDelete = async (listId) => {
    if (window.confirm("Are you sure you want to delete this list? The conversations will not be deleted.")) {
      try {
        await chatService.deleteList(currentUser.uid, listId);
      } catch (err) {
        console.error("Error deleting list:", err);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '400px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h2 className="modal-title">Manage Lists</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateList} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <input 
            type="text" 
            placeholder="New list name..." 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
          <button type="submit" className="btn-primary" disabled={!newListName.trim()}>
            <Plus size={16} /> Add
          </button>
        </form>

        <div className="user-list" style={{ maxHeight: '300px' }}>
          {userLists.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1rem' }}>
              No custom lists created yet.
            </p>
          ) : (
            userLists.map(list => (
              <div key={list.id} className="selectable-user" style={{ cursor: 'default', justifyContent: 'space-between' }}>
                {editingListId === list.id ? (
                  <div style={{ display: 'flex', flex: 1, gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') setEditingListId(null); }}
                      style={{ flex: 1, padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                    <button className="btn-icon" onClick={saveEdit} style={{ color: 'var(--success-color)' }}>
                      <Check size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => setEditingListId(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{list.name}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-icon" onClick={() => startEdit(list)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(list.id)} style={{ color: 'var(--error-color)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageListsModal;
