import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Popover Dropdown Menu Component
 * Supports click outside dismissal, trigger custom rendering, and item options.
 *
 * Usage:
 * <Dropdown
 *   trigger={<Button variant="icon" icon={<MoreVertical size={18} />} />}
 *   items={[
 *     { label: 'Edit', onClick: handleEdit, icon: <Pencil size={16} /> },
 *     { label: 'Delete', onClick: handleDelete, variant: 'danger', icon: <Trash size={16} /> }
 *   ]}
 * />
 */
const Dropdown = ({
  trigger,
  items = [],
  align = 'right',
  className = '',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`ui-dropdown-wrapper ${className}`.trim()} ref={dropdownRef}>
      <div onClick={toggleDropdown} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleDropdown(e)}>
        {trigger}
      </div>

      {isOpen && (
        <div className={`ui-dropdown-menu ui-dropdown-${align}`} role="menu">
          {children || items.map((item, idx) => (
            <button
              key={item.key || item.label || idx}
              className={`ui-dropdown-item ${item.variant === 'danger' ? 'ui-dropdown-item-danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (item.onClick) item.onClick(e);
                setIsOpen(false);
              }}
              role="menuitem"
            >
              {item.icon && <span className="ui-dropdown-item-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
