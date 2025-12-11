'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus, Calendar, Phone, FileText, Edit, Users,
  PhoneIncoming, PhoneOutgoing, Clock
} from 'lucide-react';
import TallacActivityCard from './TallacActivityCard';
import TallacCallLogCard from './TallacCallLogCard';
import TallacNoteCard from './TallacNoteCard';
import TallacVersionCard from './TallacVersionCard';

interface TallacTimelineProps {
  activities: any[];
  onNewActivity?: () => void;
  onEditActivity?: (activity: any) => void;
  onDeleteActivity?: (activity: any) => void;
  onCreateFollowUp?: (activity: any) => void;
}

export default function TallacTimeline({
  activities,
  onNewActivity,
  onEditActivity,
  onDeleteActivity,
  onCreateFollowUp,
}: TallacTimelineProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { value: 'all', label: 'All', icon: Clock },
    { value: 'activity', label: 'Activities', icon: Calendar },
    { value: 'call_log', label: 'Calls', icon: Phone },
    { value: 'note', label: 'Notes', icon: FileText },
    { value: 'version', label: 'Changes', icon: Edit },
    { value: 'assignment', label: 'Assignments', icon: Users },
  ];

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') {
      return activities;
    }
    return activities.filter((a) => a.timeline_type === activeFilter);
  }, [activities, activeFilter]);

  const getFilterCount = (filterValue: string) => {
    if (filterValue === 'all') return activities.length;
    return activities.filter((a) => a.timeline_type === filterValue).length;
  };

  const getActivityComponent = (activity: any) => {
    switch (activity.timeline_type) {
      case 'activity':
        return TallacActivityCard;
      case 'call_log':
        return TallacCallLogCard;
      case 'note':
        return TallacNoteCard;
      case 'version':
        return TallacVersionCard;
      default:
        return TallacActivityCard;
    }
  };

  const getActivityIcon = (activity: any) => {
    switch (activity.timeline_type) {
      case 'activity':
        return activity.activity_type === 'Appointment' ? Calendar : Phone;
      case 'call_log':
        return activity.call_type === 'Incoming' ? PhoneIncoming : PhoneOutgoing;
      case 'note':
        return FileText;
      case 'version':
        return Edit;
      case 'assignment':
        return Users;
      default:
        return Clock;
    }
  };

  const getActivityColor = (activity: any) => {
    switch (activity.timeline_type) {
      case 'activity':
        return activity.activity_type === 'Appointment' ? 'bg-purple-500' : 'bg-blue-500';
      case 'call_log':
        return activity.call_status === 'Answered' ? 'bg-green-500' : 'bg-orange-500';
      case 'note':
        return 'bg-yellow-500';
      case 'version':
        return 'bg-gray-500';
      case 'assignment':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEmptyStateIcon = () => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      activity: Calendar,
      call_log: Phone,
      note: FileText,
      version: Edit,
      assignment: Users,
      all: Clock,
    };
    return iconMap[activeFilter] || Clock;
  };

  const getEmptyStateMessage = () => {
    const messages: Record<string, string> = {
      all: 'Start by creating a new activity, logging a call, or adding a note.',
      activity: 'Schedule callbacks and appointments to stay organized.',
      call_log: 'Log your calls to keep track of all conversations.',
      note: 'Add notes to document important information.',
      version: 'Field changes will appear here automatically.',
      assignment: 'Assignments will appear here when tasks are assigned.',
    };
    return messages[activeFilter] || '';
  };

  const EmptyIcon = getEmptyStateIcon();

  return (
    <div className="timeline-container flex flex-col gap-6">
      <div className="timeline-header flex flex-col gap-4">
        <h3 className="timeline-title text-2xl font-bold text-white m-0">Activity Timeline</h3>
        <div className="timeline-actions flex justify-between items-center flex-wrap gap-4">
          <div className="filter-buttons flex gap-2 flex-wrap">
            {filters.map((filter) => {
              const FilterIcon = filter.icon;
              return (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`filter-btn flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                    activeFilter === filter.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-600 hover:border-gray-500'
                  }`}
                >
                  <FilterIcon className="w-4 h-4" />
                  <span>{filter.label}</span>
                  {getFilterCount(filter.value) > 0 && (
                    <span className="filter-count inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-white/20 rounded-full text-xs font-semibold">
                      {getFilterCount(filter.value)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {onNewActivity && (
            <button
              onClick={onNewActivity}
              className="new-activity-btn flex items-center gap-2 px-6 py-3 bg-blue-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Activity</span>
            </button>
          )}
        </div>
      </div>

      <div className="timeline-content relative">
        {filteredActivities.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center py-16 px-8 text-center">
            <EmptyIcon className="w-16 h-16 text-gray-500 mb-4" />
            <p className="empty-title text-lg font-semibold text-gray-300 mb-2">No {activeFilter} activities</p>
            <p className="empty-description text-sm text-gray-400 max-w-md">{getEmptyStateMessage()}</p>
          </div>
        ) : (
          <div className="timeline-list flex flex-col">
            {filteredActivities.map((activity, index) => {
              const ActivityComponent = getActivityComponent(activity);
              const ActivityIcon = getActivityIcon(activity);
              const colorClass = getActivityColor(activity);

              return (
                <div key={activity.id || activity.name || index} className="timeline-item grid grid-cols-[2.5rem_1fr] gap-4 relative">
                  <div className="timeline-marker flex flex-col items-center relative">
                    <div className={`timeline-dot w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${colorClass}`}>
                      <ActivityIcon className="w-5 h-5 text-white" />
                    </div>
                    {index < filteredActivities.length - 1 && (
                      <div className="timeline-line absolute top-10 bottom-[-1rem] left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-700"></div>
                    )}
                  </div>

                  <div className="timeline-card pb-6">
                    <ActivityComponent
                      activity={activity}
                      onEdit={onEditActivity}
                      onDelete={onDeleteActivity}
                      onCreateFollowUp={onCreateFollowUp}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

