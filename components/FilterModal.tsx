'use client';

import React from 'react';
import { X } from 'lucide-react';

interface FilterModalProps {
  show: boolean;
  title?: string;
  clearLabel?: string;
  applyLabel?: string;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  children: React.ReactNode;
}

export default function FilterModal({
  show,
  title = 'Filters',
  clearLabel = 'Clear All',
  applyLabel = 'Apply Filters',
  onClose,
  onClear,
  onApply,
  children,
}: FilterModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-6" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" title="Close">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-3 mt-6 p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-lg">
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            {clearLabel}
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

