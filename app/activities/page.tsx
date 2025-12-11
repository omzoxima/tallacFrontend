'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import ProspectDetails from '@/components/ProspectDetails';
import Tooltip from '@/components/Tooltip';
import CustomDropdown from '@/components/CustomDropdown';
import FilterModal from '@/components/FilterModal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  List,
  MessageSquare,
  Building2,
  Calendar,
  User,
  UserCheck,
  MoreVertical,
  Eye,
  Edit,
  Filter,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface Activity {
  id?: string;
  name?: string;
  activity_type?: string;
  subject?: string;
  title?: string;
  company?: string;
  description?: string;
  scheduled_date?: string;
  date_time?: string;
  created_by?: string;
  assigned_to?: string;
  queue_status?: string;
  queue_message?: string;
  status?: string;
  call_outcome?: string;
  prospect?: string;
  prospect_id?: string;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>(
    searchParams.get('prospect') ? 'all' : 'queue'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState(searchParams.get('company') || '');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('chat');
  const [sortColumn, setSortColumn] = useState('queue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(25);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [showProspectDetails, setShowProspectDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('popup');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchParams.get('prospect')) {
        filters.prospect_id = searchParams.get('prospect');
      }
      if (searchParams.get('company')) {
        filters.company = searchParams.get('company');
      }
      if (searchParams.get('contact')) {
        filters.contact = searchParams.get('contact');
      }

      const result = await api.getActivities(filters);
      if (result.success && result.data) {
        setActivities(result.data);
        // Extract unique companies and users
        const uniqueCompanies = Array.from(
          new Set(result.data.map((a: Activity) => a.company).filter(Boolean))
        ) as string[];
        const uniqueUsers = Array.from(
          new Set(
            result.data
              .map((a: Activity) => [a.created_by, a.assigned_to])
              .flat()
              .filter(Boolean)
          )
        ) as string[];
        setCompanies(uniqueCompanies);
        setUsers(uniqueUsers);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Computed counts
  const queueCount = useMemo(() => {
    return activities.filter((a) => {
      const status = (a.queue_status || '').toLowerCase();
      return status === 'overdue' || status === 'today';
    }).length;
  }, [activities]);

  const scheduledCount = useMemo(() => {
    return activities.filter((a) => (a.queue_status || '').toLowerCase() === 'scheduled').length;
  }, [activities]);

  const totalCount = useMemo(() => activities.length, [activities]);

  const callLogCount = useMemo(() => {
    return activities.filter((a) => ['call-log', 'Call Log'].includes(a.activity_type || '')).length;
  }, [activities]);

  const callbackCount = useMemo(() => {
    return activities.filter((a) => ['callback', 'Callback'].includes(a.activity_type || '')).length;
  }, [activities]);

  const appointmentCount = useMemo(() => {
    return activities.filter((a) => ['appointment', 'Appointment'].includes(a.activity_type || '')).length;
  }, [activities]);

  const noteCount = useMemo(() => {
    return activities.filter((a) => ['note', 'notes', 'Note', 'Notes'].includes(a.activity_type || '')).length;
  }, [activities]);

  const changesCount = useMemo(() => {
    return activities.filter((a) => ['changes', 'Changes'].includes(a.activity_type || '')).length;
  }, [activities]);

  const assignmentCount = useMemo(() => {
    return activities.filter((a) => ['assignment', 'Assignment'].includes(a.activity_type || '')).length;
  }, [activities]);

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

  // Filter options for mobile dropdown
  const filterOptions = useMemo(
    () => [
      { value: 'queue', label: `Queue (${queueCount})`, color: '#dc2626' },
      { value: 'scheduled', label: `Scheduled (${scheduledCount})`, color: '#2563eb' },
      { value: 'call-log', label: `Call Log (${callLogCount})`, color: '#16a34a' },
      { value: 'callback', label: `Callback (${callbackCount})`, color: '#0891b2' },
      { value: 'appointment', label: `Appointment (${appointmentCount})`, color: '#ea580c' },
      { value: 'note', label: `Notes (${noteCount})`, color: '#db2777' },
      { value: 'changes', label: `Changes (${changesCount})`, color: '#9333ea' },
      { value: 'assignment', label: `Assignment (${assignmentCount})`, color: '#0d9488' },
      { value: 'all', label: `All (${totalCount})`, color: '#2563eb' },
    ],
    [queueCount, scheduledCount, callLogCount, callbackCount, appointmentCount, noteCount, changesCount, assignmentCount, totalCount]
  );

  const getFilterButtonClass = (filter: string) => {
    const colorMap: Record<string, string> = {
      queue: 'bg-red-600 border-red-600 text-white',
      scheduled: 'bg-blue-600 border-blue-600 text-white',
      'call-log': 'bg-green-600 border-green-600 text-white',
      callback: 'bg-cyan-600 border-cyan-600 text-white',
      appointment: 'bg-orange-600 border-orange-600 text-white',
      note: 'bg-pink-600 border-pink-600 text-white',
      changes: 'bg-purple-600 border-purple-600 text-white',
      assignment: 'bg-teal-600 border-teal-600 text-white',
      all: 'bg-blue-600 border-blue-600 text-white',
    };
    return colorMap[filter] || 'bg-blue-600 border-blue-600 text-white';
  };

  // Page size options
  const pageSizeOptions = [
    { value: '25', label: '25', color: '#4b5563' },
    { value: '50', label: '50', color: '#4b5563' },
    { value: '100', label: '100', color: '#4b5563' },
    { value: '200', label: '200', color: '#4b5563' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'queue', label: 'Next Action', color: '#6b7280' },
    { value: 'company', label: 'Company', color: '#6b7280' },
    { value: 'type', label: 'Activity Type', color: '#6b7280' },
    { value: 'date', label: 'Date', color: '#6b7280' },
    { value: 'user', label: 'Created By', color: '#6b7280' },
  ];

  // Filtered activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.subject || '').toLowerCase().includes(query) ||
          (a.title || '').toLowerCase().includes(query) ||
          (a.company || '').toLowerCase().includes(query) ||
          (a.description || '').toLowerCase().includes(query) ||
          (a.created_by || '').toLowerCase().includes(query)
      );
    }

    // Apply company filter
    if (companyFilter) {
      filtered = filtered.filter((a) => a.company === companyFilter);
    }

    // Apply created by filter
    if (createdByFilter) {
      filtered = filtered.filter((a) => a.created_by === createdByFilter);
    }

    // Apply assigned to filter
    if (assignedToFilter) {
      filtered = filtered.filter((a) => a.assigned_to === assignedToFilter);
    }

    // Apply activity type/queue filter
    if (activeFilter === 'all') {
      // Show all
    } else if (activeFilter === 'queue') {
      filtered = filtered.filter((a) => a.queue_status === 'overdue' || a.queue_status === 'today');
    } else if (activeFilter === 'scheduled') {
      filtered = filtered.filter((a) => a.queue_status === 'scheduled');
    } else {
      // Activity type filter
      const typeMap: Record<string, string[]> = {
        'call-log': ['call-log', 'Call Log'],
        callback: ['callback', 'Callback'],
        appointment: ['appointment', 'Appointment'],
        note: ['note', 'notes', 'Note', 'Notes'],
        changes: ['changes', 'Changes'],
        assignment: ['assignment', 'Assignment'],
      };

      filtered = filtered.filter((a) => {
        if (a.activity_type === activeFilter) return true;
        const variants = typeMap[activeFilter];
        return variants ? variants.includes(a.activity_type || '') : false;
      });
    }

    return filtered;
  }, [activities, searchQuery, companyFilter, createdByFilter, assignedToFilter, activeFilter]);

  // Sorted activities
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
          compareA = new Date(a.scheduled_date || a.date_time || 0);
          compareB = new Date(b.scheduled_date || b.date_time || 0);
          break;
        case 'user':
          compareA = (a.created_by || '').toLowerCase();
          compareB = (b.created_by || '').toLowerCase();
          break;
        case 'queue':
        default:
          const queuePriority: Record<string, number> = { overdue: 0, today: 1, scheduled: 2, none: 3 };
          compareA = queuePriority[a.queue_status || 'none'] ?? 3;
          compareB = queuePriority[b.queue_status || 'none'] ?? 3;
          break;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredActivities, sortColumn, sortDirection]);

  // Paginated activities
  const paginatedActivities = useMemo(() => {
    return sortedActivities.slice(0, pageSize);
  }, [sortedActivities, pageSize]);

  // Helper functions
  const stripHtml = (html?: string) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getCardBorderClass = (type?: string) => {
    const typeMap: Record<string, string> = {
      Changes: 'border-transparent hover:border-purple-500',
      'Call Log': 'border-transparent hover:border-green-500',
      Callback: 'border-transparent hover:border-cyan-500',
      Assignment: 'border-transparent hover:border-teal-500',
      Appointment: 'border-transparent hover:border-orange-500',
      Notes: 'border-transparent hover:border-pink-500',
      changes: 'border-transparent hover:border-purple-500',
      'call-log': 'border-transparent hover:border-green-500',
      callback: 'border-transparent hover:border-cyan-500',
      assignment: 'border-transparent hover:border-teal-500',
      appointment: 'border-transparent hover:border-orange-500',
      note: 'border-transparent hover:border-pink-500',
    };
    return typeMap[type || ''] || 'border-transparent hover:border-gray-500';
  };

  const getActivityTypeBadgeClass = (type?: string) => {
    const typeMap: Record<string, string> = {
      Changes: 'bg-purple-600 text-white',
      'Call Log': 'bg-green-600 text-white',
      Callback: 'bg-cyan-600 text-white',
      Assignment: 'bg-teal-600 text-white',
      Appointment: 'bg-orange-600 text-white',
      Notes: 'bg-pink-600 text-white',
      changes: 'bg-purple-600 text-white',
      'call-log': 'bg-green-600 text-white',
      callback: 'bg-cyan-600 text-white',
      assignment: 'bg-teal-600 text-white',
      appointment: 'bg-orange-600 text-white',
      note: 'bg-pink-600 text-white',
    };
    return typeMap[type || ''] || 'bg-gray-500 text-white';
  };

  const getActivityTypeLabel = (type?: string) => {
    const typeMap: Record<string, string> = {
      'Call Log': 'Call Log',
      Callback: 'Callback',
      Appointment: 'Appointment',
      Notes: 'Notes',
      Changes: 'Changes',
      Assignment: 'Assignment',
      'call-log': 'Call Log',
      callback: 'Callback',
      appointment: 'Appointment',
      note: 'Notes',
      notes: 'Notes',
      changes: 'Changes',
      assignment: 'Assignment',
    };
    return typeMap[type || ''] || type || 'Activity';
  };

  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      Open: 'bg-blue-600/20 text-blue-400 border border-blue-600/30',
      'In Progress': 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
      Completed: 'bg-green-600/20 text-green-400 border border-green-600/30',
      Cancelled: 'bg-red-600/20 text-red-400 border border-red-600/30',
      Overdue: 'bg-orange-600/20 text-orange-400 border border-orange-600/30',
    };
    return statusMap[status || ''] || 'bg-gray-600/20 text-gray-400 border border-gray-600/30';
  };

  const getQueueStatusColor = (status?: string) => {
    const statusMap: Record<string, string> = {
      overdue: 'text-red-400',
      today: 'text-yellow-400',
      scheduled: 'text-blue-400',
    };
    return statusMap[status || ''] || 'text-gray-400';
  };

  const getQueueStatusChatClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      overdue: 'bg-red-900/50 text-red-300 border border-red-700',
      today: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
      scheduled: 'bg-blue-900/50 text-blue-300 border border-blue-700',
    };
    return statusMap[status || ''] || 'bg-gray-800 text-gray-400 border border-gray-700';
  };

  const getQueueMessage = (status?: string) => {
    const statusMap: Record<string, string> = {
      overdue: 'Overdue: Needs attention',
      today: 'Today: Scheduled for today',
      scheduled: 'Scheduled: Future date',
    };
    return statusMap[status || ''] || 'No schedule set';
  };

  const formatDate = (dateStr?: string) => {
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

  // Handlers
  const refreshData = () => {
    fetchActivities();
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'chat' ? 'list' : 'chat'));
  };

  const getViewModeTitle = () => {
    return viewMode === 'chat' ? 'Switch to List View' : 'Switch to Chat View';
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const clearAllFilters = () => {
    setCompanyFilter('');
    setCreatedByFilter('');
    setAssignedToFilter('');
    setShowFilterModal(false);
  };

  const filterByCompany = (company: string) => {
    setCompanyFilter(company);
  };

  const handleActivityCardClick = async (activity: Activity) => {
    // OPTIMIZED: Show modal immediately (optimistic UI)
    setSelectedActivity(activity);

    const prospectId = activity.prospect || activity.prospect_id;
    if (!prospectId) {
      console.warn('Activity has no linked prospect:', activity);
      alert('This activity is not linked to any prospect');
      return;
    }

    // Show modal immediately with basic data from activity
    setShowProspectDetails(true);
    if (window.innerWidth >= 1024) {
      setDetailsViewMode('split');
    } else {
      setDetailsViewMode('popup');
    }

    // Fetch full details in background (non-blocking)
    try {
      const result = await api.getProspectDetails(prospectId);
      if (result.success && result.data) {
        const apiData = result.data;
        const prospect = apiData.prospect || {};
        const org = apiData.organization || {};
        const primaryContact = apiData.primary_contact || {};

        setSelectedProspect({
          name: prospect.id || prospect.name,
          status: prospect.status,
          company_name: org.organization_name,
          industry: org.industry,
          city: org.city,
          state: org.state,
          territory: org.territory,
          lead_name: primaryContact.full_name || primaryContact.name,
          title: primaryContact.designation,
          primary_phone: primaryContact.mobile_no || primaryContact.phone,
          primary_email: primaryContact.email_id || primaryContact.email,
          organization: org,
          primary_contact_details: primaryContact,
          contacts: apiData.contacts || [],
        });
        } else {
        console.error(`Could not load prospect details for ${prospectId}`);
      }
    } catch (error: any) {
      console.error('Error fetching prospect:', error);
    }
  };

  const closeProspectDetails = () => {
    setShowProspectDetails(false);
    setSelectedProspect(null);
    setSelectedActivity(null);
  };

  const handleView = (activity: Activity) => {
    handleActivityCardClick(activity);
  };

  const handleEdit = (activity: Activity) => {
    console.log('Edit activity:', activity);
    // TODO: Open edit modal
  };

  const handleMore = (activity: Activity) => {
    console.log('More options:', activity);
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const closeDropdown = () => {
    setOpenDropdownId(null);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openDropdownId && !target.closest('.activity-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('list');
        setDetailsViewMode('popup');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageSizeString = useMemo(
    () => ({
      get: () => String(pageSize),
      set: (val: string) => setPageSize(Number(val)),
    }),
    [pageSize]
  );

  return (
    <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* 1. Activity Type Filter */}
          {/* Desktop View: Separate buttons & activity type bar */}
          <div className="hidden md:flex flex-wrap items-center gap-3 mb-6">
            {/* Queue Filter Button */}
            <button
              onClick={() => setActiveFilter('queue')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none transition-colors ${
                activeFilter === 'queue' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Queue
              <span
                className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFilter === 'queue' ? 'bg-red-700' : 'bg-red-600'
                }`}
              >
                {queueCount}
              </span>
            </button>

            {/* Scheduled Filter Button */}
            <button
              onClick={() => setActiveFilter('scheduled')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors ${
                activeFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Scheduled
              <span
                className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFilter === 'scheduled' ? 'bg-blue-700' : 'bg-blue-600'
                }`}
              >
                {scheduledCount}
              </span>
            </button>

            {/* Proportional Activity Type Bar */}
            <div className="flex flex-1 min-w-[400px] h-10 bg-gray-700/50 rounded-lg overflow-hidden">
              {/* Call Log Segment */}
              <button
                onClick={() => setActiveFilter('call-log')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                  activeFilter === 'call-log' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span>Call Log</span>
                <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {callLogCount}
                </span>
              </button>
              {/* Callback Segment */}
              <button
                onClick={() => setActiveFilter('callback')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                  activeFilter === 'callback' ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span>Callback</span>
                <span className="bg-cyan-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {callbackCount}
                </span>
              </button>
              {/* Appointment Segment */}
              <button
                onClick={() => setActiveFilter('appointment')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                  activeFilter === 'appointment' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span>Appointment</span>
                <span className="bg-orange-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {appointmentCount}
                </span>
              </button>
              {/* Notes Segment */}
              <button
                onClick={() => setActiveFilter('note')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                  activeFilter === 'note' ? 'bg-pink-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span>Notes</span>
                <span className="bg-pink-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {noteCount}
                </span>
              </button>
              {/* Changes Segment */}
              <button
                onClick={() => setActiveFilter('changes')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                  activeFilter === 'changes' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span>Changes</span>
                <span className="bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {changesCount}
                </span>
              </button>
              {/* Assignment Segment */}
              <button
                onClick={() => setActiveFilter('assignment')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                  activeFilter === 'assignment' ? 'bg-teal-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span>Assignment</span>
                <span className="bg-teal-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {assignmentCount}
                </span>
              </button>
            </div>

            {/* All Filter Button */}
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors ${
                activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              All
              <span
                className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFilter === 'all' ? 'bg-blue-700' : 'bg-blue-600'
                }`}
              >
                {totalCount}
              </span>
            </button>
          </div>

          {/* 2. Search, Filter, Sort Bar */}
          <div className="flex flex-col mb-6 gap-3">
            {/* Desktop Layout */}
            <div className="hidden md:flex gap-4">
              <div className="flex flex-1 gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="search"
                    placeholder="Search activities, companies, users..."
                    className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-10 py-2.5 pl-10 pr-3 placeholder-gray-400"
                  />
                </div>

                {/* Advanced Filter Button */}
                  <Tooltip text="Open advanced filters">
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg whitespace-nowrap h-10 ${
                      hasActiveFilters
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && activeFiltersCount > 0 && (
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
                    <div className="w-20">
                      <CustomDropdown
                        value={String(pageSize)}
                        options={pageSizeOptions}
                        onChange={(val) => setPageSize(Number(val))}
                        buttonClass="bg-gray-800 border-gray-600 text-gray-300"
                        showColorDot={false}
                        showCheckmark={false}
                      />
                    </div>
                  </Tooltip>
                  <Tooltip text="Refresh data">
                    <button
                      onClick={refreshData}
                      className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Sort activities by">
                    <div className="w-36">
                      <CustomDropdown
                        value={sortColumn}
                        options={sortOptions}
                        onChange={setSortColumn}
                        buttonClass="bg-gray-800 border-gray-600 text-gray-400"
                        showColorDot={false}
                        showCheckmark={false}
                      />
                    </div>
                  </Tooltip>
                  <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                    <button
                      onClick={toggleSortDirection}
                      className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
                    >
                      {sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>

                {/* List/Chat Toggle */}
                <div className="flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
                  <Tooltip text={getViewModeTitle()}>
                    <button
                      onClick={toggleLayoutMode}
                      className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      {viewMode === 'list' ? <List className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Mobile Layout: Line 1 - Unified filter + Advanced filter + Sort */}
            <div className="flex md:hidden items-center gap-2">
              <CustomDropdown
                value={activeFilter}
                options={filterOptions}
                onChange={setActiveFilter}
                buttonClass={getFilterButtonClass(activeFilter)}
                className="flex-1"
              />
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center justify-center p-2.5 border rounded-lg ${
                  hasActiveFilters
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <div className="w-36">
                <CustomDropdown
                  value={sortColumn}
                  options={sortOptions}
                  onChange={setSortColumn}
                  buttonClass="bg-gray-800 border-gray-600 text-gray-400"
                  showColorDot={false}
                  showCheckmark={false}
                />
              </div>
              <button
                onClick={toggleSortDirection}
                className="flex items-center justify-center p-2.5 border border-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                {sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Mobile Layout: Line 2 - Search + Page Size */}
            <div className="flex md:hidden items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="search"
                  placeholder="Search..."
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
                />
              </div>
              <div className="w-16">
                <CustomDropdown
                  value={String(pageSize)}
                  options={pageSizeOptions}
                  onChange={(val) => setPageSize(Number(val))}
                  buttonClass="bg-gray-800 border-gray-600 text-gray-300"
                  showColorDot={false}
                  showCheckmark={false}
                />
              </div>
              <button
                onClick={refreshData}
                className="flex items-center justify-center p-2.5 border border-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 font-medium">Active Filters:</span>
              {companyFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Company: {companyFilter}</span>
                  <button onClick={() => setCompanyFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {createdByFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Created By: {createdByFilter}</span>
                  <button onClick={() => setCreatedByFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {assignedToFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Assigned To: {assignedToFilter}</span>
                  <button onClick={() => setAssignedToFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          {/* 3. Activities Grid/List and Detail Panel */}
          <div
            className={`flex gap-6 ${
              detailsViewMode === 'split' && showProspectDetails ? 'flex-row' : 'flex-col'
            }`}
          >
            {/* Activities Section */}
            <div className={detailsViewMode === 'split' && showProspectDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading activities...</p>
                </div>
              ) : sortedActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-lg">
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 text-gray-600 mb-4 flex items-center justify-center">
                      <AlertTriangle className="w-16 h-16" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No activities found</h3>
                    <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                  </div>
                </div>
              ) : viewMode === 'list' ? (
                <div className="grid gap-6 grid-cols-1">
                  {paginatedActivities.map((activity) => (
                    <div
                      key={activity.id || activity.name}
                      onClick={() => handleActivityCardClick(activity)}
                      className={`bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 relative cursor-pointer ${getCardBorderClass(
                        activity.activity_type
                      )} ${
                        selectedActivity?.id === activity.id && showProspectDetails
                          ? 'ring-2 ring-indigo-500'
                          : ''
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-bold text-white truncate pr-2">
                            {activity.subject || activity.title || 'Activity'}
                          </h4>
                          <span
                            className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getActivityTypeBadgeClass(
                              activity.activity_type
                            )}`}
                          >
                            {getActivityTypeLabel(activity.activity_type)}
                          </span>
                        </div>
                        {/* Company & Date Row */}
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                          {activity.company && (
                            <p className="flex items-center">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="ml-1.5">{activity.company}</span>
                            </p>
                          )}
                          <p className="flex items-center">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="ml-1.5">
                              {formatDate(activity.date_time || activity.scheduled_date)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Card Meta Info */}
                      <div className="px-4 pb-4 border-b border-gray-700 space-y-3">
                        {/* User Info */}
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1.5" />
                            Created by: <span className="font-medium ml-1">{activity.created_by || 'Unknown'}</span>
                          </span>
                          {activity.assigned_to && (
                            <span className="flex items-center">
                              <UserCheck className="w-4 h-4 mr-1.5" />
                              Assigned to: <span className="font-medium ml-1">{activity.assigned_to}</span>
                            </span>
                          )}
                        </div>

                        {/* Description Preview */}
                        {activity.description && (
                          <p className="text-xs text-gray-400 line-clamp-2">{stripHtml(activity.description)}</p>
                        )}
                      </div>

                      {/* Queue Status Message */}
                      <div className="px-4 py-3 bg-gray-800/70 flex items-center">
                        <p className={`text-xs flex items-center w-full ${getQueueStatusColor(activity.queue_status)}`}>
                          {activity.queue_status === 'overdue' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : activity.queue_status === 'today' ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span className="ml-1.5 font-medium">
                            {activity.queue_message || getQueueMessage(activity.queue_status)}
                          </span>
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 bg-gray-800/50 flex justify-between items-center mt-auto">
                        <div className="flex items-center space-x-2">
                          <Tooltip text="View details">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(activity);
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
                                  filterByCompany(activity.company || '');
                                }}
                                className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
                              >
                                <Building2 className="w-5 h-5" />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip text="Edit activity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(activity);
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
                                handleMore(activity);
                              }}
                              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
                            >
                              <MoreVertical className="w-5 h-5" />
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
                        selectedActivity?.id === activity.id && showProspectDetails
                          ? 'bg-gray-800/50 rounded-lg'
                          : ''
                      }`}
                    >
                      {/* Avatar Section */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getActivityTypeBadgeClass(
                            activity.activity_type
                          )}`}
                        >
                          {(activity.created_by || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-white text-sm">
                            {activity.created_by || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.date_time || activity.scheduled_date)}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActivityTypeBadgeClass(
                              activity.activity_type
                            )}`}
                          >
                            {getActivityTypeLabel(activity.activity_type)}
                          </span>

                          {/* Status Badge */}
                          {activity.status &&
                            ['Call Log', 'Callback', 'Appointment'].includes(activity.activity_type || '') && (
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(
                                  activity.status
                                )}`}
                              >
                                {activity.activity_type === 'Call Log' && activity.call_outcome
                                  ? activity.call_outcome
                                  : activity.status}
                              </span>
                            )}

                          {/* Three Dot Menu */}
                          <div className="relative ml-auto activity-dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(activity.id || activity.name || '');
                              }}
                              className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {/* Dropdown Menu */}
                            {openDropdownId === (activity.id || activity.name) && (
                              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(activity);
                                    closeDropdown();
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(activity);
                                    closeDropdown();
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                >
                                  Edit Activity
                                </button>
                                {activity.company && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      filterByCompany(activity.company || '');
                                      closeDropdown();
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                  >
                                    Filter by Company
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Activity Title/Subject */}
                        <div className="bg-gray-800 rounded-lg p-3 mb-2">
                          <h4 className="text-white font-medium mb-1">
                            {activity.subject || activity.title || 'Activity'}
                          </h4>

                          {/* Company Info */}
                          {activity.company && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{activity.company}</span>
                            </div>
                          )}

                          {/* Description */}
                          {activity.description && (
                            <p className="text-sm text-gray-300">{stripHtml(activity.description)}</p>
                          )}

                          {/* Assigned to (if different from creator) */}
                          {activity.assigned_to && activity.assigned_to !== activity.created_by && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-2">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assigned to {activity.assigned_to}</span>
                            </div>
                          )}
                        </div>

                        {/* Queue Status Badge */}
                        {['overdue', 'today', 'scheduled'].includes(activity.queue_status || '') && (
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${getQueueStatusChatClass(
                              activity.queue_status
                            )}`}
                          >
                            {activity.queue_status === 'overdue' ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : activity.queue_status === 'today' ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            <span className="font-medium">
                              {activity.queue_message || getQueueMessage(activity.queue_status)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Panel (Split View) */}
            {detailsViewMode === 'split' && showProspectDetails && selectedProspect && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
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
      <FilterModal
        show={showFilterModal}
        title="Advanced Filters"
        onClose={() => setShowFilterModal(false)}
        onClear={clearAllFilters}
        onApply={() => setShowFilterModal(false)}
      >
        {/* Company Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Company</label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>

        {/* Created By Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Created By</label>
          <select
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Assigned To</label>
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      </FilterModal>

      {/* Prospect Details Modal (Popup View) */}
      {detailsViewMode === 'popup' && showProspectDetails && selectedProspect && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
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
    </div>
  );
}

