import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmClass?: string;
  requiredConfirmText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "OK", 
  confirmClass = "confirm",
  requiredConfirmText
}) => {
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!isOpen) setInputText('');
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = requiredConfirmText ? inputText !== requiredConfirmText : false;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        
        {requiredConfirmText && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Type "{requiredConfirmText}" to confirm:
            </p>
            <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              placeholder={requiredConfirmText}
              autoFocus
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--secondary-bg)',
                color: 'var(--text-color)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>Cancel</button>
          <button 
            className={`modal-btn ${confirmClass}`} 
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
