'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import ProspectDetails from '@/components/ProspectDetails';

interface Activity {
  id: string;
  name: string;
  activity_type: string;
  title: string;
  status_name?: string;
  company?: string;
  scheduled_date: string;
  scheduled_time: string;
  assigned_to_name?: string;
  created_by_name?: string;
  description?: string;
  queue_status?: string;
  queue_message?: string;
}

interface Prospect {
  id: string;
  name: string;
  company_name: string;
  lead_name?: string;
  title?: string;
  email_id?: string;
  phone?: string;
  primary_phone?: string;
  primary_email?: string;
  city?: string;
  state?: string;
  territory?: string;
  lead_owner?: string;
  status: string;
  industry?: string;
  queue_status?: string;
  queue_message?: string;
  contact_path?: Array<{ name: string; status: string }>;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showProspectDetails, setShowProspectDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('popup');
  const [companyFilter, setCompanyFilter] = useState<string>('');

  useEffect(() => {
    // Check for company filter in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const company = params.get('company');
      if (company) {
        setCompanyFilter(company);
        setSearchQuery(company); // Pre-fill search with company name
      }
    }
    loadActivities();
  }, [activeFilter]);

  useEffect(() => {
    loadProspects();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter === 'queue') {
        params.append('scheduled_date_from', new Date().toISOString().split('T')[0]);
      }
      // Add company filter if present
      if (companyFilter) {
        // Filter will be applied in filteredActivities useMemo
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/activities?${params.toString()}`
      );
      const data = await response.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProspects = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/leads`
      );
      const data = await response.json();
      setProspects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading prospects:', error);
      setProspects([]);
    }
  };

  const handleActivityCardClick = (activity: Activity) => {
    setSelectedActivity(activity);
    
    // Find the corresponding prospect by company name
    const prospect = prospects.find(p => p.company_name === activity.company);
    
    if (prospect) {
      setSelectedProspect(prospect);
      setShowProspectDetails(true);
      
      // Determine view mode based on screen size
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setDetailsViewMode('split');
      } else {
        setDetailsViewMode('popup');
      }
    } else {
      console.warn(`No prospect found for company: ${activity.company}`);
      alert(`No prospect information available for ${activity.company || 'this activity'}`);
    }
  };

  const closeProspectDetails = () => {
    setShowProspectDetails(false);
    setSelectedProspect(null);
    setSelectedActivity(null);
  };

  const getActivityTypeBadgeClass = (type: string) => {
    const typeMap: Record<string, string> = {
      'changes': 'bg-purple-600 text-white',
      'call-log': 'bg-green-600 text-white',
      'callback': 'bg-cyan-600 text-white',
      'assignment': 'bg-teal-600 text-white',
      'appointment': 'bg-orange-600 text-white',
      'note': 'bg-pink-600 text-white',
    };
    return typeMap[type] || 'bg-gray-500 text-white';
  };

  const getActivityTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'changes': 'Changes',
      'call-log': 'Call Log',
      'callback': 'Callback',
      'assignment': 'Assignment',
      'appointment': 'Appointment',
      'note': 'Note',
    };
    return typeMap[type] || 'Activity';
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
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getQueueStatusColor = (status?: string) => {
    const statusMap: Record<string, string> = {
      'overdue': 'text-red-400',
      'today': 'text-yellow-400',
      'scheduled': 'text-blue-400',
    };
    return statusMap[status || ''] || 'text-gray-400';
  };

  const getQueueMessage = (status?: string) => {
    const statusMap: Record<string, string> = {
      'overdue': 'Overdue: Needs attention',
      'today': 'Today: Scheduled for today',
      'scheduled': 'Scheduled: Future date',
    };
    return statusMap[status || ''] || 'No schedule set';
  };

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        ((a as any).subject || '').toLowerCase().includes(query) ||
        (a.title || '').toLowerCase().includes(query) ||
        (a.company || '').toLowerCase().includes(query) ||
        (a.description || '').toLowerCase().includes(query) ||
        (a.created_by_name || (a as any).created_by || '').toLowerCase().includes(query)
      );
    }

    // Apply activity type/queue filter
    if (activeFilter === 'all') {
      // Show all
    } else if (activeFilter === 'queue') {
      filtered = filtered.filter(a => 
        a.queue_status === 'overdue' || a.queue_status === 'today'
      );
    } else if (activeFilter === 'scheduled') {
      filtered = filtered.filter(a => a.queue_status === 'scheduled');
    } else {
      // Activity type filter
      filtered = filtered.filter(a => a.activity_type === activeFilter);
    }

    return filtered;
  }, [activities, searchQuery, activeFilter]);

  return (
    <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Activity Type Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setActiveFilter('queue')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeFilter === 'queue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-red-700'
              }`}
            >
              Queue
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {Array.isArray(activities) ? activities.filter(a => a.queue_status === 'overdue' || a.queue_status === 'today').length : 0}
              </span>
            </button>
            
            <button
              onClick={() => setActiveFilter('scheduled')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeFilter === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-blue-700'
              }`}
            >
              Scheduled
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {Array.isArray(activities) ? activities.filter(a => a.queue_status === 'scheduled').length : 0}
              </span>
            </button>

            <div className="flex flex-1 min-w-[400px] h-10 bg-gray-700/50 rounded-lg overflow-hidden">
              {['call-log', 'callback', 'appointment', 'note', 'changes', 'assignment'].map((type) => {
                const count = Array.isArray(activities) ? activities.filter(a => a.activity_type === type).length : 0;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all ${
                      activeFilter === type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <span className="capitalize">{type.replace('-', ' ')}</span>
                    <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">{count}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-blue-700'
              }`}
            >
              All
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {Array.isArray(activities) ? activities.length : 0}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search activities, companies, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Activities List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full mb-4"></div>
              <p className="text-gray-400">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-lg">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No activities found</h3>
                <p className="text-sm text-gray-400">Try adjusting your filters.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id || activity.name}
                  onClick={() => handleActivityCardClick(activity)}
                  className={`bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 border-transparent hover:border-blue-500 cursor-pointer ${
                    selectedActivity?.id === activity.id && showProspectDetails ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-white truncate pr-2">
                        {(activity as any).subject || activity.title || 'Activity'}
                      </h4>
                      <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                        {getActivityTypeLabel(activity.activity_type)}
                      </span>
                    </div>
                    {/* Company & Date */}
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      {activity.company && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                          <span className="ml-1.5">{activity.company}</span>
                        </p>
                      )}
                      {activity.scheduled_date && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="ml-1.5">{formatDate(activity.scheduled_date)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Meta Info */}
                  <div className="px-4 pb-4 border-b border-gray-700 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Created by: <span className="font-medium ml-1">{activity.created_by_name || 'Unknown'}</span>
                      </span>
                      {activity.assigned_to_name && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                          </svg>
                          Assigned to: <span className="font-medium ml-1">{activity.assigned_to_name}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Description Preview */}
                    {activity.description && (
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>

                  {/* Queue Status */}
                  {activity.queue_status && (
                    <div className="px-4 py-3 bg-gray-800/70 flex items-center">
                      <p className={`text-xs flex items-center w-full ${getQueueStatusColor(activity.queue_status)}`}>
                        {activity.queue_status === 'overdue' ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                        ) : activity.queue_status === 'today' ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                          </svg>
                        )}
                        <span className="ml-1.5 font-medium">{activity.queue_message || getQueueMessage(activity.queue_status)}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <MobileBottomNav />

      {/* Prospect Details Modal (Popup View) */}
      {detailsViewMode === 'popup' && showProspectDetails && selectedProspect && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeProspectDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <ProspectDetails
              prospect={selectedProspect}
              mode="popup"
              showCloseButton={true}
              onClose={closeProspectDetails}
            />
          </div>
        </div>
      )}

      {/* Details Panel (Split View) */}
      {detailsViewMode === 'split' && showProspectDetails && selectedProspect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
          <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id || activity.name}
                    onClick={() => handleActivityCardClick(activity)}
                    className={`bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 border-transparent hover:border-blue-500 cursor-pointer ${
                      selectedActivity?.id === activity.id && showProspectDetails ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-lg font-bold text-white truncate pr-2">
                          {activity.title || 'Activity'}
                        </h4>
                        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                          {getActivityTypeLabel(activity.activity_type)}
                        </span>
                      </div>
                      {/* Company & Date */}
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        {activity.company && (
                          <p className="flex items-center">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            <span className="ml-1.5">{activity.company}</span>
                          </p>
                        )}
                        {activity.scheduled_date && (
                          <p className="flex items-center">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span className="ml-1.5">{formatDate(activity.scheduled_date)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-2/5 xl:w-1/3 bg-gray-900 border-l border-gray-700 overflow-y-auto">
            <ProspectDetails
              prospect={selectedProspect}
              mode="split"
              showCloseButton={true}
              onClose={closeProspectDetails}
            />
          </div>
        </div>
      )}
    </div>
  );
}


