import React from 'react';
import { Modal, Button, Text } from './ui';

const DeleteConfirmModal = ({ 
  onClose, 
  onDeleteForMe, 
  onDeleteForEveryone,
  title = "Delete message?", 
  message = "Are you sure you want to delete this message?",
  canDeleteForEveryone = false
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      maxWidth="360px"
    >
      <Text variant="body" color="secondary" style={{ marginBottom: '1.25rem' }}>
        {message}
      </Text>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {canDeleteForEveryone && (
          <Button 
            variant="danger" 
            fullWidth 
            onClick={onDeleteForEveryone}
          >
            Delete for everyone
          </Button>
        )}
        
        <Button 
          variant="danger" 
          fullWidth 
          onClick={onDeleteForMe}
        >
          Delete for me
        </Button>
        
        <Button 
          variant="outline" 
          fullWidth 
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
