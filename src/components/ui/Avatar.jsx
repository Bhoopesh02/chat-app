import React, { useState } from 'react';

/**
 * Reusable Avatar Component
 * Displays user profile image with fallback initials or generated avatar, and status badges.
 *
 * Usage:
 * <Avatar name="Jane Doe" src={userAvatar} size="md" status="online" />
 */
const Avatar = ({
  src,
  name = '',
  size = 'md',
  status,
  className = '',
  alt,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  // Generate fallback initials
  const getInitials = (str) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarSrc = src || (name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}` : null);
  const showFallback = imageError || !avatarSrc;

  return (
    <div className={`ui-avatar-container ui-avatar-${size} ${className}`.trim()} {...props}>
      {showFallback ? (
        <div className="ui-avatar-fallback">
          {getInitials(name)}
        </div>
      ) : (
        <img
          src={avatarSrc}
          alt={alt || name || 'Avatar'}
          className="ui-avatar-img"
          onError={() => setImageError(true)}
        />
      )}
      {status && (
        <span
          className={`ui-avatar-status ui-status-${status} ui-status-${size}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;
