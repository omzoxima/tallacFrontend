'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Tooltip from '@/components/Tooltip';
import TerritoryCard from '@/components/TerritoryCard';
import TerritoryDetails from '@/components/TerritoryDetails';
import AddTerritoryModal from '@/components/AddTerritoryModal';
import { X } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface Territory {
  id?: string;
  name: string;
  territory_name: string;
  territory_code?: string;
  territory_dba?: string;
  territory_region?: string;
  territory_state?: string;
  territory_status?: string;
  zipcode_count?: number;
  zip_codes?: Array<any>;
  zipcodes?: Array<any>;
  partners?: Array<{
    name: string;
    partner_name?: string;
    address?: string;
    is_primary?: boolean;
  }>;
}

function TerritoriesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pageSize, setPageSize] = useState(1000);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [showTerritoryDetails, setShowTerritoryDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('split');
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [showAddTerritoryModal, setShowAddTerritoryModal] = useState(false);
  const [showEditTerritoryModal, setShowEditTerritoryModal] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);

  useEffect(() => {
    loadTerritories();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const openTerritory = searchParams?.get('openTerritory');
    if (openTerritory && territories.length > 0) {
      const territory = territories.find((t) => t.territory_name === openTerritory);
      if (territory) {
        handleTerritoryCardClick(territory);
        // Clear query parameter
        setTimeout(() => {
          router.replace('/territories');
        }, 100);
      }
    }
  }, [searchParams, territories, router]);

  const loadTerritories = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/territories?limit=${pageSize}`, {
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
      // Map API response to match frontend interface
      const mappedTerritories = Array.isArray(data) ? data.map((t: any) => ({
        ...t,
        name: t.name || t.id,
        territory_dba: t.territory_dba || t.doing_business_as || '',
        territory_status: t.territory_status || t.status || 'Active',
        territory_code: t.territory_code || t.name?.replace('TERR-', '') || '',
        territory_region: t.territory_region || '',
        territory_state: t.territory_state || '',
        zipcode_count: t.zipcode_count || (t.zip_codes?.length || 0),
        partners: t.partners || [],
        zip_codes: t.zip_codes || [],
        zipcodes: t.zip_codes || []
      })) : [];
      setTerritories(mappedTerritories);
    } catch {
      showToast('Failed to load territories. Please try again.', 'error');
      setTerritories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/territories/filters`);
      if (response.ok) {
        const data = await response.json();
        setAvailableRegions(data.regions || []);
        setAvailableStates(data.states || []);
      }
    } catch {
      // Silently fail filter options loading
    }
  };

  const regions = useMemo(() => {
    if (availableRegions.length > 0) return availableRegions;
    return [
      ...new Set(
        territories
          .map((t) => t.territory_region)
          .filter((value): value is string => Boolean(value))
      ),
    ].sort();
  }, [availableRegions, territories]);

  const states = useMemo(() => {
    if (availableStates.length > 0) return availableStates;
    return [
      ...new Set(
        territories
          .map((t) => t.territory_state)
          .filter((value): value is string => Boolean(value))
      ),
    ].sort();
  }, [availableStates, territories]);

  const filteredTerritories = useMemo(() => {
    let filtered = [...territories];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.territory_name || '').toLowerCase().includes(query) ||
          (t.territory_dba || '').toLowerCase().includes(query) ||
          (t.territory_code || '').toLowerCase().includes(query) ||
          (t.territory_region || '').toLowerCase().includes(query) ||
          (t.territory_state || '').toLowerCase().includes(query)
      );
    }

    if (regionFilter) {
      filtered = filtered.filter((t) => t.territory_region === regionFilter);
    }

    if (stateFilter) {
      filtered = filtered.filter((t) => t.territory_state === stateFilter);
    }

    return filtered;
  }, [territories, searchQuery, regionFilter, stateFilter]);

  const sortedTerritories = useMemo(() => {
    const filtered = [...filteredTerritories];

    filtered.sort((a, b) => {
      let compareA: any, compareB: any;

      switch (sortColumn) {
        case 'name':
          compareA = (a.territory_name || '').toLowerCase();
          compareB = (b.territory_name || '').toLowerCase();
          break;
        case 'code':
          compareA = (a.territory_code || '').toLowerCase();
          compareB = (b.territory_code || '').toLowerCase();
          break;
        case 'region':
          compareA = (a.territory_region || '').toLowerCase();
          compareB = (b.territory_region || '').toLowerCase();
          break;
        case 'state':
          compareA = (a.territory_state || '').toLowerCase();
          compareB = (b.territory_state || '').toLowerCase();
          break;
        case 'status':
          compareA = (a.territory_status || '').toLowerCase();
          compareB = (b.territory_status || '').toLowerCase();
          break;
        default:
          compareA = (a.territory_name || '').toLowerCase();
          compareB = (b.territory_name || '').toLowerCase();
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredTerritories, sortColumn, sortDirection]);

  const paginatedTerritories = useMemo(() => {
    return sortedTerritories.slice(0, pageSize);
  }, [sortedTerritories, pageSize]);

  const hasActiveFilters = regionFilter || stateFilter;
  const activeFiltersCount = (regionFilter ? 1 : 0) + (stateFilter ? 1 : 0);

  const handleTerritoryCardClick = (territory: Territory) => {
    // Toggle selection - if same territory is clicked, close details
    const territoryKey = territory.name || territory.id;
    const selectedKey = selectedTerritory?.name || selectedTerritory?.id;
    
    if (selectedKey && selectedKey === territoryKey && showTerritoryDetails) {
      setShowTerritoryDetails(false);
      setSelectedTerritory(null);
    } else {
      setSelectedTerritory(territory);
      setShowTerritoryDetails(true);
      setDetailsViewMode(window.innerWidth >= 768 ? 'split' : 'popup');
    }
  };

  const closeTerritoryDetails = () => {
    setShowTerritoryDetails(false);
    setSelectedTerritory(null);
  };

  const clearAllFilters = () => {
    setRegionFilter('');
    setStateFilter('');
    setShowFilterModal(false);
  };

  const refreshData = () => {
    loadTerritories();
    showToast('Refreshing territories...', 'info', 2000);
  };

  const handleTerritoryCreated = () => {
    setShowAddTerritoryModal(false);
    loadTerritories();
    showToast('Territory created successfully!', 'success');
  };

  const handleTerritoryUpdated = () => {
    setShowEditTerritoryModal(false);
    setEditingTerritory(null);
    loadTerritories();
    showToast('Territory updated successfully!', 'success');
  };

  const openEditTerritory = (territory: Territory) => {
    setEditingTerritory(territory);
    setShowEditTerritoryModal(true);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  const getTerritoryGridClass = () => {
    if (detailsViewMode === 'split' && showTerritoryDetails) {
      return viewMode === 'card' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1';
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
                    placeholder="Search territories, regions, states..."
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
                <Tooltip text="Add new territory">
                  <button
                    onClick={() => setShowAddTerritoryModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-full shadow-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6"></path>
                    </svg>
                    Add Territory
                  </button>
                </Tooltip>
                {/* Pagination & Refresh Controls */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Number of items per page">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="w-20 bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-300 dark:text-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2.5"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={1000}>1000</option>
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
                  <Tooltip text="Sort territories by">
                    <select
                      value={sortColumn}
                      onChange={(e) => setSortColumn(e.target.value)}
                      className="w-36 bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-400 dark:text-gray-400 text-gray-700 text-sm rounded-lg px-3 py-2.5"
                    >
                      <option value="name">Territory Name</option>
                      <option value="code">Territory Code</option>
                      <option value="region">Region</option>
                      <option value="state">State</option>
                      <option value="status">Status</option>
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
                      className="flex items-center justify-center p-2.5 bg-gray-700 hover:bg-gray-600 text-white"
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
            <div className="flex md:hidden items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013l-2.5 1a2.25 2.25 0 01-2.316-2.013v-2.927a2.25 2.25 0 00-.659-1.591L2.659 7.409A2.25 2.25 0 012 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
              </button>
              <select
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value)}
                className="w-36 bg-gray-800 border border-gray-600 text-gray-400 text-sm rounded-lg px-3 py-2.5"
              >
                <option value="name">Territory Name</option>
                <option value="code">Territory Code</option>
                <option value="region">Region</option>
                <option value="state">State</option>
                <option value="status">Status</option>
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
              <button
                onClick={() => setShowAddTerritoryModal(true)}
                className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 font-medium">Active Filters:</span>
              {regionFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Region: {regionFilter}</span>
                  <button onClick={() => setRegionFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {stateFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>State: {stateFilter}</span>
                  <button onClick={() => setStateFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          {/* Territories Grid/List */}
          <div className={`flex gap-6 ${detailsViewMode === 'split' && showTerritoryDetails ? 'flex-row' : 'flex-col'}`}>
            <div className={detailsViewMode === 'split' && showTerritoryDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading territories...</p>
                </div>
              ) : paginatedTerritories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-lg">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white mb-2">No territories found</h3>
                    <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                  </div>
                </div>
              ) : (
                <div className={`grid ${getTerritoryGridClass()} gap-6`}>
                  {paginatedTerritories.map((territory) => {
                    const territoryKey = territory.name || territory.id;
                    const isSelected = showTerritoryDetails && (
                      (selectedTerritory?.name === territory.name) ||
                      (selectedTerritory?.id === territory.id) ||
                      (selectedTerritory?.name === territoryKey)
                    );
                    return (
                      <TerritoryCard
                        key={territoryKey}
                        territory={territory}
                        isSelected={isSelected}
                        viewMode={viewMode}
                        onClick={() => handleTerritoryCardClick(territory)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details Panel (Split View) */}
            {detailsViewMode === 'split' && showTerritoryDetails && selectedTerritory && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
                <TerritoryDetails
                  territory={selectedTerritory}
                  mode="split"
                  showCloseButton={true}
                  onClose={closeTerritoryDetails}
                  onOpenPartner={(partner) => {
                    // TODO: Handle partner click - could navigate to partners page or open partner details
                    showToast(`Opening partner: ${partner.partner_name || partner.name}`, 'info');
                  }}
                  onViewProspects={(territory) => {
                    const name = territory.territory_name || territory.name;
                    router.push(`/prospects?territory=${encodeURIComponent(name)}`);
                  }}
                  onViewActivities={(territory) => {
                    const name = territory.territory_name || territory.name;
                    router.push(`/activities?territory=${encodeURIComponent(name)}`);
                  }}
                  onEditTerritory={openEditTerritory}
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Regions</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Territory Modal */}
      {showAddTerritoryModal && (
        <AddTerritoryModal
          regions={regions}
          states={states}
          onClose={() => setShowAddTerritoryModal(false)}
          onSuccess={handleTerritoryCreated}
        />
      )}

      {/* Edit Territory Modal */}
      {showEditTerritoryModal && editingTerritory && (
        <AddTerritoryModal
          mode="edit"
          initialTerritory={editingTerritory}
          regions={regions}
          states={states}
          onClose={() => {
            setShowEditTerritoryModal(false);
            setEditingTerritory(null);
          }}
          onSuccess={handleTerritoryUpdated}
        />
      )}

      {/* Territory Details Modal (Mobile) */}
      {detailsViewMode === 'popup' && showTerritoryDetails && selectedTerritory && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeTerritoryDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <TerritoryDetails
              territory={selectedTerritory}
              mode="popup"
              showCloseButton={true}
              onClose={closeTerritoryDetails}
              onOpenPartner={(partner) => {
                // TODO: Handle partner click
                showToast(`Opening partner: ${partner.partner_name || partner.name}`, 'info');
              }}
              onViewProspects={(territory) => {
                const name = territory.territory_name || territory.name;
                router.push(`/prospects?territory=${encodeURIComponent(name)}`);
              }}
              onViewActivities={(territory) => {
                const name = territory.territory_name || territory.name;
                router.push(`/activities?territory=${encodeURIComponent(name)}`);
              }}
              onEditTerritory={openEditTerritory}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TerritoriesPage() {
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
      <TerritoriesPageContent />
    </Suspense>
  );
}

