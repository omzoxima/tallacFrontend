'use client';

import React from 'react';
import { Search } from 'lucide-react';
import Tooltip from './Tooltip';

interface SearchAndFilterBarProps {
  searchQuery: string;
  searchPlaceholder?: string;
  hasActiveFilters?: boolean;
  filterCount?: number;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export default function SearchAndFilterBar({
  searchQuery,
  searchPlaceholder = 'Search...',
  hasActiveFilters = false,
  filterCount = 0,
  onSearchChange,
  onOpenFilters,
  leftActions,
  rightActions,
}: SearchAndFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      {/* Left: Filters */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="relative w-full sm:w-56">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            type="search"
            placeholder={searchPlaceholder}
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
          />
        </div>
        <Tooltip text="Open advanced filters">
          <button
            onClick={onOpenFilters}
            className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg ${
              hasActiveFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && filterCount > 0 && (
              <span className="bg-blue-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {filterCount}
              </span>
            )}
          </button>
        </Tooltip>

        {/* Additional left actions slot */}
        {leftActions}
      </div>

      {/* Right: Actions slot */}
      <div className="flex items-center justify-center md:justify-end flex-wrap gap-3 w-full md:w-auto overflow-x-auto">
        {rightActions}
      </div>
    </div>
  );
}

