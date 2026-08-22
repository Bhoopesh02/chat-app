import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Search, Info, CheckSquare, Clock, Star, Copy, Trash2, XCircle, FilePlus, Bookmark } from 'lucide-react';

const ChatOverflowMenu = ({ 
  chatType, 
  onSearch,
  onSelectMessages,
  onClearChat,
  onDeleteChat,
  onDisappearingMessages,
  canChangeDisappearing = true,
  activeDisappearingDuration = null,
  onContactInfo,
  onMuteToggle,
  onAddToFavourites,
  onAddToList,
  isMuted,
  isFavourite
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDisappearingMenu, setShowDisappearingMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowDisappearingMenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);
    setShowDisappearingMenu(false);
    if (action) action();
  };

  const handleDisappearingSelect = (duration) => {
    setIsOpen(false);
    setShowDisappearingMenu(false);
    if (onDisappearingMessages) onDisappearingMessages(duration);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button className="btn-icon" onClick={onSearch} title="Search in chat">
        <Search size={20} />
      </button>

      <div className="dropdown-container" ref={menuRef} style={{ position: 'relative' }}>
        <button className="btn-icon" onClick={() => setIsOpen(!isOpen)} title="More options">
          <MoreVertical size={20} />
        </button>

        {isOpen && (
          <div className="dropdown-menu" style={{ 
            position: 'absolute', 
            right: 0, 
            top: '100%', 
            backgroundColor: 'var(--surface-color)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '0.5rem', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minWidth: '200px',
            zIndex: 100,
            padding: '0.5rem 0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {showDisappearingMenu ? (
              <>
                <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                  <button className="btn-icon" style={{ padding: '0.25rem', margin: '-0.25rem' }} onClick={() => setShowDisappearingMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Disappearing messages</span>
                </div>
                
                <button className="dropdown-item" style={itemStyle} onClick={() => handleDisappearingSelect(86400000)}>
                  <span style={{ flex: 1, textAlign: 'left' }}>24 hours</span>
                  {activeDisappearingDuration === 86400000 && <CheckSquare size={16} color="var(--primary-color)" />}
                </button>
                <button className="dropdown-item" style={itemStyle} onClick={() => handleDisappearingSelect(604800000)}>
                  <span style={{ flex: 1, textAlign: 'left' }}>7 days</span>
                  {activeDisappearingDuration === 604800000 && <CheckSquare size={16} color="var(--primary-color)" />}
                </button>
                <button className="dropdown-item" style={itemStyle} onClick={() => handleDisappearingSelect(7776000000)}>
                  <span style={{ flex: 1, textAlign: 'left' }}>90 days</span>
                  {activeDisappearingDuration === 7776000000 && <CheckSquare size={16} color="var(--primary-color)" />}
                </button>
                <button className="dropdown-item" style={itemStyle} onClick={() => handleDisappearingSelect(null)}>
                  <span style={{ flex: 1, textAlign: 'left' }}>Off</span>
                  {!activeDisappearingDuration && <CheckSquare size={16} color="var(--primary-color)" />}
                </button>
              </>
            ) : (
              <>
                <button className="dropdown-item" style={itemStyle} onClick={() => handleAction(onContactInfo)}>
                  {chatType === 'group' ? 'Group info' : 'Contact info'}
                </button>

                <button className="dropdown-item" style={itemStyle} onClick={() => handleAction(onSelectMessages)}>
                  Select messages
                </button>
                
                <button className="dropdown-item" style={itemStyle} onClick={() => handleAction(onMuteToggle)}>
                  {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                </button>

                {canChangeDisappearing && (
                  <button className="dropdown-item" style={itemStyle} onClick={(e) => { e.stopPropagation(); setShowDisappearingMenu(true); }}>
                    Disappearing messages
                  </button>
                )}

                <button className="dropdown-item" style={itemStyle} onClick={() => handleAction(onAddToFavourites)}>
                  {isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                </button>

                <button className="dropdown-item" style={itemStyle} onClick={() => handleAction(onAddToList)}>
                  Add to list
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                <button className="dropdown-item" style={itemStyle} onClick={() => handleAction(onClearChat)}>
                  Clear chat
                </button>
                
                {chatType !== 'private' && (
                  <button className="dropdown-item" style={{...itemStyle, color: 'var(--danger-color)'}} onClick={() => handleAction(onDeleteChat)}>
                    {chatType === 'group' ? 'Exit group' : 'Delete chat'}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const itemStyle = {
  padding: '0.75rem 1rem',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  width: '100%',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
};

export default ChatOverflowMenu;
