'use client';

import React from 'react';
import { Calendar, Building2, User, MoreVertical, Eye, Edit, Filter } from 'lucide-react';
import Tooltip from './Tooltip';

interface ActivityCardProps {
  activity: any;
  viewMode?: 'list' | 'chat';
  isActive?: boolean;
  onClick?: (activity: any) => void;
  onView?: (activity: any) => void;
  onEdit?: (activity: any) => void;
  onFilterCompany?: (company: string) => void;
  onMore?: (activity: any) => void;
}

export default function ActivityCard({
  activity,
  viewMode = 'list',
  isActive = false,
  onClick,
  onView,
  onEdit,
  onFilterCompany,
  onMore,
}: ActivityCardProps) {
  const borderClass = (() => {
    const typeMap: Record<string, string> = {
      'changes': 'border-transparent hover:border-purple-500',
      'call-log': 'border-transparent hover:border-green-500',
      'email': 'border-transparent hover:border-cyan-500',
      'assignment': 'border-transparent hover:border-teal-500',
      'appointment': 'border-transparent hover:border-orange-500',
      'note': 'border-transparent hover:border-pink-500',
    };
    return typeMap[activity.activity_type] || 'border-transparent hover:border-gray-500';
  })();

  const typeBadgeClass = (() => {
    const typeMap: Record<string, string> = {
      'changes': 'bg-purple-600 text-white',
      'call-log': 'bg-green-600 text-white',
      'callback': 'bg-cyan-600 text-white',
      'assignment': 'bg-teal-600 text-white',
      'appointment': 'bg-orange-600 text-white',
      'note': 'bg-pink-600 text-white',
    };
    return typeMap[activity.activity_type] || 'bg-gray-500 text-white';
  })();

  const typeLabel = (() => {
    const typeMap: Record<string, string> = {
      'changes': 'Changes',
      'call-log': 'Call Log',
      'callback': 'Callback',
      'assignment': 'Assignment',
      'appointment': 'Appointment',
      'note': 'Note',
    };
    return typeMap[activity.activity_type] || 'Activity';
  })();

  const queueStatusClass = (() => {
    const statusMap: Record<string, string> = {
      'overdue': 'text-red-400',
      'today': 'text-yellow-400',
      'scheduled': 'text-blue-400',
    };
    return statusMap[activity.queue_status] || 'text-gray-400';
  })();

  const queueStatusChatClass = (() => {
    const statusMap: Record<string, string> = {
      'overdue': 'bg-red-900/50 text-red-300 border border-red-700',
      'today': 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
      'scheduled': 'bg-blue-900/50 text-blue-300 border border-blue-700',
    };
    return statusMap[activity.queue_status] || 'bg-gray-800 text-gray-400 border border-gray-700';
  })();

  const getQueueMessage = (status: string) => {
    const statusMap: Record<string, string> = {
      'overdue': 'Overdue: Needs attention',
      'today': 'Today: Scheduled for today',
      'scheduled': 'Scheduled: Future date',
    };
    return statusMap[status] || 'No schedule set';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (viewMode === 'chat') {
    return (
      <div
        onClick={() => onClick?.(activity)}
        className={`flex gap-4 transition-all duration-200 cursor-pointer ${isActive ? 'bg-gray-800/50 rounded-lg' : ''}`}
      >
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${typeBadgeClass}`}>
            {(activity.created_by || 'U').charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-white text-sm">{activity.created_by || 'Unknown'}</span>
            <span className="text-xs text-gray-500">{formatDate(activity.scheduled_date)}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeClass}`}>
              {typeLabel}
            </span>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 mb-2">
            <h4 className="text-white font-medium mb-1">{activity.subject || activity.title || 'Activity'}</h4>

            {activity.company && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>{activity.company}</span>
              </div>
            )}

            {activity.description && (
              <p className="text-sm text-gray-300">{activity.description}</p>
            )}

            {activity.assigned_to && activity.assigned_to !== activity.created_by && (
              <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-2">
                <User className="w-3.5 h-3.5" />
                <span>Assigned to {activity.assigned_to}</span>
              </div>
            )}
          </div>

          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${queueStatusChatClass}`}>
            {activity.queue_status === 'overdue' ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : activity.queue_status === 'today' ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{activity.queue_message || getQueueMessage(activity.queue_status)}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Tooltip text="View details">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(activity);
                }}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                View
              </button>
            </Tooltip>
            <Tooltip text="Edit activity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(activity);
                }}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                Edit
              </button>
            </Tooltip>
            {activity.company && (
              <Tooltip text="Filter by company">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterCompany?.(activity.company);
                  }}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                >
                  Filter by Company
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(activity)}
      className={`bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 relative cursor-pointer ${borderClass} ${isActive ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-bold text-white truncate pr-2">
            {activity.subject || activity.title || 'Activity'}
          </h4>
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${typeBadgeClass}`}>
            {typeLabel}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          {activity.company && (
            <p className="flex items-center">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="ml-1.5">{activity.company}</span>
            </p>
          )}
          {activity.scheduled_date && (
            <p className="flex items-center">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="ml-1.5">{formatDate(activity.scheduled_date)}</span>
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center">
            <User className="w-4 h-4 mr-1.5" />
            Created by: <span className="font-medium ml-1">{activity.created_by || 'Unknown'}</span>
          </span>
          {activity.assigned_to && (
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1.5" />
              Assigned to: <span className="font-medium ml-1">{activity.assigned_to}</span>
            </span>
          )}
        </div>

        {activity.description && (
          <p className="text-xs text-gray-400 line-clamp-2">{activity.description}</p>
        )}
      </div>

      <div className={`px-4 py-3 bg-gray-800/70 flex items-center`}>
        <p className={`text-xs flex items-center w-full ${queueStatusClass}`}>
          {activity.queue_status === 'overdue' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : activity.queue_status === 'today' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
          <span className="ml-1.5 font-medium">{activity.queue_message || getQueueMessage(activity.queue_status)}</span>
        </p>
      </div>

      <div className="p-3 bg-gray-800/50 flex justify-between items-center mt-auto">
        <div className="flex items-center space-x-2">
          <Tooltip text="View details">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(activity);
              }}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
            >
              <Eye className="w-5 h-5" />
            </button>
          </Tooltip>
          {activity.company && (
            <Tooltip text="Filter by company">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterCompany?.(activity.company);
                }}
                className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
              >
                <Filter className="w-5 h-5" />
              </button>
            </Tooltip>
          )}
          <Tooltip text="Edit activity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(activity);
              }}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
            >
              <Edit className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center space-x-2">
          <Tooltip text="More options">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMore?.(activity);
              }}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

