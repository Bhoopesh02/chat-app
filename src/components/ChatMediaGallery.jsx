import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { chatService } from '../services/chatService';
import MediaLightbox from './MediaLightbox';

const ChatMediaGallery = ({ chat, onClose }) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxData, setLightboxData] = useState(null);

  useEffect(() => {
    if (!chat || !chat.id) return;
    
    setLoading(true);
    const unsubscribe = chatService.subscribeToConversationMedia(chat.id, (items) => {
      setMediaItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chat]);

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-content" style={{ padding: 0, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
          <button className="btn-icon" onClick={onClose} style={{ marginRight: '0.5rem' }}>
            <ChevronLeft size={24} />
          </button>
          <h2 style={{ flex: 1, margin: 0, fontSize: '1.125rem' }}>Media, Links, and Docs</h2>
        </div>

        <div className="media-gallery-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading media...</div>
          ) : mediaItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No media found</p>
            </div>
          ) : (
            <div className="media-gallery-grid">
              {mediaItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="gallery-grid-item"
                  onClick={() => setLightboxData({ mediaArray: mediaItems, initialIndex: index })}
                >
                  <img src={item.thumbnailUrl || item.mediaUrl} alt={item.fileName || 'Media'} loading="lazy" />
                  {item.type === 'video' && (
                    <div className="video-badge">Video</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightboxData && (
        <MediaLightbox 
          mediaArray={lightboxData.mediaArray}
          initialIndex={lightboxData.initialIndex}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
};

export default ChatMediaGallery;
