'use client';

import React from 'react';

interface Filter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersBarProps {
  activeFilters: Filter[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export default function ActiveFiltersBar({
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersBarProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-800 rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-400 mr-2 flex-shrink-0">Active Filters:</span>
        <div className="flex flex-wrap gap-2 items-center">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              <span>{filter.label}: {filter.value}</span>
              <button
                onClick={() => onRemoveFilter(filter.key)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onClearAll}
        className="text-sm text-blue-400 hover:text-blue-300 flex-shrink-0"
      >
        Clear All
      </button>
    </div>
  );
}

