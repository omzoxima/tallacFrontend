'use client';

import { List, Grid } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded transition-all ${
          view === 'list'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="List View"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded transition-all ${
          view === 'grid'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        title="Grid View"
      >
        <Grid className="w-4 h-4" />
      </button>
    </div>
  );
}

