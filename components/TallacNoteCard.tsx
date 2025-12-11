'use client';

import React from 'react';
import { Clock, User, Edit2, Trash2 } from 'lucide-react';

interface TallacNoteCardProps {
  activity: any;
  onEdit?: (activity: any) => void;
  onDelete?: (activity: any) => void;
}

export default function TallacNoteCard({ activity, onEdit, onDelete }: TallacNoteCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="note-card bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="card-header p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="note-title text-lg font-semibold text-white mb-2 break-words">{activity.title || 'Note'}</h4>
          <span className="note-date flex items-center gap-1.5 text-sm text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            {formatDate(activity.creation || activity.date_time)}
          </span>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(activity)}
              className="action-btn p-2 bg-gray-700 border-none rounded-lg text-gray-400 cursor-pointer transition-all hover:bg-gray-600 hover:text-white"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(activity)}
              className="action-btn delete p-2 bg-gray-700 border-none rounded-lg text-gray-400 cursor-pointer transition-all hover:bg-red-600 hover:text-white"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="card-body p-4">
        <div
          className="note-content text-sm text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: activity.content || activity.description || '' }}
        />
      </div>

      <div className="card-footer p-4 bg-gray-900 border-t border-gray-700">
        <div className="user-info flex items-center gap-2 text-xs text-gray-400">
          <User className="w-4 h-4 flex-shrink-0" />
          <span>
            Created by: <strong className="text-white font-semibold">{activity.owner || activity.created_by || 'Unknown'}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

