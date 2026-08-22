import React from 'react';
import { X } from 'lucide-react';
import { getAvatarFallback } from '../utils/stringUtils';

const ViewVotesModal = ({ pollData, allUsers, onClose }) => {
  const { question, options } = pollData;

  const getUser = (uid) => {
    return allUsers.find(u => u.id === uid) || { id: uid, name: 'Unknown User' };
  };

  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content view-votes-modal">
        <div className="modal-header">
          <h3>Poll Details</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{question}</h4>
          
          <div className="votes-breakdown">
            {options.map((opt, index) => {
              const voters = opt.votes ? Object.keys(opt.votes) : [];
              if (voters.length === 0) return null;
              
              // Sort voters by timestamp (newest first)
              voters.sort((a, b) => opt.votes[b] - opt.votes[a]);

              return (
                <div key={opt.id} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h5 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '20px', 
                        height: '20px', 
                        background: 'var(--primary-color)', 
                        color: 'white', 
                        borderRadius: '50%',
                        fontSize: '0.7rem'
                      }}>
                        {getOptionLetter(index)}
                      </span>
                      {opt.text}
                    </h5>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                      {voters.length}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {voters.map(uid => {
                      const user = getUser(uid);
                      const timestamp = new Date(opt.votes[uid]).toLocaleString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      });
                      
                      return (
                        <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                          <img 
                            src={user.avatar || getAvatarFallback(user.name, 'user')} 
                            alt={user.name} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{timestamp}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {options.every(opt => !opt.votes || Object.keys(opt.votes).length === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                No votes yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewVotesModal;
