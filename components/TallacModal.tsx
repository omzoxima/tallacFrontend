'use client';

import React, { useEffect } from 'react';

interface TallacModalProps {
  show: boolean;
  title?: string;
  contentClass?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function TallacModal({
  show,
  title,
  contentClass = 'max-w-md max-h-[90vh]',
  onClose,
  children,
  footer,
}: TallacModalProps) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className="territory-modal-overlay" onClick={onClose}>
      <div className="territory-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-600/60 w-full flex flex-col backdrop-blur-sm ${contentClass}`}>
          {title && (
            <div className="flex-shrink-0 border-b border-gray-600/50 p-5 flex items-center justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-t-xl">
              <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-700/50 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>

          {footer && (
            <div className="flex-shrink-0 border-t border-gray-600/50 p-5 flex justify-end gap-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

