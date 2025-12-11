'use client';

import React from 'react';
import {
  PhoneIncoming, PhoneOutgoing, Phone, Calendar, Clock, User,
  Edit2, Trash2, Mic, Play, PhoneForwarded
} from 'lucide-react';

interface TallacCallLogCardProps {
  activity: any;
  onEdit?: (activity: any) => void;
  onDelete?: (activity: any) => void;
  onCreateFollowUp?: (activity: any) => void;
}

export default function TallacCallLogCard({
  activity,
  onEdit,
  onDelete,
  onCreateFollowUp,
}: TallacCallLogCardProps) {
  const callTypeIcon = activity.call_type === 'Incoming' ? PhoneIncoming : PhoneOutgoing;
  const callTypeClass = activity.call_type === 'Incoming' ? 'text-blue-400' : 'text-green-400';

  const statusClass = (() => {
    const classes: Record<string, string> = {
      Answered: 'badge-completed',
      'No Answer': 'badge-medium',
      Busy: 'badge-medium',
      'Wrong Number': 'badge-cancelled',
      Failed: 'badge-cancelled',
      Voicemail: 'badge-low',
      'Call Back Later': 'badge-open',
    };
    return classes[activity.call_status] || 'badge-low';
  })();

  const outcomeClass = (() => {
    const classes: Record<string, string> = {
      Positive: 'badge-completed',
      Neutral: 'badge-low',
      Negative: 'badge-cancelled',
      'Callback Requested': 'badge-open',
      'No Interest': 'badge-medium',
    };
    return classes[activity.call_outcome] || '';
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const playRecording = () => {
    if (activity.recording_url) {
      window.open(activity.recording_url, '_blank');
    }
  };

  const Icon = callTypeIcon;

  return (
    <div className="call-card bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="card-header p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="call-type flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 flex-shrink-0 ${callTypeClass}`} />
            <h4 className="call-title text-lg font-semibold text-white">{activity.call_type} Call</h4>
          </div>
          <div className="call-meta flex gap-2 flex-wrap">
            <span className={`badge ${statusClass}`}>{activity.call_status}</span>
            {activity.call_outcome && <span className={`badge ${outcomeClass}`}>{activity.call_outcome}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="call-date flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            {formatDate(activity.call_date)} at {activity.call_time}
          </span>
          {activity.call_duration && (
            <span className="call-duration flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
              <Clock className="w-4 h-4 flex-shrink-0" />
              {formatDuration(activity.call_duration)}
            </span>
          )}
        </div>
      </div>

      <div className="card-body p-4 flex flex-col gap-4">
        {activity.call_summary && (
          <div className="call-section flex flex-col gap-2">
            <h5 className="section-title text-xs font-semibold text-gray-400 uppercase tracking-wide">Summary</h5>
            <p className="section-text text-sm text-gray-300 leading-relaxed">{activity.call_summary}</p>
          </div>
        )}

        {activity.call_notes && (
          <div className="call-section flex flex-col gap-2">
            <h5 className="section-title text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</h5>
            <p className="section-text text-sm text-gray-300 leading-relaxed">{activity.call_notes}</p>
          </div>
        )}

        {activity.recording_available && (
          <div className="call-section">
            <div className="recording-info flex items-center gap-2 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
              <Mic className="w-4 h-4 text-red-500" />
              <span>Recording available</span>
              {activity.recording_url && (
                <button
                  onClick={playRecording}
                  className="play-btn ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 border-none rounded-lg text-white text-xs font-semibold cursor-pointer transition-all hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Play
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card-footer p-4 bg-gray-900 border-t border-gray-700 flex justify-between items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          {(activity.caller_number || activity.receiver_number) && (
            <div className="phone-info flex items-center gap-2 text-xs text-gray-400">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>
                {activity.call_type === 'Incoming' ? (
                  <>
                    From: <strong className="text-white font-semibold">{activity.caller_number}</strong>
                  </>
                ) : (
                  <>
                    To: <strong className="text-white font-semibold">{activity.receiver_number}</strong>
                  </>
                )}
              </span>
            </div>
          )}
          {activity.handled_by && (
            <div className="user-info flex items-center gap-2 text-xs text-gray-400">
              <User className="w-4 h-4 flex-shrink-0" />
              <span>
                Handled by: <strong className="text-white font-semibold">{activity.handled_by}</strong>
              </span>
            </div>
          )}
          {activity.telephony_line && (
            <div className="line-info flex items-center gap-2 text-xs text-gray-400">
              <PhoneForwarded className="w-4 h-4 flex-shrink-0" />
              <span>Line: {activity.telephony_line}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {activity.follow_up_required && onCreateFollowUp && (
            <button
              onClick={() => onCreateFollowUp(activity)}
              className="follow-up-btn flex items-center gap-1.5 px-3 py-2 bg-indigo-600 border-none rounded-lg text-white text-xs font-semibold cursor-pointer transition-all hover:bg-indigo-700"
            >
              <Calendar className="w-4 h-4" />
              Create Follow-up
            </button>
          )}
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
        .badge-open {
          background-color: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
        }
        .badge-completed {
          background-color: rgba(34, 197, 94, 0.1);
          color: #4ade80;
        }
        .badge-cancelled {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
      `}</style>
    </div>
  );
}

