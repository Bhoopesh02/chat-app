import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Heading from './Heading';
import Text from './Text';
import Button from './Button';

/**
 * Reusable Accessible Modal Component
 * Wraps content in framer-motion animations with backdrop overlay, Escape key listener, and ARIA tags.
 *
 * Usage:
 * <Modal isOpen={show} onClose={() => setShow(false)} title="Confirmation">
 *   <Text>Modal body content</Text>
 * </Modal>
 */
const Modal = ({
  isOpen = true,
  onClose,
  title,
  description,
  footer,
  headerExtra,
  maxWidth = '400px',
  className = '',
  children,
  ...props
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`modal-content ${className}`.trim()}
          style={{ maxWidth }}
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title-id' : undefined}
          {...props}
        >
          {(title || onClose) && (
            <div className="modal-header">
              {title && (
                <div>
                  <Heading level={2} id="modal-title-id" className="modal-title">
                    {title}
                  </Heading>
                  {description && (
                    <Text variant="caption" color="secondary" style={{ marginTop: '0.25rem' }}>
                      {description}
                    </Text>
                  )}
                </div>
              )}
              {headerExtra}
              {onClose && (
                <Button
                  variant="icon"
                  onClick={onClose}
                  aria-label="Close modal"
                  icon={<X size={20} />}
                />
              )}
            </div>
          )}

          <div className="modal-body">{children}</div>

          {footer && (
            <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
