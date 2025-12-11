'use client';

import React from 'react';
import { X, User, FileText, Trash2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  selectAllChecked: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAssign?: () => void;
  onBulkChangeStatus?: () => void;
  onBulkDelete?: () => void;
  onExit: () => void;
  actions?: React.ReactNode;
}

export default function BulkActionBar({
  selectedCount,
  selectAllChecked,
  onToggleSelectAll,
  onClearSelection,
  onBulkAssign,
  onBulkChangeStatus,
  onBulkDelete,
  onExit,
  actions,
}: BulkActionBarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-700 rounded-lg shadow-lg">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <input
          checked={selectAllChecked}
          onChange={onToggleSelectAll}
          type="checkbox"
          className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600 cursor-pointer"
        />
        <label
          onClick={onToggleSelectAll}
          className="text-sm font-medium text-white cursor-pointer"
        >
          Select All (Visible)
        </label>
        <span className="text-sm text-gray-300">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button onClick={onClearSelection} className="text-sm text-blue-400 hover:text-blue-300">
          Deselect all
        </button>
      </div>
      <div className="flex items-center justify-end gap-3 w-full md:w-auto flex-wrap">
        {actions || (
          <>
            {/* Default bulk actions */}
            {onBulkAssign && (
              <button
                onClick={onBulkAssign}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600"
              >
                <User className="w-4 h-4" />
                Assign...
              </button>
            )}
            {onBulkChangeStatus && (
              <button
                onClick={onBulkChangeStatus}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600"
              >
                <FileText className="w-4 h-4" />
                Change Status...
              </button>
            )}
            {onBulkDelete && (
              <button
                onClick={onBulkDelete}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-800 text-white font-medium rounded-lg text-sm hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </>
        )}
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

