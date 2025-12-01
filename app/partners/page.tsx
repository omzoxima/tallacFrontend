'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Tooltip from '@/components/Tooltip';
import PartnerCard from '@/components/PartnerCard';
import PartnerDetails from '@/components/PartnerDetails';
import AddPartnerModal from '@/components/AddPartnerModal';
import AddPartnerTerritoryModal from '@/components/AddPartnerTerritoryModal';
import AddTeamMemberModal from '@/components/AddTeamMemberModal';
import { X } from 'lucide-react';
import { showToast } from '@/components/Toast';
import { useUser } from '@/contexts/UserContext';

interface Partner {
  name: string;
  partner_name: string;
  partner_code?: string;
  partner_address?: string;
  partner_status?: string;
  territory_count?: number;
  team_count?: number;
  admin_count?: number;
  territories?: Array<any>;
  team_members?: Array<any>;
}

function PartnersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('partner_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pageSize, setPageSize] = useState(1000);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('split');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
  const [teamMemberPartner, setTeamMemberPartner] = useState<Partner | null>(null);
  const [showAddTerritoryModal, setShowAddTerritoryModal] = useState(false);
  const [territoryPartner, setTerritoryPartner] = useState<Partner | null>(null);

  const isCorporateAdmin = useMemo(() => {
    if (!user || !user.email || user.email === 'Guest') return false;
    if (user.role) {
      return user.role === 'Corporate Admin';
    }
    return false;
  }, [user]);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    const openPartner = searchParams?.get('openPartner');
    if (openPartner && partners.length > 0) {
      const partner = partners.find((p) => p.name === openPartner);
      if (partner) {
        openPartnerDetails(partner, true);
        setTimeout(() => {
          router.replace('/partners');
        }, 100);
      }
    }
  }, [searchParams, partners, router]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/partners`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setPartners(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load partners. Please try again.', 'error');
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = useMemo(() => {
    let result = [...partners];

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

  const sortedPartners = useMemo(() => {
    const filtered = [...filteredPartners];

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Partner];
      let bVal: any = b[sortColumn as keyof Partner];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [filteredPartners, sortColumn, sortDirection]);

  const paginatedPartners = useMemo(() => {
    return sortedPartners.slice(0, pageSize);
  }, [sortedPartners, pageSize]);

  const hasActiveFilters = statusFilter !== '';
  const activeFiltersCount = statusFilter ? 1 : 0;

  const openPartnerDetails = (partner: Partner, forceSplit = false) => {
    setSelectedPartner(partner);
    setShowPartnerDetails(true);
    if (forceSplit || window.innerWidth >= 768) {
      setDetailsViewMode('split');
    } else {
      setDetailsViewMode('popup');
    }
  };

  const closePartnerDetails = () => {
    setShowPartnerDetails(false);
    setSelectedPartner(null);
  };

  const clearAllFilters = () => {
    setStatusFilter('');
  };

  const refreshData = () => {
    fetchPartners();
    showToast('Refreshing partners...', 'info', 2000);
  };

  const openAddTeamMemberModal = (partner: Partner) => {
    setTeamMemberPartner(partner);
    setShowAddTeamMemberModal(true);
  };

  const handleTeamMemberAdded = async () => {
    const partnerName = teamMemberPartner?.name;
    await fetchPartners();
    // Update selectedPartner with fresh data
    if (partnerName) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${apiUrl}/api/partners/${partnerName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const updatedPartner = await response.json();
          setSelectedPartner(updatedPartner);
          showToast('Team member added successfully', 'success');
        }
      } catch {
        // Silently handle error fetching updated partner
      }
    }
    setShowAddTeamMemberModal(false);
    setTeamMemberPartner(null);
  };

  const openAddTerritoryModal = (partner: Partner) => {
    setTerritoryPartner(partner);
    setShowAddTerritoryModal(true);
  };

  const handleTerritoryAdded = async () => {
    const partnerName = territoryPartner?.name;
    await fetchPartners();
    // Update selectedPartner with fresh data
    if (partnerName) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${apiUrl}/api/partners/${partnerName}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const updatedPartner = await response.json();
          setSelectedPartner(updatedPartner);
          showToast('Territories added successfully', 'success');
        }
      } catch {
        // Silently handle error fetching updated partner
      }
    }
    setShowAddTerritoryModal(false);
    setTerritoryPartner(null);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  const getPartnerGridClass = () => {
    if (detailsViewMode === 'split' && showPartnerDetails) {
      return viewMode === 'card' ? 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';
    }
    return viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1';
  };

  return (
    <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search partners..."
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

                {/* Add Partner Button (Corporate Admin Only) */}
                {isCorporateAdmin && (
                  <Tooltip text="Add new partner">
                    <button
                      onClick={() => setShowAddPartnerModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 border border-green-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Partner
                    </button>
                  </Tooltip>
                )}
              </div>

              <div className="flex gap-3 items-center">
                {/* Pagination & Refresh Controls */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Number of items per page">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="w-20 bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2.5"
                    >
                      <option value={1000}>1000</option>
                      <option value={500}>500</option>
                      <option value={250}>250</option>
                      <option value={100}>100</option>
                    </select>
                  </Tooltip>
                  <Tooltip text="Refresh data">
                    <button
                      onClick={refreshData}
                      className="flex items-center justify-center p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2A8.001 8.001 0 0019.418 15m0 0H15"></path>
                      </svg>
                    </button>
                  </Tooltip>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Sort partners by">
                    <select
                      value={sortColumn}
                      onChange={(e) => setSortColumn(e.target.value)}
                      className="w-36 bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-400 dark:text-gray-400 text-gray-700 text-sm rounded-lg px-3 py-2.5"
                    >
                      <option value="partner_name">Partner Name</option>
                      <option value="partner_code">Partner Code</option>
                      <option value="territory_count">Territory Count</option>
                      <option value="team_count">Team Count</option>
                    </select>
                  </Tooltip>
                  <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                    <button
                      onClick={toggleSortDirection}
                      className="flex items-center justify-center p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
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

                {/* Card/List Toggle */}
                <div className="hidden md:flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
                  <Tooltip text={viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View'}>
                    <button
                      onClick={toggleLayoutMode}
                      className="flex items-center justify-center p-2.5 bg-gray-700 dark:bg-gray-700 bg-gray-100 hover:bg-gray-600 dark:hover:bg-gray-600 text-white dark:text-white text-gray-900"
                    >
                      {viewMode === 'list' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search partners..."
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`flex items-center justify-center p-2.5 border rounded-lg flex-shrink-0 ${
                    hasActiveFilters
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </button>
                {isCorporateAdmin && (
                  <button
                    onClick={() => setShowAddPartnerModal(true)}
                    className="flex items-center justify-center p-2.5 bg-green-600 hover:bg-green-700 border border-green-600 rounded-lg text-white flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </button>
                )}
                <select
                  value={sortColumn}
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 text-gray-400 text-sm rounded-lg px-3 py-2.5"
                >
                  <option value="partner_name">Partner Name</option>
                  <option value="partner_code">Partner Code</option>
                  <option value="territory_count">Territory Count</option>
                  <option value="team_count">Team Count</option>
                </select>
                <button
                  onClick={toggleSortDirection}
                  className="flex items-center justify-center p-2.5 border border-gray-600 text-white rounded-lg hover:bg-gray-700 flex-shrink-0"
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
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 font-medium">Active Filters:</span>
              {statusFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('')} className="text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white dark:hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          {/* Partners Grid/List */}
          <div className={`flex gap-6 ${detailsViewMode === 'split' && showPartnerDetails ? 'flex-row' : 'flex-col'}`}>
            <div className={detailsViewMode === 'split' && showPartnerDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 dark:text-gray-400 text-gray-600">Loading partners...</p>
                </div>
              ) : paginatedPartners.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <p className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">No partners found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className={viewMode === 'card' ? `grid ${getPartnerGridClass()} gap-4` : 'space-y-2'}>
                  {paginatedPartners.map((partner) => (
                    <PartnerCard
                      key={partner.name}
                      partner={partner}
                      isSelected={selectedPartner?.name === partner.name && showPartnerDetails}
                      viewMode={viewMode}
                      onClick={() => openPartnerDetails(partner)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details Panel (Split View) */}
            {detailsViewMode === 'split' && showPartnerDetails && selectedPartner && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
                <PartnerDetails
                  partner={selectedPartner}
                  mode="split"
                  showCloseButton={true}
                  onClose={closePartnerDetails}
                  onAddTeamMember={() => {
                    if (selectedPartner) {
                      openAddTeamMemberModal(selectedPartner);
                    }
                  }}
                  onAddTerritory={() => {
                    if (selectedPartner) {
                      openAddTerritoryModal(selectedPartner);
                    }
                  }}
                  onOpenTerritory={(territory) => {
                    router.push(`/territories?openTerritory=${encodeURIComponent(territory.territory_name)}`);
                  }}
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Advanced Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={clearAllFilters} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                Clear
              </button>
              <button onClick={() => setShowFilterModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Details Modal (Mobile) */}
      {detailsViewMode === 'popup' && showPartnerDetails && selectedPartner && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closePartnerDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <PartnerDetails
              partner={selectedPartner}
              mode="popup"
              showCloseButton={true}
              onClose={closePartnerDetails}
              onAddTeamMember={() => {
                if (selectedPartner) {
                  openAddTeamMemberModal(selectedPartner);
                }
              }}
              onAddTerritory={() => {
                if (selectedPartner) {
                  openAddTerritoryModal(selectedPartner);
                }
              }}
              onOpenTerritory={(territory) => {
                router.push(`/territories?openTerritory=${encodeURIComponent(territory.territory_name)}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddPartnerModal && (
        <AddPartnerModal
          onClose={() => setShowAddPartnerModal(false)}
          onSuccess={() => {
            showToast('Partner created successfully!', 'success');
            fetchPartners();
            setShowAddPartnerModal(false);
          }}
        />
      )}
      {showAddTeamMemberModal && teamMemberPartner && (
        <AddTeamMemberModal
          partnerId={teamMemberPartner.name}
          partnerName={teamMemberPartner.partner_name}
          partnerTerritories={teamMemberPartner.territories}
          onClose={() => {
            setShowAddTeamMemberModal(false);
            setTeamMemberPartner(null);
          }}
          onSuccess={handleTeamMemberAdded}
        />
      )}
      {showAddTerritoryModal && territoryPartner && (
        <AddPartnerTerritoryModal
          partnerId={territoryPartner.name}
          partnerName={territoryPartner.partner_name}
          existingTerritories={territoryPartner.territories}
          onClose={() => {
            setShowAddTerritoryModal(false);
            setTerritoryPartner(null);
          }}
          onSuccess={handleTerritoryAdded}
        />
      )}
    </div>
  );
}

export default function PartnersPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <PartnersPageContent />
    </Suspense>
  );
}

