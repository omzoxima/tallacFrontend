'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import TallacPartnerCard from '@/components/TallacPartnerCard';
import TallacPartnerDetails from '@/components/TallacPartnerDetails';
import CustomDropdown from '@/components/CustomDropdown';
import Tooltip from '@/components/Tooltip';
import FilterModal from '@/components/FilterModal';
import AddPartnerModal from '@/components/AddPartnerModal';
import AddTerritoryToPartnerModal from '@/components/AddTerritoryToPartnerModal';
import AddTerritoryAdminModal from '@/components/AddTerritoryAdminModal';
import AssignUserToPartnerModal from '@/components/AssignUserToPartnerModal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  List,
  Grid3x3,
  Plus,
  Filter,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Partner {
  id?: string;
  name?: string;
  partner_name?: string;
  partner_code?: string;
  partner_status?: string;
  partner_address?: string;
  partner_city?: string;
  partner_state?: string;
  territory_count?: number;
  admin_count?: number;
  team_count?: number;
  territories?: Array<any>;
  team_members?: Array<any>;
}

export default function PartnersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, canViewPartnersAndUsers } = useAuth();

  // State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('partner_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pageSize, setPageSize] = useState(1000);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [partnerModalMode, setPartnerModalMode] = useState<'add' | 'edit'>('add');
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'split' | 'popup'>('split');
  const [showAddTerritoryModal, setShowAddTerritoryModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAssignUserModal, setShowAssignUserModal] = useState(false);
  const [newlyCreatedPartner, setNewlyCreatedPartner] = useState<{
    partner?: string;
    partner_name?: string;
    territories?: Array<any>;
  } | null>(null);

  // Check if user is Corporate Admin
  const isCorporateAdmin = useMemo(() => {
    if (!user || !user.email || user.email === 'Guest') return false;
    if (
      user.tallac_role &&
      ['Corporate Admin', 'Administrator', 'System Manager'].includes(user.tallac_role)
    ) {
      return true;
    }
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some((role) =>
        ['Corporate Admin', 'Administrator', 'System Manager'].includes(role)
      );
    }
    return false;
  }, [user]);

  // Load partners
  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading partners...');
      const result = await api.getPartners({});
      console.log('Partners API response:', result);
      console.log('Response success:', result.success);
      console.log('Response data:', result.data);
      console.log('Is data array?', Array.isArray(result.data));
      
      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('Setting partners:', result.data.length);
        setPartners(result.data);
      } else if (result.success && Array.isArray(result)) {
        // Fallback: if result itself is an array
        console.log('Setting partners (fallback):', result.length);
        setPartners(result);
      } else {
        console.log('Partners API returned success: false or no data');
        setPartners([]);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
      setPartners([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
        setDetailsViewMode('popup');
      } else {
        setDetailsViewMode('split');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check for query parameter to open partner
    const openPartner = searchParams.get('openPartner');
    if (openPartner && partners.length > 0) {
      const partner = partners.find((p) => (p.name || p.partner_name || p.id) === openPartner);
      if (partner) {
        handlePartnerCardClick(partner);
        router.replace('/partners');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, partners.length]); // Only depend on partners.length to avoid infinite loop

  // Sort options
  const sortOptions = [
    { value: 'partner_name', label: 'Partner Name', color: '#6b7280' },
    { value: 'partner_code', label: 'Partner Code', color: '#6b7280' },
    { value: 'territory_count', label: 'Territory Count', color: '#6b7280' },
    { value: 'team_count', label: 'Team Count', color: '#6b7280' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses', color: '#6b7280' },
    { value: 'Active', label: 'Active', color: '#10b981' },
    { value: 'Pending', label: 'Pending', color: '#f59e0b' },
    { value: 'Inactive', label: 'Inactive', color: '#ef4444' },
  ];

  const pageSizeOptions = [
    { value: '1000', label: '1000', color: '#6b7280' },
    { value: '500', label: '500', color: '#6b7280' },
    { value: '250', label: '250', color: '#6b7280' },
    { value: '100', label: '100', color: '#6b7280' },
  ];

  // Filtered partners
  const filteredPartners = useMemo(() => {
    let result = partners;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.partner_name || '').toLowerCase().includes(query) ||
          (p.partner_code || '').toLowerCase().includes(query) ||
          (p.partner_address || '').toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter((p) => p.partner_status === statusFilter);
    }

    return result;
  }, [partners, searchQuery, statusFilter]);

  // Sorted partners
  const sortedPartners = useMemo(() => {
    const filtered = [...filteredPartners];

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Partner];
      let bVal: any = b[sortColumn as keyof Partner];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [filteredPartners, sortColumn, sortDirection]);

  // Paginated partners
  const paginatedPartners = useMemo(() => {
    return sortedPartners.slice(0, pageSize);
  }, [sortedPartners, pageSize]);

  const hasActiveFilters = useMemo(() => {
    return statusFilter !== '';
  }, [statusFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    return count;
  }, [statusFilter]);

  const refreshData = async () => {
    await loadPartners();
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  const getViewModeTitle = () => {
    return viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View';
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setShowFilterModal(false);
  };

  const handlePartnerCardClick = (partner: Partner, forceSplit = false) => {
    setSelectedPartner(partner);
    setShowPartnerDetails(true);
    setDetailsViewMode(window.innerWidth >= 768 || forceSplit ? 'split' : 'popup');
  };

  const closePartnerDetails = () => {
    setShowPartnerDetails(false);
    setSelectedPartner(null);
  };

  const handleOpenTerritory = (territory: any) => {
    router.push({
      pathname: '/territories',
      query: { openTerritory: territory.territory_name || territory.name },
    });
  };

  const handlePartnerSaved = async (data: any) => {
    if (partnerModalMode === 'edit') {
      const editedPartnerName = editingPartner?.name;
      const selectedPartnerName = selectedPartner?.name;

      setShowAddPartnerModal(false);
      setPartnerModalMode('add');
      setEditingPartner(null);
      await refreshData();

      if (selectedPartnerName && selectedPartnerName === editedPartnerName) {
        const updatedPartner = partners.find((p) => p.name === selectedPartnerName);
        if (updatedPartner) {
          setSelectedPartner(updatedPartner);
        }
      }
      return;
    }

    setShowAddPartnerModal(false);
    setPartnerModalMode('add');
    setEditingPartner(null);

    // If full partner data is returned, use it directly
    if (data.data) {
      // Update partners list with new partner
      setPartners(prev => {
        const exists = prev.find(p => (p.id || p.name) === (data.data.id || data.data.name));
        if (exists) {
          return prev.map(p => (p.id || p.name) === (data.data.id || data.data.name) ? data.data : p);
        }
        return [...prev, data.data];
      });
      
      // If partner details are open, update selected partner
      if (selectedPartner && (selectedPartner.id || selectedPartner.name) === (data.data.id || data.data.name)) {
        setSelectedPartner(data.data);
      }
    }

    setNewlyCreatedPartner({
      partner: data.partner || data.data?.id || data.data?.name || data.name,
      partner_name: data.partner_name || data.data?.partner_name || 'Partner',
      territories: data.data?.territories || [],
    });

    await refreshData();

    setTimeout(() => {
      setShowAddTerritoryModal(true);
    }, 500);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerModalMode('edit');
    setShowAddPartnerModal(true);
  };

  const handleTerritoriesAdded = async (data: any) => {
    setShowAddTerritoryModal(false);
    await refreshData();

    const updatedPartner = partners.find((p) => p.name === newlyCreatedPartner?.partner);
    if (updatedPartner && newlyCreatedPartner) {
      setNewlyCreatedPartner({ ...newlyCreatedPartner, territories: updatedPartner.territories || [] });
    }

    setTimeout(() => {
      setShowAddAdminModal(true);
    }, 500);
  };

  const handleAdminCreated = async (data: any) => {
    setShowAddAdminModal(false);
    
    // If full partner data is returned, use it directly
    if (data.data) {
      // Update partners list with updated partner
      setPartners(prev => {
        const exists = prev.find(p => (p.id || p.name) === (data.data.id || data.data.name));
        if (exists) {
          return prev.map(p => (p.id || p.name) === (data.data.id || data.data.name) ? data.data : p);
        }
        return [...prev, data.data];
      });
      
      // If partner details are open, update selected partner
      if (selectedPartner && (selectedPartner.id || selectedPartner.name) === (data.data.id || data.data.name)) {
        setSelectedPartner(data.data);
        setShowPartnerDetails(true);
      } else if (newlyCreatedPartner?.partner) {
        // Find and open the partner
        const partner = partners.find((p) => (p.id || p.name) === newlyCreatedPartner.partner) || data.data;
        if (partner) {
          handlePartnerCardClick(partner);
        }
      }
    } else {
      // Fallback to refresh if no data returned
    await refreshData();

    if (newlyCreatedPartner?.partner) {
        const partner = partners.find((p) => (p.id || p.name) === newlyCreatedPartner.partner);
      if (partner) {
        handlePartnerCardClick(partner);
        }
      }
    }

    setNewlyCreatedPartner(null);
  };

  const handleAddTerritoryFromDetails = () => {
    if (!selectedPartner) return;
    setNewlyCreatedPartner({
      partner: selectedPartner.name,
      partner_name: selectedPartner.partner_name,
      territories: selectedPartner.territories || [],
    });
    setShowAddTerritoryModal(true);
  };

  const handleAddTeamMemberFromDetails = () => {
    if (!selectedPartner) return;
    setNewlyCreatedPartner({
      partner: selectedPartner.name,
      partner_name: selectedPartner.partner_name,
      territories: selectedPartner.territories || [],
    });
    setShowAddAdminModal(true);
  };

  const handleAssignUserSuccess = async (data: any) => {
    setShowAssignUserModal(false);
    
    // If full partner data is returned, use it directly
    if (data?.data) {
      // Update partners list with updated partner
      setPartners(prev => {
        const exists = prev.find(p => (p.id || p.name) === (data.data.id || data.data.name));
        if (exists) {
          return prev.map(p => (p.id || p.name) === (data.data.id || data.data.name) ? data.data : p);
        }
        return [...prev, data.data];
      });
      
      // Update selected partner if details are open
      if (selectedPartner && (selectedPartner.id || selectedPartner.name) === (data.data.id || data.data.name)) {
        setSelectedPartner(data.data);
        setShowPartnerDetails(true);
      }
    } else {
      // Fallback to refresh if no data returned
    await refreshData();
    if (selectedPartner) {
        const updatedPartner = partners.find((p) => (p.id || p.name) === (selectedPartner.id || selectedPartner.name));
      if (updatedPartner) {
        setSelectedPartner(updatedPartner);
        }
      }
    }
  };

  if (!canViewPartnersAndUsers) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-300">
        <AppHeader />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Search, Filter, Sort Bar */}
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
                    placeholder="Search partners..."
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

                {/* Add Partner Button */}
                {isCorporateAdmin && (
                  <Tooltip text="Add new partner">
                    <button
                      onClick={() => {
                        setEditingPartner(null);
                        setPartnerModalMode('add');
                        setShowAddPartnerModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 border border-green-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap h-10"
                    >
                      <Plus className="w-4 h-4" />
                      Add Partner
                    </button>
                  </Tooltip>
                )}
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
                  <Tooltip text="Sort partners by">
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
                      {sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </Tooltip>
                </div>

                {/* Card/List Toggle */}
                <div className="hidden md:flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
                  <Tooltip text={getViewModeTitle()}>
                    <button
                      onClick={toggleLayoutMode}
                      className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      {viewMode === 'list' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
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
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center justify-center p-2.5 border rounded-lg flex-shrink-0 ${
                  hasActiveFilters
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              {isCorporateAdmin && (
                <button
                  onClick={() => {
                    setEditingPartner(null);
                    setPartnerModalMode('add');
                    setShowAddPartnerModal(true);
                  }}
                  className="flex items-center justify-center p-2.5 bg-green-600 hover:bg-green-700 border border-green-600 rounded-lg text-white flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
              <div className="w-36 min-w-0">
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
                className="flex items-center justify-center p-2.5 border border-gray-600 text-white rounded-lg hover:bg-gray-700 flex-shrink-0"
              >
                {sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 font-medium">Active Filters:</span>
              {statusFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          {/* Partners Grid/List and Detail Panel */}
          <div
            className={`flex gap-6 ${
              detailsViewMode === 'split' && showPartnerDetails ? 'flex-row' : 'flex-col'
            }`}
          >
            {/* Partners Section */}
            <div className={detailsViewMode === 'split' && showPartnerDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading partners...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-lg">
                  <AlertTriangle className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No partners found</h3>
                  <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    viewMode === 'card'
                      ? detailsViewMode === 'split' && showPartnerDetails
                        ? 'grid-cols-1 lg:grid-cols-2'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {paginatedPartners.map((partner) => (
                    <div key={partner.id || partner.name} onClick={() => handlePartnerCardClick(partner)}>
                      <TallacPartnerCard
                        partner={partner}
                        isSelected={selectedPartner?.id === partner.id && showPartnerDetails}
                        viewMode={viewMode}
                        onClick={() => {}}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Panel (Split View) */}
            {detailsViewMode === 'split' && showPartnerDetails && selectedPartner && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
                <TallacPartnerDetails
                  partner={selectedPartner}
                  mode="split"
                  showCloseButton={true}
                  isCorporateAdmin={isCorporateAdmin}
                  onClose={closePartnerDetails}
                  onOpenTerritory={handleOpenTerritory}
                  onAddTerritory={handleAddTerritoryFromDetails}
                  onAddTeamMember={() => setShowAssignUserModal(true)}
                  onEditPartner={handleEditPartner}
                  onRefresh={refreshData}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Add/Edit Partner Modal */}
      {showAddPartnerModal && (
        <AddPartnerModal
          mode={partnerModalMode}
          partnerData={editingPartner || undefined}
          onClose={() => {
            setShowAddPartnerModal(false);
            setPartnerModalMode('add');
            setEditingPartner(null);
          }}
          onSuccess={handlePartnerSaved}
        />
      )}

      {/* Add Territory to Partner Modal */}
      {showAddTerritoryModal && newlyCreatedPartner && (
        <AddTerritoryToPartnerModal
          partnerId={newlyCreatedPartner.partner || ''}
          partnerName={newlyCreatedPartner.partner_name || 'Partner'}
          existingTerritories={newlyCreatedPartner.territories || []}
          onClose={() => setShowAddTerritoryModal(false)}
          onSuccess={handleTerritoriesAdded}
        />
      )}

      {/* Add Territory Admin Modal */}
      {showAddAdminModal && newlyCreatedPartner && (
        <AddTerritoryAdminModal
          partnerId={newlyCreatedPartner.partner || null}
          partnerName={newlyCreatedPartner.partner_name || null}
          partnerTerritories={newlyCreatedPartner.territories || []}
          editUser={null}
          onClose={() => setShowAddAdminModal(false)}
          onSuccess={handleAdminCreated}
        />
      )}

      {/* Assign User to Partner Modal */}
      {showAssignUserModal && selectedPartner && (
        <AssignUserToPartnerModal
          partnerId={selectedPartner.name || selectedPartner.id || ''}
          onClose={() => setShowAssignUserModal(false)}
          onSuccess={handleAssignUserSuccess}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        show={showFilterModal}
        title="Advanced Filters"
        onClose={() => setShowFilterModal(false)}
        onClear={clearAllFilters}
        onApply={() => setShowFilterModal(false)}
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <CustomDropdown
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            buttonClass="bg-gray-700 border-gray-600 text-gray-300"
            showColorDot={true}
            showCheckmark={true}
          />
        </div>
      </FilterModal>

      {/* Partner Details Modal (Mobile) */}
      {detailsViewMode === 'popup' && showPartnerDetails && selectedPartner && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
          onClick={closePartnerDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <TallacPartnerDetails
              partner={selectedPartner}
              mode="popup"
              showCloseButton={true}
              isCorporateAdmin={isCorporateAdmin}
              onClose={closePartnerDetails}
              onOpenTerritory={handleOpenTerritory}
              onAddTerritory={handleAddTerritoryFromDetails}
              onAddTeamMember={() => setShowAssignUserModal(true)}
              onEditPartner={handleEditPartner}
              onRefresh={refreshData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

