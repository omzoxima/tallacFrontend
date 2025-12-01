'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Tooltip from '@/components/Tooltip';
import { showToast } from '@/components/Toast';

// Lazy-load heavy details component to reduce initial JS bundle
const ProspectDetails = dynamic(() => import('@/components/ProspectDetails'), {
  ssr: false,
});

interface Activity {
  id: string;
  name: string;
  activity_type: string;
  title: string;
  subject?: string;
  status_name?: string;
  company?: string;
  scheduled_date: string;
  scheduled_time?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  description?: string;
  queue_status?: string;
  queue_message?: string;
  date_time?: string;
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

function ActivitiesPageContent() {
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [createdByFilter, setCreatedByFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');
  const [sortColumn, setSortColumn] = useState<'queue' | 'company' | 'type' | 'date' | 'user'>('queue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(25);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showProspectDetails, setShowProspectDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('popup');
  const [companies, setCompanies] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    queue: 0,
    scheduled: 0,
    callLog: 0,
    callback: 0,
    appointment: 0,
    note: 0,
    changes: 0,
    assignment: 0,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const company = searchParams?.get('company');
      if (company) {
        setCompanyFilter(company);
        setSearchQuery(company);
      }
      const prospect = searchParams?.get('prospect');
      if (prospect) {
        setActiveFilter('all');
      }
    }

    // Load summary counts once (independent of filters)
    const loadSummary = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/activities/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSummaryCounts({
            total: data.total_count || 0,
            queue: data.queue_count || 0,
            scheduled: data.scheduled_count || 0,
            callLog: data.call_log_count || 0,
            callback: data.callback_count || 0,
            appointment: data.appointment_count || 0,
            note: data.note_count || 0,
            changes: data.changes_count || 0,
            assignment: data.assignment_count || 0,
          });
        }
      } catch (error) {
        console.error('Error loading activities summary:', error);
      }
    };

    loadSummary();
    loadActivities();
    loadProspects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload activities when filters change so that server applies them
  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, companyFilter, createdByFilter, assignedToFilter, searchQuery, pageSize]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      params.set('limit', String(pageSize * 3)); // e.g. 75 when pageSize=25
      params.set('offset', '0');

      // Map frontend filters to backend query params
      if (companyFilter) {
        params.set('company', companyFilter);
      } else if (searchQuery) {
        // If user typed search but no explicit company filter, send as company search
        params.set('company', searchQuery);
      }
      if (createdByFilter) {
        params.set('created_by', createdByFilter);
      }
      if (assignedToFilter) {
        params.set('assigned_to', assignedToFilter);
      }
      // Activity type / status mapping from activeFilter where applicable
      if (activeFilter && !['all', 'queue', 'scheduled'].includes(activeFilter)) {
        // For now, treat non-queue filters as activity_type
        params.set('activity_type', activeFilter);
      }

      const response = await fetch(`${apiUrl}/api/activities?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const activitiesData = Array.isArray(data) ? data : [];
      setActivities(activitiesData);
      
      // Extract unique companies and users
      const uniqueCompanies = new Set<string>();
      const uniqueUsers = new Set<string>();
      activitiesData.forEach((a: Activity) => {
        if (a.company) uniqueCompanies.add(a.company);
        if (a.created_by_name) uniqueUsers.add(a.created_by_name);
        if (a.assigned_to_name) uniqueUsers.add(a.assigned_to_name);
      });
      setCompanies(Array.from(uniqueCompanies).sort());
      setUsers(Array.from(uniqueUsers).sort());
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('Failed to load activities. Please try again.', 'error');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProspects = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/leads?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
      const data = await response.json();
      setProspects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading prospects:', error);
    }
  };

  const handleActivityCardClick = (activity: Activity) => {
    setSelectedActivity(activity);
    
    const prospect = prospects.find(p => p.company_name === activity.company);
    
    if (prospect) {
      setSelectedProspect(prospect);
      setShowProspectDetails(true);
      
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setDetailsViewMode('split');
      } else {
        setDetailsViewMode('popup');
      }
    } else {
      console.warn(`No prospect found for company: ${activity.company}`);
      showToast(`No prospect information available for ${activity.company || 'this activity'}`, 'warning');
    }
  };

  const closeProspectDetails = () => {
    setShowProspectDetails(false);
    setSelectedProspect(null);
    setSelectedActivity(null);
  };

  const handleEditActivity = (activity: Activity) => {
    // Open activity edit modal - this will be handled by ProspectDetails or a separate modal
    console.log('Edit activity:', activity);
    // For now, we'll pass this to ProspectDetails to handle
    setSelectedActivity(activity);
    // You can add a state for showing edit modal here
  };

  const getActivityTypeBadgeClass = (type: string) => {
    const typeMap: Record<string, string> = {
      'changes': 'bg-purple-600 text-white',
      'call-log': 'bg-green-600 text-white',
      'callback': 'bg-cyan-600 text-white',
      'assignment': 'bg-teal-600 text-white',
      'appointment': 'bg-orange-600 text-white',
      'note': 'bg-pink-600 text-white',
      'notes': 'bg-pink-600 text-white',
    };
    return typeMap[type?.toLowerCase()] || 'bg-gray-500 text-white';
  };

  const getActivityTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'changes': 'Changes',
      'call-log': 'Call Log',
      'callback': 'Callback',
      'assignment': 'Assignment',
      'appointment': 'Appointment',
      'note': 'Notes',
      'notes': 'Notes',
    };
    return typeMap[type?.toLowerCase()] || 'Activity';
  };

  const getActivityTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
      'call-log': 'bg-green-600',
      'callback': 'bg-cyan-600',
      'appointment': 'bg-orange-600',
      'note': 'bg-pink-600',
      'notes': 'bg-pink-600',
      'changes': 'bg-purple-600',
      'assignment': 'bg-teal-600',
    };
    return typeMap[type?.toLowerCase()] || 'bg-blue-600';
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

  const stripHtml = (html?: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Stable counts from summary endpoint (do not change when filters change)
  const queueCount = summaryCounts.queue;
  const scheduledCount = summaryCounts.scheduled;
  const callLogCount = summaryCounts.callLog;
  const callbackCount = summaryCounts.callback;
  const appointmentCount = summaryCounts.appointment;
  const noteCount = summaryCounts.note;
  const changesCount = summaryCounts.changes;
  const assignmentCount = summaryCounts.assignment;
  const totalCount = summaryCounts.total;

  const hasActiveFilters = useMemo(() => {
    return !!(companyFilter || createdByFilter || assignedToFilter);
  }, [companyFilter, createdByFilter, assignedToFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (companyFilter) count++;
    if (createdByFilter) count++;
    if (assignedToFilter) count++;
    return count;
  }, [companyFilter, createdByFilter, assignedToFilter]);

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
        (a.created_by_name || '').toLowerCase().includes(query)
      );
    }

    // Apply company filter
    if (companyFilter) {
      filtered = filtered.filter(a => a.company === companyFilter);
    }

    // Apply created by filter
    if (createdByFilter) {
      filtered = filtered.filter(a => a.created_by_name === createdByFilter);
    }

    // Apply assigned to filter
    if (assignedToFilter) {
      filtered = filtered.filter(a => a.assigned_to_name === assignedToFilter);
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
  }, [activities, searchQuery, activeFilter, companyFilter, createdByFilter, assignedToFilter]);

  const sortedActivities = useMemo(() => {
    const filtered = [...filteredActivities];
    
    filtered.sort((a, b) => {
      let compareA: any, compareB: any;
      
      switch (sortColumn) {
        case 'company':
          compareA = (a.company || '').toLowerCase();
          compareB = (b.company || '').toLowerCase();
          break;
        case 'type':
          compareA = (a.activity_type || '').toLowerCase();
          compareB = (b.activity_type || '').toLowerCase();
          break;
        case 'date':
          compareA = new Date(a.scheduled_date || 0);
          compareB = new Date(b.scheduled_date || 0);
          break;
        case 'user':
          compareA = (a.created_by_name || '').toLowerCase();
          compareB = (b.created_by_name || '').toLowerCase();
          break;
        case 'queue':
        default: {
          const queuePriority: Record<string, number> = { overdue: 0, today: 1, scheduled: 2, none: 3 };
          compareA = queuePriority[a.queue_status || 'none'] ?? 3;
          compareB = queuePriority[b.queue_status || 'none'] ?? 3;
          break;
        }
      }
      
      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [filteredActivities, sortColumn, sortDirection]);

  const paginatedActivities = useMemo(() => {
    return sortedActivities.slice(0, pageSize);
  }, [sortedActivities, pageSize]);

  const clearAllFilters = () => {
    setCompanyFilter('');
    setCreatedByFilter('');
    setAssignedToFilter('');
    setShowFilterModal(false);
  };

  const filterByCompany = (company: string) => {
    setCompanyFilter(company);
  };

  const refreshData = () => {
    loadActivities();
    loadProspects();
  };

  const toggleLayoutMode = () => {
    setViewMode(viewMode === 'chat' ? 'list' : 'chat');
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="app-layout bg-gray-900 dark:bg-gray-900 bg-gray-50 text-gray-300 dark:text-gray-300 text-gray-900 flex flex-col min-h-screen transition-colors">
      <AppHeader />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Activity Type Filter - Desktop */}
          <div className="hidden md:flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setActiveFilter('queue')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeFilter === 'queue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-red-700'
              }`}
            >
              Queue
              <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                activeFilter === 'queue' ? 'bg-red-700' : 'bg-red-600'
              }`}>
                {queueCount}
              </span>
            </button>
            
            <button
              onClick={() => setActiveFilter('scheduled')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeFilter === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-blue-700'
              }`}
            >
              Scheduled
              <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                activeFilter === 'scheduled' ? 'bg-blue-700' : 'bg-blue-600'
              }`}>
                {scheduledCount}
              </span>
            </button>

            {/* Proportional Activity Type Bar */}
            <div className="flex flex-1 min-w-[400px] h-10 bg-gray-700/50 dark:bg-gray-700/50 bg-gray-100 rounded-lg overflow-hidden">
              {[
                { type: 'call-log', label: 'Call Log', count: callLogCount, color: 'bg-green-600' },
                { type: 'callback', label: 'Callback', count: callbackCount, color: 'bg-cyan-600' },
                { type: 'appointment', label: 'Appointment', count: appointmentCount, color: 'bg-orange-600' },
                { type: 'note', label: 'Notes', count: noteCount, color: 'bg-pink-600' },
                { type: 'changes', label: 'Changes', count: changesCount, color: 'bg-purple-600' },
                { type: 'assignment', label: 'Assignment', count: assignmentCount, color: 'bg-teal-600' },
              ].map(({ type, label, count, color }) => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all ${
                    activeFilter === type ? color : 'bg-gray-700 dark:bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                  <span>{label}</span>
                  <span className={`${color} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{count}</span>
                  </button>
              ))}
            </div>

            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-blue-700'
              }`}
            >
              All
              <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                activeFilter === 'all' ? 'bg-blue-700' : 'bg-blue-600'
              }`}>
                {totalCount}
              </span>
            </button>
          </div>

          {/* Mobile Filter */}
          <div className="md:hidden mb-4">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full bg-gray-800 dark:bg-gray-800 bg-white border border-gray-700 dark:border-gray-700 border-gray-300 text-white dark:text-white text-gray-900 rounded-lg p-2.5"
            >
              <option value="queue">Queue ({queueCount})</option>
              <option value="scheduled">Scheduled ({scheduledCount})</option>
              <option value="call-log">Call Log ({callLogCount})</option>
              <option value="callback">Callback ({callbackCount})</option>
              <option value="appointment">Appointment ({appointmentCount})</option>
              <option value="note">Notes ({noteCount})</option>
              <option value="changes">Changes ({changesCount})</option>
              <option value="assignment">Assignment ({assignmentCount})</option>
              <option value="all">All ({totalCount})</option>
            </select>
          </div>

          {/* Search, Filter, Sort Bar */}
          <div className="flex flex-col mb-6 gap-3">
            {/* Desktop Layout */}
            <div className="hidden md:flex gap-4">
              <div className="flex flex-1 gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
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
                    className="bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-200 dark:text-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
                  />
                </div>

                {/* Advanced Filter Button */}
                <Tooltip text="Open advanced filters">
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg whitespace-nowrap ${
                      hasActiveFilters
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-600 dark:border-gray-600 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-blue-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </Tooltip>
              </div>

              <div className="flex gap-3 items-center">
                {/* Pagination & Refresh Controls */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Number of items per page">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 h-10 px-3 pr-8 text-sm appearance-none cursor-pointer rounded-lg"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                    </select>
                  </Tooltip>
                  <Tooltip text="Refresh data">
                    <button
                      onClick={refreshData}
                      className="flex items-center justify-center p-2.5 bg-gray-700 dark:bg-gray-700 bg-gray-100 border border-gray-600 dark:border-gray-600 border-gray-300 rounded-lg text-white dark:text-white text-gray-900 hover:bg-gray-600 dark:hover:bg-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0H15"></path>
                      </svg>
                    </button>
                  </Tooltip>
                </div>
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Sort activities by">
                    <select
                      value={sortColumn}
                      onChange={(e) => setSortColumn(e.target.value as any)}
                      className="bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-400 dark:text-gray-400 text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 h-10 px-3 pr-8 text-sm appearance-none cursor-pointer rounded-lg"
                    >
                      <option value="queue">Next Action</option>
                      <option value="company">Company</option>
                      <option value="type">Activity Type</option>
                      <option value="date">Date</option>
                      <option value="user">Created By</option>
                    </select>
                  </Tooltip>
                  <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                    <button
                      onClick={toggleSortDirection}
                      className="flex items-center justify-center p-2.5 bg-gray-700 dark:bg-gray-700 bg-gray-100 border border-gray-600 dark:border-gray-600 border-gray-300 rounded-lg text-white dark:text-white text-gray-900 hover:bg-gray-600 dark:hover:bg-gray-600"
                    >
                      {sortDirection === 'asc' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
                        </svg>
                      )}
                    </button>
                  </Tooltip>
                </div>

                {/* List/Chat Toggle */}
                <div className="flex items-center rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 shadow-sm overflow-hidden">
                  <Tooltip text={viewMode === 'list' ? 'Switch to Chat View' : 'Switch to List View'}>
                    <button
                      onClick={toggleLayoutMode}
                      className="flex items-center justify-center p-2.5 bg-gray-700 dark:bg-gray-700 bg-gray-100 hover:bg-gray-600 dark:hover:bg-gray-600 text-white dark:text-white text-gray-900"
                    >
                      {viewMode === 'list' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex md:hidden items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-200 dark:text-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center justify-center p-2.5 border rounded-lg ${
                  hasActiveFilters
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-600 dark:border-gray-600 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
              </button>
              <select
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value as any)}
                className="bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-400 dark:text-gray-400 text-gray-700 text-sm rounded-lg p-2.5"
              >
                <option value="queue">Next Action</option>
                <option value="company">Company</option>
                <option value="type">Activity Type</option>
                <option value="date">Date</option>
                <option value="user">Created By</option>
              </select>
              <button
                onClick={toggleSortDirection}
                className="flex items-center justify-center p-2.5 border border-gray-600 dark:border-gray-600 border-gray-300 text-white dark:text-white text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-700"
              >
                {sortDirection === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 font-medium">Active Filters:</span>
              {companyFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 dark:bg-gray-700 bg-gray-200 text-blue-300 dark:text-blue-300 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Company: {companyFilter}</span>
                  <button onClick={() => setCompanyFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
              {createdByFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 dark:bg-gray-700 bg-gray-200 text-blue-300 dark:text-blue-300 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Created By: {createdByFilter}</span>
                  <button onClick={() => setCreatedByFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
              {assignedToFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 dark:bg-gray-700 bg-gray-200 text-blue-300 dark:text-blue-300 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Assigned To: {assignedToFilter}</span>
                  <button onClick={() => setAssignedToFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          {/* Activities List and Details Panel Container */}
          <div className={`flex gap-6 ${detailsViewMode === 'split' && showProspectDetails ? 'flex-row' : 'flex-col'}`}>
            {/* Activities Section */}
            <div className={detailsViewMode === 'split' && showProspectDetails ? 'flex-1' : 'w-full'}>
          {/* Activities List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600">Loading activities...</p>
            </div>
          ) : paginatedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-lg">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                </svg>
                <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">No activities found</h3>
                <p className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Try adjusting your filters.</p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {paginatedActivities.map((activity) => (
                <div
                  key={activity.id || activity.name}
                  onClick={() => handleActivityCardClick(activity)}
                  className={`bg-gray-800 dark:bg-gray-800 bg-white rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 cursor-pointer ${
                    selectedActivity?.id === activity.id && showProspectDetails ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-700 dark:border-gray-700 border-gray-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-white dark:text-white text-gray-900 truncate pr-2">
                        {activity.subject || activity.title || 'Activity'}
                      </h4>
                      <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                        {getActivityTypeLabel(activity.activity_type)}
                      </span>
                    </div>
                    {/* Company & Date */}
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400 dark:text-gray-400 text-gray-600">
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
                  <div className="px-4 pb-4 border-b border-gray-700 dark:border-gray-700 border-gray-200 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-300 dark:text-gray-300 text-gray-700">
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
                      <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 line-clamp-2">
                        {stripHtml(activity.description)}
                      </p>
                    )}
                  </div>

                  {/* Queue Status */}
                  {activity.queue_status && activity.queue_status !== 'none' && (
                    <div className="px-4 py-3 bg-gray-800/70 dark:bg-gray-800/70 bg-gray-50/70 flex items-center">
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

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-gray-800/50 dark:bg-gray-800/50 bg-gray-50/50 flex justify-between items-center mt-auto">
                    <div className="flex items-center space-x-2">
                      <Tooltip text="View details">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivityCardClick(activity);
                          }}
                          className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                      </Tooltip>
                      <Tooltip text="Edit activity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditActivity(activity);
                          }}
                          className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Chat View */
            <div className="space-y-4">
              {paginatedActivities.map((activity) => (
                <div
                  key={activity.id || activity.name}
                  onClick={() => handleActivityCardClick(activity)}
                  className={`flex gap-4 transition-all duration-200 cursor-pointer ${
                    selectedActivity?.id === activity.id && showProspectDetails ? 'bg-gray-800/50 dark:bg-gray-800/50 bg-gray-50/50 rounded-lg' : ''
                  }`}
                >
                  {/* Avatar Section */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                      {(activity.created_by_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header with user and time */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white dark:text-white text-gray-900 text-sm">{activity.created_by_name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 text-gray-600">{formatDate(activity.scheduled_date)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActivityTypeBadgeClass(activity.activity_type)}`}>
                        {getActivityTypeLabel(activity.activity_type)}
                      </span>
                    </div>

                    {/* Activity Title/Subject */}
                    <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-3 mb-2">
                      <h4 className="text-white dark:text-white text-gray-900 font-medium mb-1">{activity.subject || activity.title || 'Activity'}</h4>
                      
                      {/* Company Info */}
                      {activity.company && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-400 text-gray-600 mb-2">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                          <span>{activity.company}</span>
                        </div>
                      )}
                      
                      {/* Description */}
                      {activity.description && (
                        <p className="text-sm text-gray-300 dark:text-gray-300 text-gray-700">{stripHtml(activity.description)}</p>
                      )}
                      
                      {/* Assigned to (if different from creator) */}
                      {activity.assigned_to_name && activity.assigned_to_name !== activity.created_by_name && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 dark:text-blue-400 text-blue-600 mt-2">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                          </svg>
                          <span>Assigned to {activity.assigned_to_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Queue Status Badge */}
                    {activity.queue_status && ['overdue', 'today', 'scheduled'].includes(activity.queue_status) && (
                      <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                        activity.queue_status === 'overdue' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                        activity.queue_status === 'today' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                        'bg-blue-900/50 text-blue-300 border border-blue-700'
                      }`}>
                        {activity.queue_status === 'overdue' ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                        ) : activity.queue_status === 'today' ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                          </svg>
                        )}
                        <span className="font-medium">{activity.queue_message || getQueueMessage(activity.queue_status)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>

            {/* Details Panel (Split View) - Sidebar, not full screen */}
            {detailsViewMode === 'split' && showProspectDetails && selectedProspect && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-4 h-fit max-h-[calc(100vh-5rem)] overflow-y-auto">
                <ProspectDetails
                  prospect={selectedProspect}
                  mode="split"
                  showCloseButton={true}
                  onClose={closeProspectDetails}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      <MobileBottomNav />

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white dark:text-white text-gray-900 mb-4">Advanced Filters</h3>
            
            <div className="space-y-4">
              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">Company</label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-200 dark:text-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              
              {/* Created By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">Created By</label>
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-200 dark:text-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
              
              {/* Assigned To Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-700 mb-2">Assigned To</label>
                <select
                  value={assignedToFilter}
                  onChange={(e) => setAssignedToFilter(e.target.value)}
                  className="bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-200 dark:text-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={clearAllFilters}
                className="flex-1 px-4 py-2 bg-gray-700 dark:bg-gray-700 bg-gray-100 text-white dark:text-white text-gray-900 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prospect Details Modal (Popup View) - Start below header */}
      {detailsViewMode === 'popup' && showProspectDetails && selectedProspect && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4 overflow-y-auto"
          onClick={closeProspectDetails}
        >
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-xl my-4" onClick={(e) => e.stopPropagation()}>
            <ProspectDetails
              prospect={selectedProspect}
              mode="popup"
              showCloseButton={true}
              onClose={closeProspectDetails}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>}>
      <ActivitiesPageContent />
    </Suspense>
  );
}
