'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Tooltip from '@/components/Tooltip';
import { Phone, Plus, FileText, X } from 'lucide-react';
import { showToast } from '@/components/Toast';

// Lazy-loaded heavy components for better initial load performance
const ProspectDetails = dynamic(() => import('@/components/ProspectDetails'), {
  ssr: false,
});

const TallacActivityModal = dynamic(() => import('@/components/TallacActivityModal'), {
  ssr: false,
});

const AddProspectModal = dynamic(() => import('@/components/AddProspectModal'), {
  ssr: false,
});


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

function ProspectsPageContent() {
  const searchParams = useSearchParams();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [currentProspectForModal, setCurrentProspectForModal] = useState<Prospect | null>(null);
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [repsLoading, setRepsLoading] = useState(false);
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortColumn, setSortColumn] = useState<'queue' | 'name' | 'status'>('queue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(25);
  const [statusCounts, setStatusCounts] = useState({
    new: 0,
    contacted: 0,
    interested: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  });
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'split' : 'popup'
  );
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showProspectDetails, setShowProspectDetails] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Load status counts function
  const loadStatusCounts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/leads/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStatusCounts((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Silently fail summary loading
    }
  };

  // Load status counts once on mount (independent of filters)
  useEffect(() => {
    loadStatusCounts();
  }, []);

  // Load prospects from server whenever filters/search change.
  useEffect(() => {
    loadProspects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, territoryFilter, industryFilter, ownerFilter, searchQuery, pageSize]);

  useEffect(() => {
    loadLocations();
  }, []);

  // Close mobile search on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMobileSearch) {
        setShowMobileSearch(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showMobileSearch]);

  useEffect(() => {
    const openProspect = searchParams?.get('openProspect');
    if (openProspect && prospects.length > 0) {
      const prospect = prospects.find((p) => p.name === openProspect || p.id === openProspect);
      if (prospect) {
        setDetailsViewMode('popup');
        openProspectDetails(prospect);
      }
    }
  }, [searchParams, prospects]);

  useEffect(() => {
    const territoryParam = searchParams?.get('territory');
    if (territoryParam) {
      setTerritoryFilter(territoryParam);
      setShowFilterModal(false);
    }
  }, [searchParams]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      // Fetch a limited window from the server; client-side pagination can still slice further
      params.set('limit', String(pageSize * 3)); // e.g. 75 when pageSize=25
      params.set('start', '0');

      // Filter by assigned user if not Corporate Admin
      // Get user info from auth/me endpoint or context
      try {
        const userResponse = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const currentUser = userData.user || userData;
          
          // Only show assigned prospects for non-admin users
          if (currentUser.role !== 'Corporate Admin' && currentUser.id) {
            params.set('assigned_to', currentUser.id);
          }
        }
      } catch {
        // If auth check fails, continue without filtering
      }

      // Map filters to backend query params where possible
      if (territoryFilter) {
        params.set('territory', territoryFilter);
      }
      if (industryFilter) {
        params.set('industry', industryFilter);
      }
      if (ownerFilter && ownerFilter !== 'all') {
        params.set('owner', ownerFilter);
      }
      if (searchQuery) {
        params.set('search_text', searchQuery);
      }
      // For pipeline filters, let backend filter by status when it's a specific pipeline status.
      // Queue/scheduled remain handled client-side based on callback_date/queue_status.
      if (activeFilter && !['all', 'queue', 'scheduled'].includes(activeFilter)) {
        params.set('status_filter', activeFilter);
      }

      const response = await fetch(`${apiUrl}/api/leads?${params.toString()}`, {
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
      setProspects(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load prospects. Please try again.', 'error');
      setProspects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiUrl}/api/territories`, { headers });
      if (response.ok) {
        const data = await response.json();
        setLocations(Array.isArray(data) ? data : []);
      } else {
        setLocations([]);
      }
    } catch {
      setLocations([]);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      proposal: 'bg-orange-600/20 dark:text-orange-300 text-orange-700',
      contacted: 'bg-blue-600/20 dark:text-blue-300 text-blue-700',
      interested: 'bg-yellow-600/20 dark:text-yellow-300 text-yellow-700',
      lost: 'bg-red-600/20 dark:text-red-300 text-red-700',
      won: 'bg-green-600/20 dark:text-green-300 text-green-700',
      new: 'bg-blue-600/20 dark:text-blue-300 text-blue-700',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-600/20 dark:text-gray-300 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      proposal: 'Proposal',
      contacted: 'Contacted',
      interested: 'Interested',
      lost: 'Lost',
      won: 'Won',
      new: 'New',
    };
    return statusMap[status?.toLowerCase()] || status || 'New';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(/[\s@.]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getCardBorderClass = (status: string) => {
    const statusMap: Record<string, string> = {
      proposal: 'border-transparent hover:!border-orange-600',
      contacted: 'border-transparent hover:!border-purple-600',
      interested: 'border-transparent hover:!border-yellow-600',
      lost: '!border-red-600 opacity-70',
      won: 'border-transparent hover:!border-green-600',
      new: 'border-transparent hover:!border-blue-600',
    };
    return statusMap[status?.toLowerCase()] || 'border-transparent hover:!border-blue-600';
  };

  const getQueueStatusClass = (queueStatus?: string) => {
    const statusMap: Record<string, string> = {
      overdue: 'text-red-600 dark:text-red-400',
      today: 'text-orange-600 dark:text-orange-400',
      scheduled: 'text-indigo-600 dark:text-indigo-300',
    };
    return statusMap[queueStatus || ''] || 'dark:text-gray-400 text-gray-600';
  };

  const getContactPathClass = (status: string) => {
    const statusMap: Record<string, string> = {
      proposal: 'bg-orange-600 text-white',
      contacted: 'bg-blue-600 text-white',
      interested: 'bg-yellow-600 text-white',
      lost: 'bg-red-600 text-white',
      won: 'bg-green-600 text-white',
      new: 'bg-gray-500 text-white',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-500 text-white';
  };

  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.company_name || '').toLowerCase().includes(query) ||
          (p.lead_name || '').toLowerCase().includes(query) ||
          (p.email_id || '').toLowerCase().includes(query)
      );
    }

    if (territoryFilter) {
      filtered = filtered.filter((p) => p.territory === territoryFilter);
    }

    if (industryFilter) {
      filtered = filtered.filter((p) => p.industry === industryFilter);
    }

    if (ownerFilter) {
      if (ownerFilter === 'Unassigned') {
        filtered = filtered.filter((p) => !p.lead_owner || p.lead_owner === 'Administrator');
      } else {
        filtered = filtered.filter((p) => p.lead_owner === ownerFilter);
      }
    }

    // Apply pipeline/queue filter
    if (activeFilter === 'all') {
      // Show all - no additional filtering
    } else if (activeFilter === 'queue') {
      filtered = filtered.filter((p) => p.queue_status === 'overdue' || p.queue_status === 'today');
    } else if (activeFilter === 'scheduled') {
      filtered = filtered.filter((p) => p.queue_status === 'scheduled');
    } else {
      // Pipeline status filter - match status exactly (case-insensitive)
      filtered = filtered.filter((p) => {
        let prospectStatus = (p.status || 'new').toLowerCase().trim();
        // Map database statuses to frontend statuses
        if (prospectStatus === 'closed won') {
          prospectStatus = 'won';
        } else if (prospectStatus === 'closed lost') {
          prospectStatus = 'lost';
        }
        const filterStatus = activeFilter.toLowerCase().trim();
        return prospectStatus === filterStatus;
      });
    }

    return filtered;
  }, [prospects, searchQuery, territoryFilter, industryFilter, ownerFilter, activeFilter]);

  const sortedProspects = useMemo(() => {
    const filtered = [...filteredProspects];

    filtered.sort((a, b) => {
      let compareA: any, compareB: any;
      const queuePriority: Record<string, number> = { overdue: 0, today: 1, scheduled: 2, none: 3 };

      switch (sortColumn) {
        case 'name':
          compareA = (a.company_name || '').toLowerCase();
          compareB = (b.company_name || '').toLowerCase();
          break;
        case 'status':
          compareA = (a.status || 'new').toLowerCase();
          compareB = (b.status || 'new').toLowerCase();
          break;
        case 'queue':
        default:
          compareA = queuePriority[a.queue_status || 'none'] ?? 3;
          compareB = queuePriority[b.queue_status || 'none'] ?? 3;
          break;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredProspects, sortColumn, sortDirection]);

  const paginatedProspects = useMemo(() => {
    return sortedProspects.slice(0, pageSize);
  }, [sortedProspects, pageSize]);

  const filteredSalesReps = useMemo(() => {
    if (!repSearchQuery) return salesReps;
    const query = repSearchQuery.toLowerCase();
    return salesReps.filter(
      (rep) =>
        (rep.full_name || '').toLowerCase().includes(query) ||
        (rep.email || '').toLowerCase().includes(query) ||
        (rep.first_name || '').toLowerCase().includes(query) ||
        (rep.last_name || '').toLowerCase().includes(query)
    );
  }, [salesReps, repSearchQuery]);

  // Load users when search query changes (debounced search)
  useEffect(() => {
    if (!showAssignModal) return;

    const searchUsers = async () => {
      // For short queries, just filter locally from already loaded users
      if (repSearchQuery.trim().length < 2) {
        return;
      }

      try {
        setRepsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        
        if (!token) {
          return;
        }

        const searchParam = repSearchQuery.trim() ? `&search=${encodeURIComponent(repSearchQuery.trim())}` : '';
        const url = `${apiUrl}/api/users?limit=1000${searchParam}`;
        console.log('Searching users from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const users = await response.json();
          // Filter only active users
          const activeUsers = Array.isArray(users) 
            ? users.filter((u: any) => u.is_active !== false)
            : [];
          setSalesReps(activeUsers);
        } else {
          console.error('Search users failed:', response.status);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setRepsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [repSearchQuery, showAssignModal]);

  const getProspectGridClass = () => {
    if (detailsViewMode === 'split' && showProspectDetails) {
      return viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1';
    }
    return viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1';
  };

  const openProspectDetails = useCallback((prospect: Prospect) => {
    setSelectedProspect(prospect);
    setShowProspectDetails(true);
  }, []);

  const closeProspectDetails = useCallback(() => {
    setShowProspectDetails(false);
    setSelectedProspect(null);
  }, []);

  const toggleProspectSelection = useCallback((prospectId: string) => {
    if (!prospectId) return;
    setSelectedProspects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(prospectId)) {
        newSet.delete(prospectId);
      } else {
        newSet.add(prospectId);
      }
      return newSet;
    });
  }, []);

  const handleProspectCardClick = useCallback((prospect: Prospect) => {
    // Don't open details when in bulk select mode
    if (isBulkSelectMode) {
      // In bulk select mode, clicking the card should toggle selection
      toggleProspectSelection(prospect.id);
      return;
    }
    openProspectDetails(prospect);
  }, [isBulkSelectMode, toggleProspectSelection, openProspectDetails]);

  const isSelected = (prospectId: string) => {
    return selectedProspects.has(prospectId);
  };

  const enterBulkSelectMode = () => {
    setIsBulkSelectMode(true);
    setSelectedProspects(new Set());
    setSelectAllChecked(false);
  };

  const exitBulkSelectMode = () => {
    setIsBulkSelectMode(false);
    setSelectedProspects(new Set());
    setSelectAllChecked(false);
  };

  const toggleSelectAll = () => {
    if (selectAllChecked) {
      // Deselect all
      setSelectedProspects(new Set());
    } else {
      // Select all visible prospects by ID
      const newSet = new Set<string>();
      sortedProspects.forEach((p) => {
        if (p.id) {
          newSet.add(p.id);
        }
      });
      setSelectedProspects(newSet);
    }
    setSelectAllChecked(!selectAllChecked);
  };

  const clearSelection = () => {
    setSelectedProspects(new Set());
    setSelectAllChecked(false);
  };

  const updateSelectAllState = useMemo(() => {
    const visibleCount = sortedProspects.length;
    let selectedVisibleCount = 0;
    
    sortedProspects.forEach((p) => {
      if (p.id && selectedProspects.has(p.id)) {
        selectedVisibleCount++;
      }
    });
    
    return visibleCount > 0 && selectedVisibleCount === visibleCount;
  }, [sortedProspects, selectedProspects]);

  useEffect(() => {
    if (isBulkSelectMode) {
      setSelectAllChecked(updateSelectAllState);
    }
  }, [updateSelectAllState, isBulkSelectMode]);

  const openActivityModalForProspect = (prospect: Prospect) => {
    setCurrentProspectForModal(prospect);
    setSelectedActivity(null);
    setShowActivityModal(true);
  };

  const closeActivityModal = () => {
    setShowActivityModal(false);
    setSelectedActivity(null);
    setCurrentProspectForModal(null);
  };

  const saveActivity = () => {
    loadProspects(); // Reload prospects to reflect new activity
    closeActivityModal();
  };

  const loadUsersForAssign = async () => {
    setRepsLoading(true);
    // Don't reset search query here to avoid triggering useEffect immediately

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('Please login to assign prospects', 'error');
        setSalesReps([]);
        setRepsLoading(false);
        return;
      }

      // Use exact same format as working examples
      const requestUrl = `${apiUrl}/api/users?limit=1000`;
      console.log('🔍 Fetching users from:', requestUrl);
      console.log('🔑 Token present:', !!token);
      console.log('🌐 API URL:', apiUrl);
      
      const response = await fetch(requestUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Users API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const users = await response.json();
        // Filter only active users on frontend
        const activeUsers = Array.isArray(users) 
          ? users.filter((u: any) => u.is_active !== false)
          : [];
        setSalesReps(activeUsers);
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Failed to load users:', {
          status: response.status,
          statusText: response.statusText,
          url: `${apiUrl}/api/users?limit=1000`,
          error: errorText
        });
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (response.status === 404) {
          console.error('❌ 404 Error Details:', {
            requestedUrl: requestUrl,
            responseUrl: response.url,
            apiUrl: apiUrl,
            suggestion: 'Check if backend server is running and route /api/users is registered. Try restarting backend server.'
          });
          showToast(`Users API not found (404). Check browser console for details.`, 'error');
        } else {
          showToast(`Failed to load users (${response.status}): ${response.statusText}`, 'error');
        }
        setSalesReps([]);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      showToast(`Error loading users: ${error.message || 'Network error'}`, 'error');
      setSalesReps([]);
    } finally {
      setRepsLoading(false);
    }
  };

  const openAssignModalForProspect = async (prospect: Prospect) => {
    setCurrentProspect(prospect);
    setRepSearchQuery(''); // Reset search before opening modal
    setShowAssignModal(true);
    await loadUsersForAssign();
  };

  const openAssignModalForBulk = async () => {
    if (selectedProspects.size > 0) {
      setCurrentProspect(null);
      setRepSearchQuery(''); // Reset search before opening modal
      setShowAssignModal(true);
      await loadUsersForAssign();
    }
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setCurrentProspect(null);
    setRepSearchQuery('');
    setSalesReps([]); // Clear users list when closing
  };

  const assignToRep = async (user: any) => {
    if (!currentProspect && selectedProspects.size === 0) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const userId = user === null || user === 'Administrator' ? null : (user.id || user);
      const userName = user === null || user === 'Administrator' ? 'Administrator' : (user.full_name || user.email || 'User');

      if (selectedProspects.size > 0) {
        // Bulk assign - use IDs instead of names
        const leadIds = Array.from(selectedProspects);
        const response = await fetch(
          `${apiUrl}/api/leads/bulk/assign`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lead_ids: leadIds,
              user_id: userId,
            }),
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          showToast(`Successfully assigned ${result.count} prospect(s) to ${userName}`, 'success');
          // Reload prospects to reflect changes
          loadProspects();
          exitBulkSelectMode();
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to assign prospects' }));
          showToast(errorData.error || 'Failed to assign prospects', 'error');
        }
      } else {
        // Single assign - use ID instead of name
        const leadId = currentProspect?.id;
        if (leadId) {
          const response = await fetch(
            `${apiUrl}/api/leads/${leadId}/assign`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: userId,
              }),
            }
          );
          
          if (response.ok) {
            showToast(`Assigned ${currentProspect?.company_name} to ${userName}`, 'success');
            loadProspects();
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to assign prospect' }));
            showToast(errorData.error || 'Failed to assign prospect', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error assigning prospect(s):', error);
      showToast('Error assigning prospect(s)', 'error');
    }

    closeAssignModal();
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    // Handle single prospect status change
    if (currentProspect && !isBulkSelectMode) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const leadId = currentProspect.id;
        
        const response = await fetch(
          `${apiUrl}/api/leads/${leadId}/status`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );
        
        if (response.ok) {
          showToast(`Updated ${currentProspect.company_name} to ${newStatus}`, 'success');
          loadProspects();
          loadStatusCounts();
          setShowStatusModal(false);
          setCurrentProspect(null);
        } else {
          showToast('Failed to update status', 'error');
        }
      } catch {
        showToast('Error updating status', 'error');
      }
      return;
    }

    // Handle bulk status change
    if (selectedProspects.size === 0) return;

    try {
      const leadNames = Array.from(selectedProspects);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/leads/bulk/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_names: leadNames,
            status: newStatus,
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        showToast(`Updated ${result.count} prospect(s) to ${newStatus}`, 'success');
        // Reload prospects to reflect changes
        loadProspects();
        loadStatusCounts();
        setShowStatusModal(false);
        exitBulkSelectMode();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch {
      showToast('Error updating status', 'error');
    }
  };

  const bulkDelete = async () => {
    if (selectedProspects.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedProspects.size} prospect(s)?`)) {
      try {
        const leadNames = Array.from(selectedProspects);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/leads/bulk/delete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lead_names: leadNames,
            }),
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          showToast(`Successfully deleted ${result.count} prospect(s)`, 'success');
          // Reload prospects to reflect changes
          loadProspects();
          exitBulkSelectMode();
        } else {
          showToast('Failed to delete prospects', 'error');
        }
      } catch {
        showToast('Error deleting prospects', 'error');
      }
    }
  };

  const refreshData = () => {
    setLoading(true);
    loadProspects();
    showToast('Refreshing prospects...', 'info', 2000);
  };

  const [showAddProspectModal, setShowAddProspectModal] = useState(false);

  const createNewProspect = () => {
    setShowAddProspectModal(true);
  };

  const handleProspectCreated = () => {
    showToast('Prospect created successfully!', 'success');
    loadProspects(); // Reload prospects list
    loadStatusCounts(); // Refresh counts (New, Contacted, etc.)
    setShowAddProspectModal(false);
  };

  const hasActiveFilters = territoryFilter || industryFilter || ownerFilter;

  const clearAllFilters = () => {
    setTerritoryFilter('');
    setIndustryFilter('');
    setOwnerFilter('');
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const toggleDetailsMode = () => {
    setDetailsViewMode((prev) => (prev === 'popup' ? 'split' : 'popup'));
  };

  const handleCall = () => {
    // Handle call action
  };

  const handleEmail = (prospect: Prospect) => {
    if (prospect.email_id || prospect.primary_email) {
      window.location.href = `mailto:${prospect.email_id || prospect.primary_email}`;
    }
  };

  return (
    <div className="app-layout bg-gray-900 dark:bg-gray-900 bg-gray-50 text-gray-300 dark:text-gray-300 text-gray-900 flex flex-col min-h-screen transition-colors">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full">
          {/* Active Filter Chips Bar (when filters are applied) */}
          {hasActiveFilters && !isBulkSelectMode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-800 dark:bg-gray-800 bg-white rounded-xl mb-4 border border-gray-700 dark:border-gray-700 border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-400 dark:text-gray-400 text-gray-600 mr-2 flex-shrink-0">Active Filters:</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {territoryFilter && (
                    <span className="flex items-center gap-1.5 dark:bg-gray-700 bg-gray-200 text-blue-600 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                      <span>Territory: {locations.find((l) => l.name === territoryFilter)?.territory_name || territoryFilter}</span>
                      <button onClick={() => setTerritoryFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-gray-900 dark:hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {industryFilter && (
                    <span className="flex items-center gap-1.5 dark:bg-gray-700 bg-gray-200 text-blue-600 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                      <span>Industry: {industryFilter}</span>
                      <button onClick={() => setIndustryFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-gray-900 dark:hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {ownerFilter && (
                    <span className="flex items-center gap-1.5 dark:bg-gray-700 bg-gray-200 text-blue-600 dark:text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                      <span>Owner: {ownerFilter}</span>
                      <button onClick={() => setOwnerFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-gray-900 dark:hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <button onClick={clearAllFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex-shrink-0">
                Clear All
              </button>
            </div>
          )}

          {/* Bulk Action Bar (when in selection mode) */}
          {isBulkSelectMode && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-800 dark:bg-gray-800 bg-white rounded-xl shadow-lg mb-4 border border-gray-700 dark:border-gray-700 border-gray-200">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
                />
                <label onClick={toggleSelectAll} className="text-sm font-medium text-white dark:text-white text-gray-900 cursor-pointer">
                  Select All (Visible)
                </label>
                <span className="text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                  {selectedProspects.size} item{selectedProspects.size !== 1 ? 's' : ''} selected
                </span>
                <button onClick={clearSelection} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Deselect all
                </button>
              </div>
              <div className="flex items-center justify-end gap-3 w-full md:w-auto flex-wrap">
                <button
                  onClick={openAssignModalForBulk}
                  disabled={selectedProspects.size === 0}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 dark:border-gray-500 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.987 6.987 0 0010 16.5a6.987 6.987 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                  </svg>
                  Assign...
                </button>
                <button
                  onClick={() => {
                    if (selectedProspects.size > 0) {
                      setShowStatusModal(true);
                    }
                  }}
                  disabled={selectedProspects.size === 0}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 dark:border-gray-500 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.5-5 3.5V4z" />
                  </svg>
                  Change Status...
                </button>
                <button
                  onClick={bulkDelete}
                  disabled={selectedProspects.size === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-800 text-white font-medium rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 009 2zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete
                </button>
                <button
                  onClick={exitBulkSelectMode}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-xl text-sm hover:bg-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 1. Creative Pipeline Filter - Mobile Optimized */}
          <div className="mb-4 md:mb-6">
            {/* Mobile: Compact filter bar */}
            <div className="md:hidden space-y-3">
              {/* Pipeline Status Buttons - Horizontal Scroll on Mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <button
                  onClick={() => setActiveFilter('queue')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    activeFilter === 'queue' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Queue
                  <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeFilter === 'queue' ? 'bg-red-700' : 'bg-red-600'
                  }`}>
                    {Array.isArray(prospects)
                      ? prospects.filter((p) => p.queue_status === 'overdue' || p.queue_status === 'today').length
                      : 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFilter('scheduled')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    activeFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Scheduled
                  <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeFilter === 'scheduled' ? 'bg-blue-700' : 'bg-blue-600'
                  }`}>
                    {Array.isArray(prospects)
                      ? prospects.filter((p) => p.queue_status === 'scheduled').length
                      : 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 dark:bg-gray-700 bg-gray-100 text-gray-300 dark:text-gray-300 text-gray-700'
                  }`}
                >
                  All
                  <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeFilter === 'all' ? 'bg-blue-700' : 'bg-blue-600'
                  }`}>
                    {Array.isArray(prospects) ? prospects.length : 0}
                  </span>
                </button>
              </div>

              {/* Pipeline Status Bar - Compact on Mobile */}
              <div className="flex h-8 bg-gray-700/50 dark:bg-gray-700/50 bg-gray-100 rounded-xl overflow-hidden">
                {['new', 'contacted', 'interested', 'proposal', 'won', 'lost'].map((status) => {
                  const count = statusCounts[status as keyof typeof statusCounts] || 0;
                  const statusColors: Record<string, string> = {
                    new: 'bg-blue-600',
                    contacted: 'bg-purple-600',
                    interested: 'bg-yellow-600',
                    proposal: 'bg-orange-600',
                    won: 'bg-green-600',
                    lost: 'bg-red-700',
                  };
                  const badgeColor = statusColors[status] || 'bg-blue-600';
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveFilter(status)}
                      className={`flex-1 flex items-center justify-center gap-1 px-1 py-1 text-xs font-semibold text-white transition-all ${
                        activeFilter === status ? badgeColor : 'bg-gray-700 dark:bg-gray-700 bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-300'
                      }`}
                      title={`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`}
                    >
                      <span className="hidden sm:inline capitalize">{status}</span>
                      <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
                      <span className={`${badgeColor} text-white text-xs font-bold px-1 py-0.5 rounded`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Original Layout */}
            <div className="hidden md:flex flex-wrap items-center gap-3">
              {/* Queue Filter Button */}
              <button
                onClick={() => setActiveFilter('queue')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-red-700 focus:outline-none transition-colors ${
                  activeFilter === 'queue' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Queue
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFilter === 'queue' ? 'bg-red-700' : 'bg-red-600'
                }`}>
                  {Array.isArray(prospects)
                    ? prospects.filter((p) => p.queue_status === 'overdue' || p.queue_status === 'today').length
                    : 0}
                </span>
              </button>

              {/* Scheduled Filter Button */}
              <button
                onClick={() => setActiveFilter('scheduled')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-blue-700 focus:outline-none transition-colors ${
                  activeFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Scheduled
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFilter === 'scheduled' ? 'bg-blue-700' : 'bg-blue-600'
                }`}>
                  {Array.isArray(prospects)
                    ? prospects.filter((p) => p.queue_status === 'scheduled').length
                    : 0}
                </span>
              </button>

              {/* Proportional Pipeline Bar */}
              <div className="flex flex-1 min-w-0 sm:min-w-[300px] lg:min-w-[400px] h-10 bg-gray-700/50 dark:bg-gray-700/50 bg-gray-100 rounded-xl overflow-hidden">
                {['new', 'contacted', 'interested', 'proposal', 'won', 'lost'].map((status) => {
                  const count = statusCounts[status as keyof typeof statusCounts] || 0;
                  const statusColors: Record<string, string> = {
                    new: 'bg-blue-600',
                    contacted: 'bg-purple-600',
                    interested: 'bg-yellow-600',
                    proposal: 'bg-orange-600',
                    won: 'bg-green-600',
                    lost: 'bg-red-700',
                  };
                  const badgeColor = statusColors[status] || 'bg-blue-600';
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveFilter(status)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                        activeFilter === status ? badgeColor : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                      <span className={`${badgeColor} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* All Filter Button */}
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-blue-700 focus:outline-none transition-colors ${
                  activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                All
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeFilter === 'all' ? 'bg-blue-700' : 'bg-blue-600'
                }`}>
                  {Array.isArray(prospects) ? prospects.length : 0}
                </span>
              </button>
            </div>
          </div>

          {/* 2c. Main Filter & Action Bar - Mobile Optimized */}
          {!isBulkSelectMode && (
            <div className="mb-6">
              {/* Mobile: Search and Filter Bar */}
              <div className="md:hidden space-y-3 mb-4">
                {/* Mobile Search - Icon Button (when hidden) or Input (when shown) */}
                {!showMobileSearch ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMobileSearch(true)}
                      className="flex items-center justify-center p-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-600 active:bg-gray-500 transition-colors"
                      aria-label="Search prospects"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                    <input
                      type="search"
                      placeholder="Search prospects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-300 dark:text-gray-200 text-gray-900 text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full py-3 pl-11 pr-10 dark:placeholder-gray-400 placeholder-gray-500"
                      aria-label="Search prospects"
                      autoFocus
                    />
                    <button
                      onClick={() => setShowMobileSearch(false)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                      aria-label="Close search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Action Buttons Row - Mobile */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 dark:bg-gray-700 bg-gray-100 border dark:border-gray-600 border-gray-300 dark:text-gray-300 text-gray-700 font-medium rounded-xl text-sm dark:hover:bg-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    <span>Filters</span>
                  </button>
                  
                  <button
                    onClick={createNewProspect}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>New</span>
                  </button>

                  <button
                    onClick={enterBulkSelectMode}
                    className="flex items-center justify-center p-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-600 active:bg-gray-500 transition-colors"
                    aria-label="Select prospects"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Desktop: Original Layout */}
              <div className="hidden md:flex flex-row justify-between items-center gap-3">
                {/* Left: Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-56">
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
                      className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
                      aria-label="Search prospects"
                    />
                  </div>
                  <Tooltip text="Open advanced filters">
                    <button
                      onClick={() => setShowFilterModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-600 text-gray-300 font-medium rounded-xl text-sm hover:bg-gray-700"
                      aria-label="Open advanced filters"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                      </svg>
                      <span>Filters</span>
                    </button>
                  </Tooltip>
                </div>

                {/* Right: Actions & Display Controls - Desktop Only */}
                <div className="flex items-center justify-end flex-wrap gap-3">
                <Tooltip text="Select prospects">
                  <button
                    onClick={enterBulkSelectMode}
                    className="flex items-center justify-center p-2.5 border border-gray-600 text-gray-300 font-medium rounded-xl text-sm hover:bg-gray-700 min-h-[44px] min-w-[44px] touch-manipulation"
                    aria-label="Select prospects"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="Create new prospect">
                  <button
                    onClick={createNewProspect}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl text-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 whitespace-nowrap touch-manipulation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span className="hidden sm:inline">New Prospect</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </Tooltip>

                <div className="h-6 w-px bg-gray-600 hidden md:block"></div>

                {/* Pagination & Refresh Controls */}
                <div className="flex items-center rounded-xl border border-gray-600 shadow-sm overflow-hidden h-10">
                  <Tooltip text="Number of items per page">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-gray-800 border-0 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-0 h-10 px-3 pr-8 text-sm appearance-none cursor-pointer"
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
                      className="flex items-center justify-center h-10 w-10 bg-gray-700 border-l border-gray-600 text-white hover:bg-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0H15"></path>
                      </svg>
                    </button>
                  </Tooltip>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center rounded-xl border border-gray-600 shadow-sm overflow-hidden h-10">
                  <Tooltip text="Sort prospects by">
                    <select
                      value={sortColumn}
                      onChange={(e) => setSortColumn(e.target.value as 'queue' | 'name' | 'status')}
                      className="bg-gray-800 border-0 text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-0 h-10 px-3 pr-8 text-sm appearance-none cursor-pointer"
                    >
                      <option value="queue">Next Action</option>
                      <option value="name">Company</option>
                      <option value="status">Status</option>
                    </select>
                  </Tooltip>
                  <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                    <button
                      onClick={toggleSortDirection}
                      className="flex items-center justify-center h-10 w-10 bg-gray-700 border-l border-gray-600 text-white hover:bg-gray-600"
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

                {/* Unified View Controls */}
                <div className="flex items-center rounded-xl border border-gray-600 shadow-sm overflow-hidden h-10">
                  {/* Grid/List Toggle */}
                  <Tooltip text={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
                    <button
                      onClick={toggleLayoutMode}
                      className="flex items-center justify-center h-10 w-10 bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      {viewMode === 'grid' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </Tooltip>

                  {/* Popup/Split Toggle */}
                  <Tooltip text={detailsViewMode === 'popup' ? 'Switch to Split View' : 'Switch to Popup View'}>
                    <button
                      onClick={toggleDetailsMode}
                      className="flex items-center justify-center h-10 w-10 bg-gray-700 border-l border-gray-600 hover:bg-gray-600 text-white"
                    >
                      {detailsViewMode === 'popup' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4v16m6-16v16M4 8h16M4 16h16"></path>
                        </svg>
                      )}
                    </button>
                  </Tooltip>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Prospects Grid/List and Detail Panel */}
          <div className={`flex gap-6 ${detailsViewMode === 'split' && showProspectDetails ? 'flex-row' : 'flex-col'}`}>
            {/* Prospects Section */}
            <div className={detailsViewMode === 'split' && showProspectDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading prospects...</p>
                </div>
              ) : paginatedProspects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-xl">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">No prospects found</h3>
                    <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                  </div>
                </div>
              ) : (
                <div className={`grid ${getProspectGridClass()} gap-6`}>
                  {paginatedProspects.map((prospect) => (
                    <div
                      key={prospect.id || prospect.name}
                      onClick={() => handleProspectCardClick(prospect)}
                      className={`bg-gray-800 rounded-xl shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 cursor-pointer w-full relative ${
                        getCardBorderClass(prospect.status)
                      } ${isSelected(prospect.id) ? 'ring-2 ring-blue-500 !border-blue-500' : ''} ${
                        selectedProspect?.id === prospect.id && showProspectDetails && !isBulkSelectMode ? 'ring-2 ring-indigo-500 !border-indigo-500' : ''
                      }`}
                    >
                      {isBulkSelectMode && (
                        <input
                          type="checkbox"
                          checked={isSelected(prospect.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleProspectSelection(prospect.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="absolute top-4 right-4 h-5 w-5 rounded bg-gray-900/50 border-gray-500 text-blue-500 focus:ring-blue-600 z-20 cursor-pointer"
                          style={{ zIndex: 20 }}
                        />
                      )}

                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-bold text-white dark:text-white text-gray-900 truncate pr-2">
                            {prospect.company_name || 'No Company'}
                          </h4>
                          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(prospect.status)}`}>
                            {getStatusLabel(prospect.status)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400 dark:text-gray-400 text-gray-600">
                          {prospect.city && (
                            <p className="flex items-center">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              </svg>
                              <span className="ml-1.5">
                                {prospect.city}
                                {prospect.state ? `, ${prospect.state}` : ''}
                              </span>
                            </p>
                          )}
                          {prospect.industry && (
                            <p className="flex items-center">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1 4h1"></path>
                              </svg>
                              <span className="ml-1.5">{prospect.industry}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-4 pb-4 border-b border-gray-700 dark:border-gray-700 border-gray-200 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-white truncate">{prospect.lead_name || 'No Contact'}</p>
                              <p className="text-sm text-gray-400 truncate">{prospect.title || 'Contact'}</p>
                            </div>
                          </div>
                        </div>
                        {prospect.queue_status && prospect.queue_status !== 'none' && (
                          <p className={`text-sm flex items-center ${getQueueStatusClass(prospect.queue_status)}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                            </svg>
                            <span className="ml-1.5 font-medium">
                              {prospect.queue_message || 'Action required'}
                            </span>
                          </p>
                        )}
                      </div>

                      <div 
                        className="p-2 backdrop-blur-sm mt-auto overflow-hidden"
                        style={{
                          backgroundColor: '#17171780',
                          borderTop: '1px solid #52525280',
                          borderBottomLeftRadius: '0.5rem',
                          borderBottomRightRadius: '0.5rem'
                        }}
                      >
                        <div className="grid grid-cols-3 gap-2">
                          <Tooltip text="Log Call">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openActivityModalForProspect(prospect);
                              }}
                              className="group relative flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent hover:bg-green-600/20 text-gray-300 hover:text-green-400 text-xs font-medium transition-all duration-200 border border-transparent hover:border-green-600/30"
                              style={{ borderRadius: '0.375rem' }}
                            >
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-green-600/0 via-green-600/5 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ borderRadius: '0.375rem' }}
                              ></div>
                              <Phone className="w-4 h-4 relative z-10 flex-shrink-0" />
                              <span className="relative z-10 hidden sm:inline whitespace-nowrap">Call</span>
                            </button>
                          </Tooltip>
                          <Tooltip text="Schedule Activity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openActivityModalForProspect(prospect);
                              }}
                              className="group relative flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs font-medium transition-all duration-200 border border-transparent hover:border-blue-600/30"
                              style={{ borderRadius: '0.375rem' }}
                            >
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ borderRadius: '0.375rem' }}
                              ></div>
                              <svg className="w-4 h-4 relative z-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span className="relative z-10 hidden sm:inline whitespace-nowrap">Schedule</span>
                            </button>
                          </Tooltip>
                          <Tooltip text="Change Status">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentProspect(prospect);
                                setShowStatusModal(true);
                              }}
                              className="group relative flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent hover:bg-yellow-600/20 text-gray-300 hover:text-yellow-400 text-xs font-medium transition-all duration-200 border border-transparent hover:border-yellow-600/30"
                              style={{ borderRadius: '0.375rem' }}
                            >
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 via-yellow-600/5 to-yellow-600/0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ borderRadius: '0.375rem' }}
                              ></div>
                              <svg className="w-4 h-4 relative z-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              </svg>
                              <span className="relative z-10 hidden sm:inline whitespace-nowrap">Status</span>
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Split View Detail Panel */}
            {detailsViewMode === 'split' && showProspectDetails && selectedProspect && (
              <div className="w-1/3 min-w-0">
                <ProspectDetails
                  prospect={selectedProspect}
                  mode="split"
                  showCloseButton={true}
                  showActivityHistory={false}
                  onClose={closeProspectDetails}
                  onCall={handleCall}
                  onEmail={handleEmail}
                  onAssign={openAssignModalForProspect}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Prospect Detail Modal (for popup mode) */}
      {showProspectDetails && detailsViewMode === 'popup' && selectedProspect && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={closeProspectDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl my-4" onClick={(e) => e.stopPropagation()}>
            <ProspectDetails
              prospect={selectedProspect}
              mode="popup"
              showCloseButton={true}
              showActivityHistory={true}
              onClose={closeProspectDetails}
              onCall={handleCall}
              onEmail={handleEmail}
              onAssign={openAssignModalForProspect}
            />
          </div>
        </div>
      )}

      {/* Activity Modal */}
      <TallacActivityModal
        show={showActivityModal}
        activity={selectedActivity}
        leadInfo={
          currentProspectForModal
            ? {
                name: currentProspectForModal.name || currentProspectForModal.id,
                company_name: currentProspectForModal.company_name,
                primary_contact_name: currentProspectForModal.lead_name,
              }
            : undefined
        }
        onClose={closeActivityModal}
        onSave={saveActivity}
      />

      {/* Assignment Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeAssignModal}
        >
          <div
            className="bg-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 border-gray-200">
              <h3 className="text-lg font-medium text-white">
                Assign Prospect{selectedProspects.size > 1 ? 's' : ''}:{' '}
                <span>{currentProspect?.company_name || `${selectedProspects.size} prospects`}</span>
              </h3>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-white" title="Close">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="search"
                  value={repSearchQuery}
                  onChange={(e) => setRepSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="bg-gray-700 border border-gray-600 text-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-4 py-2.5 placeholder-gray-400"
                  autoFocus
                />
              </div>

              {repsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner w-8 h-8 border-4 border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : filteredSalesReps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-400 text-sm">No users found</p>
                  {repSearchQuery && (
                    <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                  {filteredSalesReps.map((rep) => (
                    <li
                      key={rep.id || rep.email}
                      onClick={() => assignToRep(rep)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0">
                          {getInitials(rep.full_name || rep.email)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {rep.full_name || `${rep.first_name || ''} ${rep.last_name || ''}`.trim() || rep.email}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{rep.email}</p>
                        </div>
                      </div>
                      {rep.role && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{rep.role}</span>
                      )}
                    </li>
                  ))}
                  <li
                    onClick={() => assignToRep(null)}
                    className="flex items-center p-3 rounded-xl hover:bg-gray-700 cursor-pointer transition-colors border-t border-gray-700 pt-3"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-gray-400 flex-shrink-0">
                      <X className="w-5 h-5" />
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-400 italic">Unassign</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 border-gray-200">
              <h3 className="text-lg font-medium text-white">Advanced Filters</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-white" title="Close">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Territory</label>
                <select
                  value={territoryFilter}
                  onChange={(e) => setTerritoryFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Territories</option>
                  {locations.map((location) => (
                    <option key={location.name} value={location.name}>
                      {location.territory_name || location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Industry</label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Industries</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Warehousing">Warehousing</option>
                  <option value="Specialty Moving">Specialty Moving</option>
                  <option value="Freight">Freight</option>
                  <option value="Air Cargo">Air Cargo</option>
                  <option value="Maritime Shipping">Maritime Shipping</option>
                  <option value="Trucking">Trucking</option>
                  <option value="Distribution">Distribution</option>
                  <option value="Freight Forwarding">Freight Forwarding</option>
                  <option value="Express Delivery">Express Delivery</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Assigned To</label>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Owners</option>
                  <option value="Calvin M.">Calvin M.</option>
                  <option value="Shruti K.">Shruti K.</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 border-t dark:border-gray-700 border-gray-200 dark:bg-gray-800/50 bg-gray-50 rounded-b-lg">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 border border-gray-600 text-gray-300 font-medium rounded-xl text-sm hover:bg-gray-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl text-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-800"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Change Modal */}
      {showStatusModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 border-gray-200">
              <h3 className="text-lg font-medium text-white">
                Change Status {currentProspect && !isBulkSelectMode 
                  ? `- ${currentProspect.company_name}` 
                  : `(${selectedProspects.size} prospects)`}
              </h3>
              <button 
                onClick={() => {
                  setShowStatusModal(false);
                  setCurrentProspect(null);
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['new', 'contacted', 'interested', 'proposal', 'won', 'lost'].map((status) => (
                  <button
                    key={status}
                    onClick={() => bulkUpdateStatus(status)}
                    className={`p-4 text-white rounded-xl font-medium transition-colors ${
                      status === 'new'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : status === 'contacted'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : status === 'interested'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : status === 'proposal'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : status === 'won'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAddProspectModal && (
        <AddProspectModal
          onClose={() => setShowAddProspectModal(false)}
          onSuccess={handleProspectCreated}
          territories={locations}
        />
      )}
    </div>
  );
}

export default function ProspectsPage() {
  return (
    <Suspense fallback={
      <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    }>
      <ProspectsPageContent />
    </Suspense>
  );
}
