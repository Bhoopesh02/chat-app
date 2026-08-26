import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Notification Toast Component
 *
 * Usage:
 * <Toast message="Message sent!" type="success" onClose={() => setShowToast(false)} />
 */
const Toast = ({
  message,
  type = 'info',
  duration = 3500,
  onClose,
  actionLabel,
  onAction,
  className = ''
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--success-color)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--danger-color)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--warning-color)" />;
      default:
        return <Info size={18} color="var(--primary-color)" />;
    }
  };

  return (
    <div className={`ui-toast ui-toast-${type} ${className}`.trim()} role="alert">
      {renderIcon()}
      <span style={{ flex: 1, fontSize: '0.875rem' }}>{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-color)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.8125rem'
          }}
        >
          {actionLabel}
        </button>
      )}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex'
          }}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
