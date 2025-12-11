'use client';

import React from 'react';
import { Lock, X } from 'lucide-react';

interface TallacTagProps {
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'gray' | 'purple' | 'indigo' | 'pink';
  locked?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

export default function TallacTag({
  color = 'blue',
  locked = false,
  showRemove = false,
  onRemove,
  children,
}: TallacTagProps) {
  const colorClass = (() => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    };
    return colors[color] || colors.blue;
  })();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${
        locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
      }`}
    >
      {children}
      {!locked && showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 focus:outline-none"
        >
          <X className="w-2 h-2" />
        </button>
      )}
      {locked && <Lock className="ml-1.5 w-3 h-3" />}
    </span>
  );
}

