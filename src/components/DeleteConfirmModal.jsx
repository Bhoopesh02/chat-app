import React from 'react';

const DeleteConfirmModal = ({ 
  onClose, 
  onDeleteForMe, 
  onDeleteForEveryone,
  title = "Delete message?", 
  message = "Are you sure you want to delete this message?",
  canDeleteForEveryone = false
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '350px' }}>
        <div style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{title}</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {canDeleteForEveryone && (
              <button 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--danger-color)', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 500 }}
                onClick={onDeleteForEveryone}
              >
                Delete for everyone
              </button>
            )}
            
            <button 
              className="btn-primary" 
              style={{ backgroundColor: 'var(--danger-color)', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 500 }}
              onClick={onDeleteForMe}
            >
              Delete for me
            </button>
            
            <button 
              className="btn-primary" 
              style={{ backgroundColor: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--border-color)', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 500 }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
