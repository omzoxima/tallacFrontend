'use client';

import React from 'react';
import Tooltip from './Tooltip';
import { RotateCw, ArrowDownWideNarrow, ArrowUpWideNarrow, LayoutGrid, List, Copy } from 'lucide-react';

interface ToolbarControlsProps {
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  sortOptions: Array<{ value: string; label: string }>;
  viewMode?: 'grid' | 'list' | 'chat';
  detailsMode?: 'popup' | 'split';
  showViewModes?: boolean;
  showDetailsToggle?: boolean;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onSortColumnChange: (column: string) => void;
  onToggleSortDirection: () => void;
  onToggleViewMode?: () => void;
  onToggleDetailsMode?: () => void;
}

export default function ToolbarControls({
  pageSize,
  sortColumn,
  sortDirection,
  sortOptions,
  viewMode = 'grid',
  detailsMode = 'popup',
  showViewModes = true,
  showDetailsToggle = false,
  onPageSizeChange,
  onRefresh,
  onSortColumnChange,
  onToggleSortDirection,
  onToggleViewMode,
  onToggleDetailsMode,
}: ToolbarControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
        <Tooltip text="Number of items per page">
          <span className="inline-block">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="bg-gray-800 border-0 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-0 py-2.5 pr-8 pl-3 text-sm appearance-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </span>
        </Tooltip>
        <Tooltip text="Refresh data">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center p-2.5 bg-gray-700 border-l border-gray-600 text-white hover:bg-gray-600"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
        <Tooltip text="Sort by">
          <span className="inline-block">
            <select
              value={sortColumn}
              onChange={(e) => onSortColumnChange(e.target.value)}
              className="bg-gray-800 border-0 text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-0 py-2.5 pr-8 pl-3 text-sm appearance-none cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </Tooltip>
        <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
          <button
            onClick={onToggleSortDirection}
            className="flex items-center justify-center p-2.5 bg-gray-700 border-l border-gray-600 text-white hover:bg-gray-600"
          >
            {sortDirection === 'asc' ? (
              <ArrowDownWideNarrow className="w-4 h-4" />
            ) : (
              <ArrowUpWideNarrow className="w-4 h-4" />
            )}
          </button>
        </Tooltip>
      </div>

      {showViewModes && (
        <div className="flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
          <Tooltip text={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
            <button
              onClick={onToggleViewMode}
              className="flex items-center justify-center p-2.5 bg-gray-700 hover:bg-gray-600 text-white"
            >
              {viewMode === 'grid' ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </button>
          </Tooltip>

          {showDetailsToggle && (
            <Tooltip text={detailsMode === 'popup' ? 'Switch to Split View' : 'Switch to Popup View'}>
              <button
                onClick={onToggleDetailsMode}
                className="flex items-center justify-center p-2.5 bg-gray-700 border-l border-gray-600 hover:bg-gray-600 text-white"
              >
                {detailsMode === 'popup' ? (
                  <Copy className="w-4 h-4" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}

