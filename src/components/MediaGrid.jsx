import React from 'react';
import { Play } from 'lucide-react';

const MediaGrid = ({ media, onMediaClick }) => {
  if (!media || media.length === 0) return null;

  const count = media.length;
  const gridClass = count >= 5 ? 'media-grid-4' : `media-grid-${count}`;
  const displayMedia = count >= 5 ? media.slice(0, 4) : media;
  const extraCount = count - 4;

  return (
    <div className={`media-grid-container ${gridClass}`}>
      {displayMedia.map((item, index) => {
        const isVideo = item.type === 'video';
        const isLastOfMany = count >= 5 && index === 3;
        const src = item.thumbnailUrl || item.mediaUrl;

        return (
          <div 
            key={index} 
            className={`media-grid-item ${isLastOfMany ? 'has-overlay' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onMediaClick(index);
            }}
          >
            <img src={src} alt={item.fileName || 'Media'} loading="lazy" />
            {isVideo && !isLastOfMany && (
              <div className="video-overlay-icon">
                <Play fill="white" size={24} />
              </div>
            )}
            {isLastOfMany && (
              <div className="more-media-overlay">
                <span>+{extraCount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MediaGrid;
