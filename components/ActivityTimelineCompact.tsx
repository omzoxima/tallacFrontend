'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Phone, Calendar, FileText, RefreshCw, User as UserIcon, Activity, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface ActivityTimelineCompactProps {
  prospectId: string;
  limit?: number;
  onViewAll?: () => void;
}

export interface ActivityTimelineCompactRef {
  refresh: () => void;
}

const ActivityTimelineCompact = forwardRef<ActivityTimelineCompactRef, ActivityTimelineCompactProps>(
  ({ prospectId, limit = 5, onViewAll }, ref) => {
    const [activities, setActivities] = useState<any[]>([]);
    // Don't show loading state - fetch silently in background (Vue3 jaisa)
    const [loading, setLoading] = useState(false);

    const fetchActivities = async () => {
      if (!prospectId) return;
      
      // Don't set loading to true - fetch silently
      try {
        const result = await api.getProspectActivities(prospectId);
        if (result.success && result.data) {
          // Filter out scheduled activities and limit
          const filtered = result.data
            .filter((a: any) => a.status !== 'Open' && a.status !== 'Scheduled')
            .slice(0, limit);
          setActivities(filtered);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      }
    };

    const refresh = () => {
      fetchActivities();
    };

    useImperativeHandle(ref, () => ({
      refresh,
    }));

    useEffect(() => {
      fetchActivities();
      
      const handleActivityCreated = () => {
        fetchActivities();
      };
      
      window.addEventListener('tallac:activity-created', handleActivityCreated);
      return () => window.removeEventListener('tallac:activity-created', handleActivityCreated);
    }, [prospectId, limit]);

    const getActivityIcon = (activityType: string) => {
      const iconMap: Record<string, any> = {
        'Call Log': Phone,
        'Callback': Phone,
        'Appointment': Calendar,
        'Notes': FileText,
        'Changes': RefreshCw,
        'Assignment': UserIcon,
      };
      return iconMap[activityType] || Activity;
    };

    const getActivityBgClass = (activityType: string) => {
      const colorMap: Record<string, string> = {
        'Call Log': 'bg-green-600',
        'Callback': 'bg-cyan-600',
        'Appointment': 'bg-orange-600',
        'Notes': 'bg-pink-600',
        'Changes': 'bg-purple-600',
        'Assignment': 'bg-teal-600',
      };
      return colorMap[activityType] || 'bg-gray-600';
    };

    const getActivityBadgeClass = (activityType: string) => {
      const colorMap: Record<string, string> = {
        'Call Log': 'bg-green-600 text-white',
        'Callback': 'bg-cyan-600 text-white',
        'Appointment': 'bg-orange-600 text-white',
        'Notes': 'bg-pink-600 text-white',
        'Changes': 'bg-purple-600 text-white',
        'Assignment': 'bg-teal-600 text-white',
      };
      return colorMap[activityType] || 'bg-gray-600 text-white';
    };

    const getActivityLabel = (activityType: string) => {
      return activityType || 'Activity';
    };

    const getDefaultSubject = (activity: any) => {
      if (activity.activity_type === 'Call Log') {
        return `Call - ${activity.call_outcome || 'Completed'}`;
      }
      return activity.activity_type || 'Activity';
    };

    const getUserInitials = (userEmail?: string) => {
      if (!userEmail) return '?';
      const name = userEmail.split('@')[0];
      const parts = name.split(/[._]/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const getUserName = (userEmail?: string) => {
      if (!userEmail) return 'Unknown';
      return userEmail.split('@')[0].replace(/[._]/g, ' ');
    };

    const formatTimeAgo = (dateTime?: string) => {
      if (!dateTime) return '';
      const date = new Date(dateTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return date.toLocaleDateString();
    };

    const formatDuration = (seconds?: number) => {
      if (!seconds) return '0s';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins > 0) {
        return `${mins}m ${secs}s`;
      }
      return `${secs}s`;
    };

    // Don't show loading - Vue3 doesn't show it either, fetch silently in background
    // if (loading) {
    //   return (
    //     <div className="flex items-center justify-center py-8">
    //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    //     </div>
    //   );
    // }

    if (!activities || activities.length === 0) {
      return (
        <div className="text-center py-8 space-y-2">
          <Activity className="w-12 h-12 text-gray-500 mx-auto" />
          <p className="text-gray-400 text-sm">No recent activity</p>
          <p className="text-gray-500 text-xs">Activities will appear here as they're created</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const IconComponent = getActivityIcon(activity.activity_type);
          return (
            <div key={activity.id || activity.name || index} className="flex items-start space-x-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${getActivityBgClass(activity.activity_type)}`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 bg-gray-700 flex-1 min-h-[20px] mt-1"></div>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-md p-3 transition-colors border border-gray-600/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActivityBadgeClass(activity.activity_type)}`}>
                      {getActivityLabel(activity.activity_type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(activity.date_time || activity.created_at)}
                    </span>
                  </div>

                  <h4 className="text-white font-semibold text-sm mb-1">
                    {activity.subject || getDefaultSubject(activity)}
                  </h4>

                  {activity.description && (
                    <p
                      className="text-gray-300 text-xs leading-relaxed line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: activity.description }}
                    />
                  )}

                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px] font-medium text-white">
                        {getUserInitials(activity.created_by || activity.assigned_to)}
                      </div>
                      <span>{getUserName(activity.created_by || activity.assigned_to)}</span>
                    </div>

                    {activity.activity_type === 'Call Log' && activity.duration && (
                      <>
                        <span className="mx-2">•</span>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDuration(activity.duration)}</span>
                      </>
                    )}

                    {activity.call_outcome && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{activity.call_outcome}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

ActivityTimelineCompact.displayName = 'ActivityTimelineCompact';

export default ActivityTimelineCompact;

