import React from 'react';
import { X, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const UserProfileModal = ({ user, onClose, onOpenMediaGallery }) => {
  if (!user) return null;

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content" 
        style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
          <h2 style={{
            fontSize: '1.125rem', fontWeight: '600', flex: 1, textAlign: 'center', margin: 0,
            marginLeft: '28px'
          }}>
            User Profile
          </h2>
          <button className="btn-icon" onClick={onClose} style={{ marginLeft: 'auto', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`} 
                alt={user.name} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} 
              />
            </div>

            <div style={{ width: '100%', textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Username</label>
              <div style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {user.name}
              </div>
            </div>
            
            {onOpenMediaGallery && (
              <div 
                style={{ 
                  width: '100%', 
                  marginTop: '2rem', 
                  backgroundColor: 'var(--background-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)'
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfileModal;
