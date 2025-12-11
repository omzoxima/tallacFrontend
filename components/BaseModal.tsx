'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  title: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  maxHeight?: string;
  zIndex?: number;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentClass?: string;
}

export default function BaseModal({
  title,
  subtitle,
  maxWidth = '2xl',
  maxHeight = '90vh',
  zIndex = 10001,
  onClose,
  children,
  footer,
}: BaseModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full'
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full overflow-hidden flex flex-col my-auto ${maxWidthClass} max-h-[${maxHeight}]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1 hidden sm:block">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}

