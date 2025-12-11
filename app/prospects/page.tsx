'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import ProspectCard from '@/components/ProspectCard';
import ProspectDetails from '@/components/ProspectDetails';
import BaseModal from '@/components/BaseModal';
import CustomDropdown from '@/components/CustomDropdown';
import Tooltip from '@/components/Tooltip';
import MobileBottomNav from '@/components/MobileBottomNav';
import AddProspectModal from '@/components/AddProspectModal';
import TallacActivityModal from '@/components/TallacActivityModal';
import ImportModal from '@/components/ImportModal';
import ImportResultsModal from '@/components/ImportResultsModal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCall } from '@/contexts/CallContext';

interface Prospect {
  id?: string;
  name?: string;
  prospect_code?: string;
  company_name?: string;
  organization_name?: string;
  city?: string;
  state?: string;
  industry?: string;
  lead_name?: string;
  title?: string;
  status?: string;
  queue_status?: string;
  queue_message?: string;
  assigned_to?: string;
  territory?: string;
  contact_path?: Array<{ name: string; status: string }>;
  primary_contact?: string;
  primary_phone?: string;
  phone?: string;
  email_id?: string;
}

export default function ProspectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, canViewPartnersAndUsers } = useAuth();
  const { activeCall, startCall } = useCall();

  // State
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSingleStatusModal, setShowSingleStatusModal] = useState(false);
  const [statusTargetProspect, setStatusTargetProspect] = useState<Prospect | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [currentProspectForModal, setCurrentProspectForModal] = useState<Prospect | null>(null);
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [repsLoading, setRepsLoading] = useState(false);
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResultsData, setImportResultsData] = useState<any>(null);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortColumn, setSortColumn] = useState('queue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(1000); // Show all data by default, but with performance optimizations
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('popup');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showProspectDetails, setShowProspectDetails] = useState(false);

  // Load prospects
  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (territoryFilter) filters.territory = territoryFilter;
      if (industryFilter) filters.industry = industryFilter;
      if (ownerFilter && ownerFilter !== 'Unassigned') filters.assigned_to = ownerFilter;
      
      // If pageSize is 10000, send it as "all" to backend
      const limitToSend = pageSize >= 10000 ? 10000 : pageSize;
      const result = await api.getProspects(filters, limitToSend, currentPage);
      if (result.success && result.data) {
        setProspects(result.data);
      }
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  }, [territoryFilter, industryFilter, ownerFilter, pageSize, currentPage]);

  // Load territories
  const loadTerritories = useCallback(async () => {
    try {
      const result = await api.getTerritories();
      if (result.success && result.data) {
        setLocations(result.data);
      }
    } catch (error) {
      console.error('Error loading territories:', error);
    }
  }, []);

  // Load industries
  const loadIndustries = useCallback(async () => {
    try {
      const result = await api.getIndustries();
      if (result.success && result.data) {
        setIndustries(result.data);
      }
    } catch (error) {
      console.error('Error loading industries:', error);
    }
  }, []);

  // Load owner options
  const loadOwnerOptions = useCallback(async () => {
    try {
      const result = await api.getUsersForAssignment();
      if (result.success && result.data) {
        setOwnerOptions(result.data);
      }
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  }, []);

  // Setup default filter
  const setupDefaultFilter = useCallback(async () => {
    if (user) {
      const unrestrictedRoles = ['Administrator', 'Corporate Admin', 'Business Coach', 'System Manager'];
      if (!unrestrictedRoles.includes(user.tallac_role || '')) {
        setOwnerFilter(user.full_name || user.email || '');
      }
    }
  }, [user]);

  // Initialize
  useEffect(() => {
    loadProspects();
    loadTerritories();
    loadIndustries();
    loadOwnerOptions();
    setupDefaultFilter();

    // Check for openProspect query param
    const openProspect = searchParams.get('openProspect');
    if (openProspect) {
      // Will be handled after prospects load
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        if (!showProspectDetails && window.innerWidth >= 1024) {
          setDetailsViewMode('split');
        }
      } else {
        setViewMode('list');
        setDetailsViewMode('popup');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loadProspects, loadTerritories, loadIndustries, loadOwnerOptions, setupDefaultFilter, searchParams, showProspectDetails]);

  // Computed values
  const statusCounts = useMemo(() => {
    const counts = {
      new: 0,
      contacted: 0,
      interested: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };
    
    prospects.forEach(p => {
      const status = (p.status || 'new').toLowerCase();
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [prospects]);

  const queueCount = useMemo(() => {
    return prospects.filter(p => 
      p.queue_status === 'overdue' || p.queue_status === 'today'
    ).length;
  }, [prospects]);

  const scheduledCount = useMemo(() => {
    return prospects.filter(p => p.queue_status === 'scheduled').length;
  }, [prospects]);

  const allCount = prospects.length;

  // Filter options
  const filterOptions = useMemo(() => [
    { value: 'queue', label: `Queue (${queueCount})`, color: '#dc2626' },
    { value: 'scheduled', label: `Scheduled (${scheduledCount})`, color: '#2563eb' },
    { value: 'new', label: `New (${statusCounts.new})`, color: '#2563eb' },
    { value: 'contacted', label: `Contacted (${statusCounts.contacted})`, color: '#9333ea' },
    { value: 'interested', label: `Interested (${statusCounts.interested})`, color: '#ca8a04' },
    { value: 'proposal', label: `Proposal (${statusCounts.proposal})`, color: '#ea580c' },
    { value: 'won', label: `Won (${statusCounts.won})`, color: '#16a34a' },
    { value: 'lost', label: `Lost (${statusCounts.lost})`, color: '#dc2626' },
    { value: 'all', label: `All (${allCount})`, color: '#2563eb' },
  ], [queueCount, scheduledCount, statusCounts, allCount]);

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.company_name || p.organization_name || '').toLowerCase().includes(query) ||
        (p.lead_name || '').toLowerCase().includes(query) ||
        (p.email_id || '').toLowerCase().includes(query)
      );
    }

    // Territory filter
    if (territoryFilter) {
      filtered = filtered.filter(p => p.territory === territoryFilter);
    }

    // Industry filter
    if (industryFilter) {
      filtered = filtered.filter(p => p.industry === industryFilter);
    }

    // Owner filter
    if (ownerFilter) {
      if (ownerFilter === 'Unassigned') {
        filtered = filtered.filter(p => !p.assigned_to || p.assigned_to === 'Administrator');
      } else {
        filtered = filtered.filter(p => p.assigned_to === ownerFilter);
      }
    }

    // Pipeline/queue filter
    if (activeFilter === 'all') {
      // Show all
    } else if (activeFilter === 'queue') {
      filtered = filtered.filter(p => 
        p.queue_status === 'overdue' || p.queue_status === 'today'
      );
    } else if (activeFilter === 'scheduled') {
      filtered = filtered.filter(p => p.queue_status === 'scheduled');
    } else {
      filtered = filtered.filter(p => 
        (p.status || 'new').toLowerCase() === activeFilter
      );
    }

    return filtered;
  }, [prospects, searchQuery, territoryFilter, industryFilter, ownerFilter, activeFilter]);

  // Sorted prospects
  const sortedProspects = useMemo(() => {
    const filtered = [...filteredProspects];
    
    filtered.sort((a, b) => {
      let compareA: any, compareB: any;
      
      switch (sortColumn) {
        case 'name':
          compareA = (a.company_name || a.organization_name || '').toLowerCase();
          compareB = (b.company_name || b.organization_name || '').toLowerCase();
          break;
        case 'status':
          compareA = (a.status || 'new').toLowerCase();
          compareB = (b.status || 'new').toLowerCase();
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
  }, [filteredProspects, sortColumn, sortDirection]);

  // Paginated prospects
  const paginatedProspects = useMemo(() => {
    return sortedProspects.slice(0, pageSize);
  }, [sortedProspects, pageSize]);

  const hasActiveFilters = useMemo(() => {
    return !!(territoryFilter || industryFilter || ownerFilter);
  }, [territoryFilter, industryFilter, ownerFilter]);

  // Formatted options
  const formattedTerritoryOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Territories' }];
    if (locations.length) {
      options.push(...locations.map(l => ({
        value: l.name || l.id,
        label: `${l.territory_name || l.name} (${l.territory_state || ''}) - ${l.territory_code || ''}`,
      })));
    }
    return options;
  }, [locations]);

  const formattedIndustryOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Industries' }];
    if (industries.length) {
      options.push(...industries.map(i => ({
        value: i.industry_name || i.name,
        label: i.industry_name || i.name,
      })));
    }
    return options;
  }, [industries]);

  const formattedOwnerOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Owners' }];
    if (ownerOptions.length) {
      options.push(...ownerOptions.map(o => ({
        value: o.full_name || o.name,
        label: o.full_name || o.name,
      })));
    }
    options.push({ value: 'Unassigned', label: 'Unassigned' });
    return options;
  }, [ownerOptions]);

  const pageSizeOptions = [
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
    { value: '500', label: '500' },
    { value: '1000', label: '1000' },
    { value: '5000', label: '5000' },
    { value: '10000', label: 'All' },
  ];

  const sortOptions = [
    { value: 'queue', label: 'Next Action' },
    { value: 'name', label: 'Company' },
    { value: 'status', label: 'Status' },
  ];

  // Helper functions
  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      'new': 'bg-blue-600/20 text-blue-300',
      'contacted': 'bg-purple-600/20 text-purple-300',
      'interested': 'bg-yellow-600/20 text-yellow-300',
      'proposal': 'bg-orange-600/20 text-orange-300',
      'won': 'bg-green-600/20 text-green-300',
      'lost': 'bg-red-700/20 text-red-300',
    };
    return statusMap[(status || 'new').toLowerCase()] || 'bg-gray-600/20 text-gray-300';
  };

  const getStatusLabel = (status?: string) => {
    const statusMap: Record<string, string> = {
      'proposal': 'Proposal',
      'contacted': 'Contacted',
      'interested': 'Interested',
      'lost': 'Lost',
      'won': 'Won',
      'new': 'New',
    };
    return statusMap[(status || 'new').toLowerCase()] || 'New';
  };

  const getQueueMessage = (queueStatus?: string) => {
    const messageMap: Record<string, string> = {
      'overdue': 'Overdue: Action required',
      'today': 'Due Today: Action required',
      'scheduled': 'Scheduled task',
    };
    return messageMap[queueStatus || ''] || '';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(/[\s@.]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getLocationName = (locationValue: string) => {
    const location = locations.find(l => (l.name || l.id) === locationValue);
    return location?.territory_name || locationValue;
  };

  // Actions
  const refreshData = useCallback(() => {
    loadProspects();
  }, [loadProspects]);

  const createNewProspect = () => {
    setShowAddProspectModal(true);
  };

  const handleCall = (prospect: Prospect) => {
    const phoneNumber = prospect.primary_phone || prospect.phone;
    if (phoneNumber) {
      const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      window.location.href = `tel:${cleanPhoneNumber}`;
    } else {
      alert('No phone number available for this prospect.');
    }
  };

  const openCallLogModalForProspect = (prospect: Prospect) => {
    if (activeCall) {
      alert('A call is already in progress. Please end the current call before starting a new one.');
      return;
    }

    const phoneNumber = prospect.primary_phone || prospect.phone;
    if (!phoneNumber || phoneNumber.trim() === '') {
      alert('No phone number available for this prospect.');
      return;
    }

    const callLogId = `TCALL-${Date.now()}`;
    startCall({
      ...prospect,
      primary_contact: prospect.lead_name || 'Primary Contact',
      primary_phone: phoneNumber,
    }, callLogId);

    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanPhoneNumber}`;
  };

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

  const saveActivity = async (activityData: any) => {
    if (!currentProspectForModal) {
      console.error('No prospect selected for activity');
      return;
    }

    const payload = {
      prospect: currentProspectForModal.name || currentProspectForModal.id,
      activity_type: activityData.activity_type,
      scheduled_date: activityData.scheduled_date,
      scheduled_time: activityData.scheduled_time,
      assigned_to: activityData.assigned_to,
      description: activityData.description,
      subject: `${activityData.activity_type} - ${currentProspectForModal.company_name || currentProspectForModal.organization_name}`,
    };

    try {
      let result;
      if (activityData.name || activityData.id) {
        result = await api.updateActivity(activityData.name || activityData.id, payload);
      } else {
        result = await api.createScheduledActivity(payload);
      }

      if (result.success) {
        closeActivityModal();
        await loadProspects();
      } else {
        console.error('Failed to save activity:', result.message);
        alert('Failed to save activity: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('An error occurred while saving the activity');
    }
  };

  const currentProspectLeadInfo = useMemo(() => {
    if (!currentProspectForModal) return {};
    return {
      name: currentProspectForModal.company_name || currentProspectForModal.organization_name || 'Unknown',
      contact: currentProspectForModal.lead_name || 'Unknown',
      phone: currentProspectForModal.primary_phone || currentProspectForModal.phone || '',
      email: currentProspectForModal.email_id || '',
    };
  }, [currentProspectForModal]);

  const handleImportSuccess = () => {
    setShowImportModal(false);
    refreshData();
  };

  const handleShowImportResults = (results: any) => {
    setImportResultsData(results);
    setShowImportResults(true);
  };

  const handleImportComplete = () => {
    setShowImportResults(false);
    setImportResultsData(null);
    refreshData();
  };

  const openStatusModalForProspect = (prospect: Prospect) => {
    setStatusTargetProspect(prospect);
    setShowSingleStatusModal(true);
  };

  const updateSingleStatus = async (newStatus: string) => {
    if (!statusTargetProspect) return;
    
    const result = await api.updateProspect(
      statusTargetProspect.name || statusTargetProspect.id || '',
      { status: newStatus }
    );
    
    if (result.success) {
      const updated = prospects.map(p => 
        (p.name || p.id) === (statusTargetProspect.name || statusTargetProspect.id)
          ? { ...p, status: newStatus }
          : p
      );
      setProspects(updated);
      setShowSingleStatusModal(false);
      setStatusTargetProspect(null);
    } else {
      alert('Failed to update status: ' + result.message);
    }
  };

  const openAssignModalForProspect = async (prospect: Prospect) => {
    setCurrentProspect(prospect);
    setShowAssignModal(true);
    setRepsLoading(true);
    setRepSearchQuery('');
    
    try {
      const result = await api.getUsersForAssignment(prospect.territory);
      if (result.success && result.data) {
        setSalesReps(result.data);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setRepsLoading(false);
    }
  };

  const assignToRep = async (repName: string) => {
    if (!currentProspect && selectedProspects.size === 0) return;
    
    const newOwner = repName === 'Administrator' ? null : repName;
    
    if (selectedProspects.size > 0) {
      const promises = Array.from(selectedProspects).map(async (prospectId) => {
        const result = await api.updateProspect(prospectId, {
          assigned_to: newOwner
        });
        
        if (result.success) {
          const updated = prospects.map(p => 
            (p.name || p.id) === prospectId ? { ...p, assigned_to: newOwner } : p
          );
          setProspects(updated);
        }
      });
      await Promise.all(promises);
      exitBulkSelectMode();
    } else if (currentProspect) {
      const result = await api.updateProspect(
        currentProspect.name || currentProspect.id || '',
        { assigned_to: newOwner }
      );

      if (result.success) {
        const updated = prospects.map(p => 
          (p.name || p.id) === (currentProspect.name || currentProspect.id)
            ? { ...p, assigned_to: newOwner }
            : p
        );
        setProspects(updated);
      }
    }
    
    setShowAssignModal(false);
    setCurrentProspect(null);
  };

  const filteredSalesReps = useMemo(() => {
    if (!repSearchQuery) return salesReps;
    const query = repSearchQuery.toLowerCase();
    return salesReps.filter(rep =>
      (rep.full_name || '').toLowerCase().includes(query) ||
      (rep.email || '').toLowerCase().includes(query)
    );
  }, [salesReps, repSearchQuery]);

  // Bulk selection
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

  const toggleProspectSelection = (prospectId: string) => {
    const newSet = new Set(selectedProspects);
    if (newSet.has(prospectId)) {
      newSet.delete(prospectId);
    } else {
      newSet.add(prospectId);
    }
    setSelectedProspects(newSet);
  };

  const isSelected = (prospectId: string) => {
    return selectedProspects.has(prospectId);
  };

  const toggleSelectAll = () => {
    if (selectAllChecked) {
      const newSet = new Set<string>();
      paginatedProspects.forEach(p => {
        newSet.add(p.name || p.id || '');
      });
      setSelectedProspects(newSet);
    } else {
      setSelectedProspects(new Set());
    }
    setSelectAllChecked(!selectAllChecked);
  };

  const bulkAssign = () => {
    if (selectedProspects.size === 0) return;
    openAssignModalForBulk();
  };

  const openAssignModalForBulk = async () => {
    setCurrentProspect(null);
    setShowAssignModal(true);
    setRepsLoading(true);
    setRepSearchQuery('');
    
    let territory = null;
    if (selectedProspects.size > 0) {
      const ids = Array.from(selectedProspects);
      const firstProspect = prospects.find(p => (p.name || p.id) === ids[0]);
      
      if (firstProspect?.territory) {
        const candidateTerritory = firstProspect.territory;
        const allSame = ids.every(id => {
          const p = prospects.find(pr => (pr.name || pr.id) === id);
          return p && p.territory === candidateTerritory;
        });
        
        if (allSame) {
          territory = candidateTerritory;
        }
      }
    }
    
    try {
      const result = await api.getUsersForAssignment(territory);
      if (result.success && result.data) {
        setSalesReps(result.data);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setRepsLoading(false);
    }
  };

  const bulkChangeStatus = () => {
    if (selectedProspects.size === 0) return;
    setShowStatusModal(true);
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    const promises = Array.from(selectedProspects).map(async (prospectId) => {
      const result = await api.updateProspect(prospectId, { status: newStatus });
      if (result.success) {
        const updated = prospects.map(p =>
          (p.name || p.id) === prospectId ? { ...p, status: newStatus } : p
        );
        setProspects(updated);
      }
    });
    await Promise.all(promises);
    setShowStatusModal(false);
    exitBulkSelectMode();
  };

  const bulkDelete = async () => {
    if (selectedProspects.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedProspects.size} prospect(s)?`)) {
      const promises = Array.from(selectedProspects).map(async (prospectId) => {
        await api.deleteProspect(prospectId);
      });
      await Promise.all(promises);
      await loadProspects();
      exitBulkSelectMode();
    }
  };

  const clearAllFilters = () => {
    setTerritoryFilter('');
    setIndustryFilter('');
    setOwnerFilter('');
  };

  const handleProspectCardClick = (prospect: Prospect) => {
    if (isBulkSelectMode) return;
    openProspectDetails(prospect);
  };

  const openProspectDetails = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setShowProspectDetails(true);
  };

  const closeProspectDetails = () => {
    setShowProspectDetails(false);
    setSelectedProspect(null);
    if (searchParams.get('openProspect')) {
      router.replace('/prospects');
    }
  };

  const getProspectGridClass = () => {
    if (detailsViewMode === 'split' && showProspectDetails) {
      return viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1';
    }
    return viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1';
  };

  const canImport = useMemo(() => {
    const allowedTallacRoles = ['Administrator', 'Corporate Admin', 'Territory Admin'];
    if (user?.tallac_role && allowedTallacRoles.includes(user.tallac_role)) {
      return true;
    }
    if (user?.roles && user.roles.includes('Administrator')) {
      return true;
    }
    return false;
  }, [user]);

  // Set initial view mode based on window size (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setViewMode(window.innerWidth >= 768 ? 'grid' : 'list');
      setDetailsViewMode(window.innerWidth >= 1024 ? 'split' : 'popup');
    }
  }, []);

  // Check for openProspect query param after prospects load
  useEffect(() => {
    const openProspect = searchParams.get('openProspect');
    if (openProspect && prospects.length > 0) {
      const prospect = prospects.find(p => (p.name || p.id) === openProspect);
      if (prospect) {
        setDetailsViewMode('popup');
        openProspectDetails(prospect);
      }
    }
  }, [prospects, searchParams]);

  return (
    <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Pipeline Filter */}
          <div className="hidden md:flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setActiveFilter('queue')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none transition-colors ${
                activeFilter === 'queue' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
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
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors ${
                activeFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Scheduled
              <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                activeFilter === 'scheduled' ? 'bg-blue-700' : 'bg-blue-600'
              }`}>
                {scheduledCount}
              </span>
            </button>

            <div className="flex flex-1 min-w-[400px] h-10 bg-gray-700/50 rounded-lg overflow-hidden">
              {['new', 'contacted', 'interested', 'proposal', 'won', 'lost'].map((status) => {
                const colors: Record<string, { bg: string; badge: string }> = {
                  new: { bg: 'bg-blue-600', badge: 'bg-blue-600' },
                  contacted: { bg: 'bg-purple-600', badge: 'bg-purple-600' },
                  interested: { bg: 'bg-yellow-600', badge: 'bg-yellow-600' },
                  proposal: { bg: 'bg-orange-600', badge: 'bg-orange-600' },
                  won: { bg: 'bg-green-600', badge: 'bg-green-600' },
                  lost: { bg: 'bg-red-700', badge: 'bg-red-700' },
                };
                const color = colors[status] || colors.new;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveFilter(status)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-white transition-all duration-200 focus:outline-none ${
                      activeFilter === status ? color.bg : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <span className="capitalize">{status}</span>
                    <span className={`${color.badge} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>
                      {statusCounts[status as keyof typeof statusCounts]}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition-colors ${
                activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              All
              <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${
                activeFilter === 'all' ? 'bg-blue-700' : 'bg-blue-600'
              }`}>
                {allCount}
              </span>
            </button>
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && !isBulkSelectMode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-800 rounded-lg mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-400 mr-2 flex-shrink-0">Active Filters:</span>
                {territoryFilter && (
                  <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span>Territory: {getLocationName(territoryFilter)}</span>
                    <button onClick={() => setTerritoryFilter('')} className="text-gray-400 hover:text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </span>
                )}
                {industryFilter && (
                  <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span>Industry: {industryFilter}</span>
                    <button onClick={() => setIndustryFilter('')} className="text-gray-400 hover:text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </span>
                )}
                {ownerFilter && (
                  <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span>Owner: {ownerFilter}</span>
                    <button onClick={() => setOwnerFilter('')} className="text-gray-400 hover:text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </span>
                )}
              </div>
              <button onClick={clearAllFilters} className="text-sm text-blue-400 hover:text-blue-300 flex-shrink-0">
                Clear All
              </button>
            </div>
          )}

          {/* Bulk Action Bar */}
          {isBulkSelectMode && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-700 rounded-lg shadow-lg mb-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
                />
                <label className="text-sm font-medium text-white cursor-pointer" onClick={toggleSelectAll}>
                  Select All (Visible)
                </label>
                <span className="text-sm text-gray-300">{selectedProspects.size} item{selectedProspects.size !== 1 ? 's' : ''} selected</span>
                <button onClick={() => setSelectedProspects(new Set())} className="text-sm text-blue-400 hover:text-blue-300">
                  Deselect all
                </button>
              </div>
              <div className="flex items-center justify-end gap-3 w-full md:w-auto flex-wrap">
                <button onClick={bulkAssign} className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600 h-10">
                  Assign...
                </button>
                <button onClick={bulkChangeStatus} className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600 h-10">
                  Change Status...
                </button>
                <button onClick={bulkDelete} className="flex items-center gap-2 px-4 py-2.5 bg-red-800 text-white font-medium rounded-lg text-sm hover:bg-red-700 h-10">
                  Delete
                </button>
                <button onClick={exitBulkSelectMode} className="flex items-center gap-2 px-4 py-2.5 border border-gray-500 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600 h-10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Main Filter & Action Bar */}
          {!isBulkSelectMode && (
            <div className="flex flex-col mb-6 gap-3">
              {/* Desktop Layout */}
              <div className="hidden md:flex justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-56">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      type="search"
                      placeholder="Search..."
                      className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-10 py-2.5 pl-10 pr-3 placeholder-gray-400"
                    />
                  </div>
                  <Tooltip text="Open advanced filters">
                    <button
                      onClick={() => setShowFilterModal(true)}
                      className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg h-10 ${
                        hasActiveFilters
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                      </svg>
                      <span className="hidden sm:inline">Filters</span>
                    </button>
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-3">
                  <Tooltip text="Select prospects">
                    <button
                      onClick={enterBulkSelectMode}
                      className="flex items-center justify-center w-10 h-10 p-2.5 border border-gray-600 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </button>
                  </Tooltip>
                  <Tooltip text="Create new prospect">
                    <button
                      onClick={createNewProspect}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 whitespace-nowrap h-10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      New Prospect
                    </button>
                  </Tooltip>
                  {canImport && (
                    <Tooltip text="Import prospects from CSV">
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-600 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-700 whitespace-nowrap h-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        Import
                      </button>
                    </Tooltip>
                  )}
                  <div className="h-6 w-px bg-gray-600"></div>
                  <div className="flex items-center gap-2">
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
                    <Tooltip text="Refresh data">
                      <button
                        onClick={refreshData}
                        className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0H15"></path>
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32">
                      <CustomDropdown
                        value={sortColumn}
                        options={sortOptions}
                        onChange={setSortColumn}
                        buttonClass="bg-gray-800 border-gray-600 text-gray-400"
                        showColorDot={false}
                        showCheckmark={false}
                      />
                    </div>
                    <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                      <button
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
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
                  <div className="flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
                    <Tooltip text={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}>
                      <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 hover:bg-gray-600 text-white"
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
                    <Tooltip text={detailsViewMode === 'popup' ? 'Switch to Split View' : 'Switch to Popup View'}>
                      <button
                        onClick={() => setDetailsViewMode(detailsViewMode === 'popup' ? 'split' : 'popup')}
                        className="flex items-center justify-center p-2.5 bg-gray-700 border-l border-gray-600 hover:bg-gray-600 text-white"
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

              {/* Mobile Layout: Line 1 - Filter + Advanced filter + Sort */}
              <div className="flex md:hidden items-center gap-2">
                <div className="flex-1">
                  <CustomDropdown
                    value={activeFilter}
                    options={filterOptions}
                    onChange={setActiveFilter}
                    buttonClass={`${
                      activeFilter === 'queue' ? 'bg-red-600 border-red-600 text-white' :
                      activeFilter === 'scheduled' ? 'bg-blue-600 border-blue-600 text-white' :
                      activeFilter === 'new' ? 'bg-blue-600 border-blue-600 text-white' :
                      activeFilter === 'contacted' ? 'bg-purple-600 border-purple-600 text-white' :
                      activeFilter === 'interested' ? 'bg-yellow-600 border-yellow-600 text-white' :
                      activeFilter === 'proposal' ? 'bg-orange-600 border-orange-600 text-white' :
                      activeFilter === 'won' ? 'bg-green-600 border-green-600 text-white' :
                      activeFilter === 'lost' ? 'bg-red-700 border-red-700 text-white' :
                      'bg-blue-600 border-blue-600 text-white'
                    }`}
                  />
            </div>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`flex items-center justify-center p-2.5 border rounded-lg ${
                    hasActiveFilters
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </button>
                <div className="w-32">
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
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center justify-center p-2.5 border border-gray-600 text-white rounded-lg hover:bg-gray-700"
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

              {/* Mobile Layout: Line 2 - Search + Page Size + Select + New */}
              <div className="flex md:hidden items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0H15"></path>
                  </svg>
                </button>
                <button
                  onClick={enterBulkSelectMode}
                  className="flex items-center justify-center p-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </button>
                <button
                  onClick={createNewProspect}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>New</span>
                </button>
                {canImport && (
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center justify-center p-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Prospects Grid/List */}
          <div className={`flex gap-6 ${detailsViewMode === 'split' && showProspectDetails ? 'flex-row' : 'flex-col'}`}>
            {/* Prospects Section */}
            <div className={detailsViewMode === 'split' && showProspectDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading prospects...</p>
                </div>
              ) : paginatedProspects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-lg">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white mb-2">No prospects found</h3>
                    <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-6 ${getProspectGridClass()}`}>
                  {paginatedProspects.map((prospect) => (
                    <ProspectCard
                      key={prospect.id || prospect.name}
                      prospect={prospect}
                      showCheckbox={isBulkSelectMode}
                      isSelected={isSelected(prospect.name || prospect.id || '')}
                      isActive={showProspectDetails && (selectedProspect?.name === prospect.name || selectedProspect?.id === prospect.id)}
                      onClick={() => handleProspectCardClick(prospect)}
                      onToggleSelection={(id) => toggleProspectSelection(id)}
                      onLogCall={() => openCallLogModalForProspect(prospect)}
                      onScheduleActivity={() => openActivityModalForProspect(prospect)}
                      onChangeStatus={() => openStatusModalForProspect(prospect)}
                    />
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
                  onEmail={(p) => {
                    if (p.email_id) {
                      window.location.href = `mailto:${p.email_id}`;
                    }
                  }}
                  onAssign={openAssignModalForProspect}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Filter Modal */}
      {showFilterModal && (
        <BaseModal
          title="Advanced Filters"
          onClose={() => setShowFilterModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 border border-gray-600 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Territory</label>
              <CustomDropdown
                value={territoryFilter}
                options={formattedTerritoryOptions}
                onChange={setTerritoryFilter}
                buttonClass="bg-gray-700/80 border-gray-600/50 text-gray-200 w-full justify-between hover:bg-gray-600/80 hover:border-gray-500"
                showColorDot={false}
                showCheckmark={true}
                searchable={true}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Industry</label>
              <CustomDropdown
                value={industryFilter}
                options={formattedIndustryOptions}
                onChange={setIndustryFilter}
                buttonClass="bg-gray-700/80 border-gray-600/50 text-gray-200 w-full justify-between hover:bg-gray-600/80 hover:border-gray-500"
                showColorDot={false}
                showCheckmark={true}
                searchable={true}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Assigned To</label>
              <CustomDropdown
                value={ownerFilter}
                options={formattedOwnerOptions}
                onChange={setOwnerFilter}
                buttonClass="bg-gray-700/80 border-gray-600/50 text-gray-200 w-full justify-between hover:bg-gray-600/80 hover:border-gray-500"
                showColorDot={false}
                showCheckmark={true}
              />
            </div>
          </div>
        </BaseModal>
      )}

      {/* Status Modals */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowStatusModal(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Change Status ({selectedProspects.size} prospects)</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['new', 'contacted', 'interested', 'proposal', 'won', 'lost'].map((status) => {
                  const colors: Record<string, string> = {
                    new: 'bg-blue-600 hover:bg-blue-700',
                    contacted: 'bg-purple-600 hover:bg-purple-700',
                    interested: 'bg-yellow-600 hover:bg-yellow-700',
                    proposal: 'bg-orange-600 hover:bg-orange-700',
                    won: 'bg-green-600 hover:bg-green-700',
                    lost: 'bg-red-600 hover:bg-red-700',
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => bulkUpdateStatus(status)}
                      className={`p-4 ${colors[status]} text-white rounded-lg font-medium transition-colors capitalize`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSingleStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowSingleStatusModal(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Change Status</h3>
              <button onClick={() => setShowSingleStatusModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['new', 'contacted', 'interested', 'proposal', 'won', 'lost'].map((status) => {
                  const colors: Record<string, string> = {
                    new: 'bg-blue-600 hover:bg-blue-700',
                    contacted: 'bg-purple-600 hover:bg-purple-700',
                    interested: 'bg-yellow-600 hover:bg-yellow-700',
                    proposal: 'bg-orange-600 hover:bg-orange-700',
                    won: 'bg-green-600 hover:bg-green-700',
                    lost: 'bg-red-600 hover:bg-red-700',
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => updateSingleStatus(status)}
                      className={`p-4 ${colors[status]} text-white rounded-lg font-medium transition-colors capitalize`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">
                Assign Prospect{selectedProspects.size > 1 ? 's' : ''}:{' '}
                <span>{currentProspect?.company_name || currentProspect?.organization_name || `${selectedProspects.size} prospects`}</span>
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <input
                value={repSearchQuery}
                onChange={(e) => setRepSearchQuery(e.target.value)}
                type="search"
                placeholder="Search team members..."
                className="bg-gray-700 border border-gray-600 text-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400 mb-4"
              />
              
              {repsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner w-8 h-8 border-4 border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                  {filteredSalesReps.map((rep) => (
                    <li
                      key={rep.name || rep.id}
                      onClick={() => assignToRep(rep.full_name || rep.name)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                          {getInitials(rep.full_name || rep.name)}
                        </div>
                        <div className="ml-3">
                          <span className="text-sm font-medium text-white">{rep.full_name || rep.name}</span>
                          <span className="text-xs text-gray-400 block">{rep.email}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                  <li
                    onClick={() => assignToRep('Administrator')}
                    className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                      </svg>
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-400 italic">Unassign</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAddProspectModal && (
        <AddProspectModal
          show={showAddProspectModal}
          onClose={() => setShowAddProspectModal(false)}
          onSubmit={async (prospectData) => {
            console.log('New prospect submitted:', prospectData);
            await loadProspects();
            setShowAddProspectModal(false);
            if (prospectData && (prospectData.prospect_id || prospectData.id || prospectData.name)) {
              const newProspect = prospects.find(p => 
                (p.name || p.id) === (prospectData.prospect_id || prospectData.id || prospectData.name)
              );
              if (newProspect) {
                openProspectDetails(newProspect);
              }
            }
          }}
        />
      )}

      {/* Prospect Detail Modal (for popup mode) */}
      {showProspectDetails && detailsViewMode === 'popup' && selectedProspect && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 p-5 md:p-5 pt-[88px] md:pt-[88px] pb-5 md:pb-5 overflow-hidden" onClick={closeProspectDetails}>
          <div className="w-full max-w-4xl max-h-[calc(100vh-108px)] overflow-y-auto overflow-x-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <ProspectDetails
              prospect={selectedProspect}
              mode="popup"
              showCloseButton={true}
              showActivityHistory={true}
              onClose={closeProspectDetails}
              onCall={handleCall}
              onEmail={(p) => {
                if (p.email_id) {
                  window.location.href = `mailto:${p.email_id}`;
                }
              }}
              onAssign={openAssignModalForProspect}
            />
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <TallacActivityModal
          show={showActivityModal}
          activity={selectedActivity}
          leadInfo={currentProspectLeadInfo}
          onClose={closeActivityModal}
          onSave={saveActivity}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          show={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleImportSuccess}
          onShowResults={handleShowImportResults}
        />
      )}

      {/* Import Results Modal */}
      {showImportResults && (
        <ImportResultsModal
          show={showImportResults}
          results={importResultsData}
          onClose={() => setShowImportResults(false)}
          onRefresh={handleImportComplete}
        />
      )}

      <style jsx global>{`
        .app-layout {
          min-height: 100vh;
          background-color: #111827;
          font-family: 'Inter', sans-serif;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #111827;
        }

        ::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }

        /* Modal scrollbar */
        .modal-content-wrapper::-webkit-scrollbar,
        [class*="max-h-"]::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content-wrapper::-webkit-scrollbar-track,
        [class*="max-h-"]::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }

        .modal-content-wrapper::-webkit-scrollbar-thumb,
        [class*="max-h-"]::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 3px;
        }

        .modal-content-wrapper::-webkit-scrollbar-thumb:hover,
        [class*="max-h-"]::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }

        @media (max-width: 768px) {
          main {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
