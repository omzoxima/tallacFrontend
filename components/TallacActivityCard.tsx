'use client';

import React from 'react';
import { Calendar, User, Bell, Edit2, Trash2 } from 'lucide-react';

interface TallacActivityCardProps {
  activity: any;
  onEdit?: (activity: any) => void;
  onDelete?: (activity: any) => void;
}

export default function TallacActivityCard({ activity, onEdit, onDelete }: TallacActivityCardProps) {
  const priorityClass = (() => {
    const classes: Record<string, string> = {
      Low: 'badge-low',
      Medium: 'badge-medium',
      High: 'badge-high',
    };
    return classes[activity.priority] || 'badge-medium';
  })();

  const statusClass = (() => {
    const classes: Record<string, string> = {
      Open: 'badge-open',
      'In Progress': 'badge-progress',
      Completed: 'badge-completed',
      Cancelled: 'badge-cancelled',
      Overdue: 'badge-overdue',
    };
    return classes[activity.status] || 'badge-open';
  })();

  const outcomeClass = (() => {
    const classes: Record<string, string> = {
      Completed: 'badge-completed',
      Rescheduled: 'badge-medium',
      Cancelled: 'badge-cancelled',
      'No Response': 'badge-low',
    };
    return classes[activity.outcome_status] || '';
  })();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="activity-card bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="card-header p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h4 className="activity-title text-lg font-semibold text-white mb-2 break-words">
            {activity.title || `${activity.activity_type} Activity`}
          </h4>
          <div className="activity-meta flex gap-2 flex-wrap">
            <span className={`badge ${priorityClass}`}>{activity.priority} Priority</span>
            <span className={`badge ${statusClass}`}>{activity.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="activity-date flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            {formatDate(activity.scheduled_date)} at {activity.scheduled_time}
          </span>
        </div>
      </div>

      {activity.description && (
        <div className="card-body p-4">
          <p className="description text-sm text-gray-300 leading-relaxed">{activity.description}</p>
        </div>
      )}

      <div className="card-footer p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="user-info flex items-center gap-2 text-xs text-gray-400">
            <User className="w-4 h-4 flex-shrink-0" />
            <span>
              Created by: <strong className="text-white font-semibold">{activity.created_by || 'Unknown'}</strong>
            </span>
          </div>
          {activity.assigned_to && (
            <div className="user-info flex items-center gap-2 text-xs text-gray-400">
              <User className="w-4 h-4 flex-shrink-0" />
              <span>
                Assigned to: <strong className="text-white font-semibold">{activity.assigned_to}</strong>
              </span>
            </div>
          )}
          {activity.reminder_enabled && (
            <div className="reminder-info flex items-center gap-2 text-xs text-gray-400">
              <Bell className="w-4 h-4 flex-shrink-0 text-yellow-400" />
              <span>Reminder {activity.reminder_before} before</span>
            </div>
          )}
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

      {activity.outcome_notes && (
        <div className="outcome-section p-4 bg-blue-900/5 border-t border-gray-700">
          <h5 className="outcome-title text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Outcome</h5>
          <p className="outcome-text text-sm text-gray-300 mb-3">{activity.outcome_notes}</p>
          {activity.outcome_status && (
            <span className={`badge outcome-badge inline-flex ${outcomeClass}`}>{activity.outcome_status}</span>
          )}
        </div>
      )}

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .badge-low {
          background-color: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
        }
        .badge-medium {
          background-color: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }
        .badge-high {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
        .badge-open {
          background-color: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
        }
        .badge-progress {
          background-color: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }
        .badge-completed {
          background-color: rgba(34, 197, 94, 0.1);
          color: #4ade80;
        }
        .badge-cancelled {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
        .badge-overdue {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}

