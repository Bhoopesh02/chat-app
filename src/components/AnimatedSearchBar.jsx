import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const AnimatedSearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  expandable = true,
  defaultOpen = false,
  autoFocus = false,
  onClear,
  onClose,
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen || !expandable || Boolean(value));
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Sync state if value changes externally or if expandable condition changes
  useEffect(() => {
    if (!expandable) {
      setIsOpen(true);
    } else if (value) {
      setIsOpen(true);
    }
  }, [expandable, value]);

  // Handle focus when opened
  useEffect(() => {
    if (isOpen && (autoFocus || expandable) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, autoFocus, expandable]);

  // Handle click outside to close if expandable and empty
  useEffect(() => {
    if (!expandable) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !value) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandable, value, onClose]);

  const handleToggle = () => {
    if (!expandable) {
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    if (isOpen) {
      if (value) {
        if (onChange) onChange('');
        if (onClear) onClear();
        if (inputRef.current) inputRef.current.focus();
      } else {
        setIsOpen(false);
        if (inputRef.current) inputRef.current.blur();
        if (onClose) onClose();
      }
    } else {
      setIsOpen(true);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('');
    if (onClear) onClear();
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (value) {
        if (onChange) onChange('');
        if (onClear) onClear();
      } else if (expandable) {
        setIsOpen(false);
        if (inputRef.current) inputRef.current.blur();
        if (onClose) onClose();
      }
    }
  };

  const openClass = isOpen ? 'open' : '';
  const hasValueClass = value && value.length > 0 ? 'has-value' : '';
  const expandableClass = expandable ? 'is-expandable' : 'is-static';

  return (
    <div
      ref={containerRef}
      className={`search-animated ${openClass} ${hasValueClass} ${expandableClass} ${className}`}
      style={style}
    >
      <button
        type="button"
        className="search-icon-btn"
        onClick={handleToggle}
        aria-label="Toggle search"
      >
        <Search size={18} />
      </button>

      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      <button
        type="button"
        className="clear-btn"
        onClick={handleClear}
        aria-label="Clear search"
        tabIndex={isOpen && value ? 0 : -1}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default AnimatedSearchBar;
