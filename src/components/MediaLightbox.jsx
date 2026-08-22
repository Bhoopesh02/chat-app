import React, { useState } from 'react';
import { PhotoSlider } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

const MediaLightbox = ({ mediaArray, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!mediaArray || mediaArray.length === 0) return null;

  const images = mediaArray.map(item => ({
    src: item.mediaUrl,
    key: item.id || Math.random().toString(),
    type: item.type,
    thumbnailUrl: item.thumbnailUrl,
    fileName: item.fileName
  }));

  return (
    <PhotoSlider
      images={images}
      visible={true}
      onClose={onClose}
      index={currentIndex}
      onIndexChange={setCurrentIndex}
      toolbarRender={({ onScale, scale }) => {
        return (
          <>
            <svg
              className="PhotoView-Slider__toolbarIcon"
              onClick={() => {
                const item = images[currentIndex];
                fetch(item.src)
                  .then(response => response.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = item.fileName || 'download';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                  })
                  .catch(() => {
                    window.open(item.src, '_blank');
                  });
              }}
              width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ cursor: 'pointer', padding: '10px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </>
        );
      }}
      renderPhoto={({ photo, index }) => {
        if (photo.type === 'video') {
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video 
                controls 
                src={photo.src} 
                poster={photo.thumbnailUrl}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        }
        return undefined;
      }}
    />
  );
};

export default MediaLightbox;
