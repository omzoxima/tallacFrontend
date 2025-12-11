'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Activity, Phone, Calendar, FileText, RefreshCw,
  User, Clock, PhoneOutgoing, Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface FullActivityViewProps {
  prospectId: string;
  onClose: () => void;
}

export default function FullActivityView({ prospectId, onClose }: FullActivityViewProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 20;

  const filterOptions = [
    { value: 'All', label: 'All', icon: Activity },
    { value: 'Call Log', label: 'Calls', icon: Phone },
    { value: 'Notes', label: 'Notes', icon: FileText },
    { value: 'Appointment', label: 'Appointments', icon: Calendar },
    { value: 'Callback', label: 'Callbacks', icon: PhoneOutgoing },
    { value: 'Changes', label: 'Changes', icon: RefreshCw },
    { value: 'Assignment', label: 'Assignments', icon: Users },
  ];

  const groupedActivities = useMemo(() => {
    const groups: Record<string, any[]> = {};
    activities.forEach((activity) => {
      const date = activity.date_time ? activity.date_time.split(' ')[0] : 'Unknown';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
  }, [activities]);

  const fetchActivities = async (reset = false) => {
    if (reset) {
      setPage(1);
      setHasMore(true);
      setActivities([]);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters: any = {
        prospect: prospectId,
      };

      if (activeFilter !== 'All') {
        filters.activity_type = activeFilter;
      }

      const response = await api.getActivities({
        filters,
        page: reset ? 1 : page,
        page_size: PAGE_SIZE,
      });

      if (response.success && response.data) {
        if (reset) {
          setActivities(response.data);
        } else {
          setActivities((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.data.length === PAGE_SIZE);
        if (response.data.length === PAGE_SIZE) {
          setPage((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, [prospectId, activeFilter]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loadingMore && hasMore) {
      fetchActivities();
    }
  };

  const setFilter = (filter: string) => {
    setActiveFilter(filter);
  };

  const getActivityIcon = (type: string) => {
    const map: Record<string, React.ComponentType<{ className?: string }>> = {
      'Call Log': Phone,
      Callback: PhoneOutgoing,
      Appointment: Calendar,
      Notes: FileText,
      Changes: RefreshCw,
      Assignment: Users,
    };
    return map[type] || Activity;
  };

  const getActivityBgClass = (type: string) => {
    const map: Record<string, string> = {
      'Call Log': 'bg-green-500',
      Callback: 'bg-cyan-500',
      Appointment: 'bg-orange-500',
      Notes: 'bg-pink-500',
      Changes: 'bg-purple-500',
      Assignment: 'bg-teal-500',
    };
    return map[type] || 'bg-gray-500';
  };

  const getActivityTextClass = (type: string) => {
    const map: Record<string, string> = {
      'Call Log': 'text-green-400',
      Callback: 'text-cyan-400',
      Appointment: 'text-orange-400',
      Notes: 'text-pink-400',
      Changes: 'text-purple-400',
      Assignment: 'text-teal-400',
    };
    return map[type] || 'text-gray-400';
  };

  const getOutcomeColor = (outcome: string) => {
    const lower = outcome?.toLowerCase() || '';
    if (['connected', 'positive', 'interested'].some((k) => lower.includes(k))) return 'text-green-400';
    if (['no answer', 'busy', 'wrong number'].some((k) => lower.includes(k))) return 'text-red-400';
    return 'text-gray-400';
  };

  const getDefaultSubject = (activity: any) => {
    if (activity.activity_type === 'Call Log') return `Call - ${activity.call_outcome || 'Completed'}`;
    return activity.activity_type;
  };

  const getUserInitials = (name: string) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const formatDateHeader = (dateStr: string) => {
    if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateTime: string) => {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-gray-700 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Activity History
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-md">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex gap-2 overflow-x-auto">
          {filterOptions.map((filter) => {
            const FilterIcon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => setFilter(filter.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                  activeFilter === filter.value
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 scroll-smooth"
          onScroll={handleScroll}
        >
          {loading && activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No activities found</h3>
              <p className="text-gray-400 max-w-sm">
                No activities match your current filters. Try selecting a different filter or create a new activity.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedActivities).map(([date, group]) => (
                <div key={date} className="relative">
                  <div className="sticky top-0 bg-gray-900/95 backdrop-blur py-3 z-10 mb-6 border-b border-gray-800 flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{formatDateHeader(date)}</h3>
                  </div>

                  <div className="space-y-6 pl-6 border-l-2 border-gray-800 ml-3 relative">
                    {group.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.activity_type);
                      const bgClass = getActivityBgClass(activity.activity_type);
                      const textClass = getActivityTextClass(activity.activity_type);

                      return (
                        <div key={activity.name || activity.id} className="relative group">
                          <div className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-4 border-gray-900 shadow-sm transition-transform group-hover:scale-110 ${bgClass}`}></div>

                          <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg hover:bg-gray-800/80">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className={`p-2 rounded-lg bg-opacity-10 ${bgClass}`}>
                                  <ActivityIcon className={`w-5 h-5 ${textClass}`} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white text-base">
                                    {activity.subject || getDefaultSubject(activity)}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs font-medium ${textClass}`}>{activity.activity_type}</span>
                                    {activity.status && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                                        {activity.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-medium text-gray-500 bg-gray-900/50 px-2 py-1 rounded">
                                {formatTime(activity.date_time)}
                              </span>
                            </div>

                            {activity.description && (
                              <div
                                className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed mb-4 pl-1"
                                dangerouslySetInnerHTML={{ __html: activity.description }}
                              />
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-700/50 pt-3">
                              <div className="flex items-center gap-1.5" title="Created By">
                                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-medium">
                                  {getUserInitials(activity.owner || activity.created_by)}
                                </div>
                                <span>{activity.owner || activity.created_by}</span>
                              </div>

                              {activity.duration && (
                                <div className="flex items-center gap-1.5 bg-gray-700/30 px-2 py-1 rounded">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{formatDuration(activity.duration)}</span>
                                </div>
                              )}

                              {activity.call_outcome && (
                                <div className="flex items-center gap-1.5 bg-gray-700/30 px-2 py-1 rounded">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span className={getOutcomeColor(activity.call_outcome)}>{activity.call_outcome}</span>
                                </div>
                              )}

                              {activity.assigned_to && activity.assigned_to !== (activity.owner || activity.created_by) && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <span className="text-gray-600">Assigned to:</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-medium">
                                      {getUserInitials(activity.assigned_to)}
                                    </div>
                                    <span>{activity.assigned_to}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadingMore && (
            <div className="py-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

