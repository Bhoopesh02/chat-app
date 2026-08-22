export const capitalizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  // Capitalize the first letter of each word
  return name.replace(/\b\w/g, char => char.toUpperCase());
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0][0].toUpperCase();
  }
  return '';
};

export const getAvatarFallback = (name, type = 'user') => {
  const safeName = name || (type === 'group' ? 'Group' : 'User');
  if (type === 'group') {
    const initials = getInitials(safeName);
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(safeName)}`;
};

export const getDisplayAvatar = (avatarUrl, name, type = 'user') => {
  // If it's a dicebear initials URL, regenerate it with our custom initials logic 
  // to fix the issue where single words generated 2 letters.
  if (avatarUrl && avatarUrl.includes('api.dicebear.com/7.x/initials')) {
    return getAvatarFallback(name, 'group');
  }
  
  if (avatarUrl && avatarUrl.includes('api.dicebear.com/7.x/avataaars')) {
    return getAvatarFallback(name, 'user');
  }
  
  return avatarUrl || getAvatarFallback(name, type);
};
