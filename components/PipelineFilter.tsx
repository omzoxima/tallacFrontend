'use client';

import React from 'react';

interface PipelineSegment {
  value: string;
  label: string;
  count: number;
  activeClass: string;
  badgeClass: string;
}

interface PipelineFilterProps {
  activeFilter: string;
  segments: PipelineSegment[];
  showQueue?: boolean;
  queueLabel?: string;
  queueCount?: number;
  showScheduled?: boolean;
  scheduledLabel?: string;
  scheduledCount?: number;
  allCount?: number;
  onFilterChange: (filter: string) => void;
}

export default function PipelineFilter({
  activeFilter,
  segments,
  showQueue = true,
  queueLabel = 'Queue',
  queueCount = 0,
  showScheduled = true,
  scheduledLabel = 'Scheduled',
  scheduledCount = 0,
  allCount = 0,
  onFilterChange,
}: PipelineFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Queue Filter Button (if enabled) */}
      {showQueue && (
        <button
          onClick={() => onFilterChange('queue')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none transition-colors ${
            activeFilter === 'queue' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          {queueLabel}
          <span
            className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
              activeFilter === 'queue' ? 'bg-red-700' : 'bg-red-600'
            }`}
          >
            {queueCount}
          </span>
        </button>
      )}

      {/* Scheduled Filter Button (if enabled) */}
      {showScheduled && (
        <button
          onClick={() => onFilterChange('scheduled')}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors ${
            activeFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          {scheduledLabel}
          <span
            className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
              activeFilter === 'scheduled' ? 'bg-blue-700' : 'bg-blue-600'
            }`}
          >
            {scheduledCount}
          </span>
        </button>
      )}

      {/* Proportional Pipeline Bar */}
      <div className="flex flex-1 min-w-[400px] h-10 bg-gray-700/50 rounded-lg overflow-hidden">
        {segments.map((segment) => (
          <button
            key={segment.value}
            onClick={() => onFilterChange(segment.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
              activeFilter === segment.value ? segment.activeClass : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <span>{segment.label}</span>
            <span className={`${segment.badgeClass} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>
              {segment.count}
            </span>
          </button>
        ))}
      </div>

      {/* All Filter Button */}
      <button
        onClick={() => onFilterChange('all')}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors ${
          activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        All
        <span
          className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
            activeFilter === 'all' ? 'bg-blue-700' : 'bg-blue-600'
          }`}
        >
          {allCount}
        </span>
      </button>
    </div>
  );
}

