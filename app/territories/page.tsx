'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import TallacTerritoryCard from '@/components/TallacTerritoryCard';
import TallacTerritoryDetails from '@/components/TallacTerritoryDetails';
import CustomDropdown from '@/components/CustomDropdown';
import Tooltip from '@/components/Tooltip';
import FilterModal from '@/components/FilterModal';
import AddTerritoryModal from '@/components/AddTerritoryModal';
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

interface Territory {
  id?: string;
  name?: string;
  territory_name?: string;
  territory_code?: string;
  territory_dba?: string;
  territory_state?: string;
  territory_region?: string;
  territory_status?: string;
  zipcode_count?: number;
  partners?: Array<{
    id?: string;
    name?: string;
    partner_name?: string;
    is_primary?: boolean;
    address?: string;
  }>;
}

export default function TerritoriesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [pageSize, setPageSize] = useState(1000);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showAddTerritoryModal, setShowAddTerritoryModal] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [showTerritoryDetails, setShowTerritoryDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'split' | 'popup'>('split');
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  // Check if user is Corporate Admin
  const isCorporateAdmin = useMemo(() => {
    if (!user || !user.email || user.email === 'Guest') {
      return false;
    }
    if (user.tallac_role && ['Corporate Admin', 'Administrator', 'System Manager'].includes(user.tallac_role)) {
      return true;
    }
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some((role) =>
        ['Corporate Admin', 'Administrator', 'System Manager'].includes(role)
      );
    }
    return false;
  }, [user]);

  // Load territories
  const loadTerritories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getTerritories({});
      if (result.success && result.data) {
        setTerritories(result.data);
      } else {
        setTerritories([]);
      }
    } catch (error) {
      console.error('Error loading territories:', error);
      setTerritories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const result = await api.getTerritoryFilters();
      if (result.success && result.data) {
        setAvailableRegions(result.data.regions || []);
        setAvailableStates(result.data.states || []);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, []);

  useEffect(() => {
    loadTerritories();
    loadFilterOptions();

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
        setDetailsViewMode('popup');
      } else {
        setViewMode('list');
        setDetailsViewMode('split');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [loadTerritories, loadFilterOptions]);

  // Extract unique regions and states
  const regions = useMemo(() => {
    if (availableRegions.length > 0) return availableRegions;
    return Array.from(new Set(territories.map((t) => t.territory_region).filter(Boolean))).sort() as string[];
  }, [availableRegions, territories]);

  const states = useMemo(() => {
    if (availableStates.length > 0) return availableStates;
    return Array.from(new Set(territories.map((t) => t.territory_state).filter(Boolean))).sort() as string[];
  }, [availableStates, territories]);

  // Region and State dropdown options
  const regionOptions = useMemo(
    () => [
      { value: '', label: 'All Regions', color: '#6b7280' },
      ...regions.map((region) => ({ value: region, label: region, color: '#6b7280' })),
    ],
    [regions]
  );

  const stateOptions = useMemo(
    () => [
      { value: '', label: 'All States', color: '#6b7280' },
      ...states.map((state) => ({ value: state, label: state, color: '#6b7280' })),
    ],
    [states]
  );

  const hasActiveFilters = useMemo(() => {
    return !!(regionFilter || stateFilter);
  }, [regionFilter, stateFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (regionFilter) count++;
    if (stateFilter) count++;
    return count;
  }, [regionFilter, stateFilter]);

  // Page size options
  const pageSizeOptions = [
    { value: '25', label: '25', color: '#4b5563' },
    { value: '50', label: '50', color: '#4b5563' },
    { value: '100', label: '100', color: '#4b5563' },
    { value: '200', label: '200', color: '#4b5563' },
    { value: '1000', label: '1000', color: '#4b5563' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Territory Name', color: '#6b7280' },
    { value: 'code', label: 'Territory Code', color: '#6b7280' },
    { value: 'region', label: 'Region', color: '#6b7280' },
    { value: 'state', label: 'State', color: '#6b7280' },
    { value: 'status', label: 'Status', color: '#6b7280' },
  ];

  // Filtered territories
  const filteredTerritories = useMemo(() => {
    let filtered = territories;

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

  // Sorted territories
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
          break;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredTerritories, sortColumn, sortDirection]);

  // Paginated territories
  const paginatedTerritories = useMemo(() => {
    return sortedTerritories.slice(0, pageSize);
  }, [sortedTerritories, pageSize]);

  const getTerritoryGridClass = useMemo(() => {
    if (viewMode === 'card') {
      if (detailsViewMode === 'split' && showTerritoryDetails) {
        return 'grid-cols-1 xl:grid-cols-2';
      }
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
    return 'grid-cols-1';
  }, [viewMode, detailsViewMode, showTerritoryDetails]);

  const refreshData = async () => {
    await loadTerritories();
  };

  const handleTerritoryCreated = async (territoryData: any) => {
    const wasEditMode = !!editingTerritory;
    const editedTerritoryName = editingTerritory
      ? editingTerritory.name || editingTerritory.territory_name
      : null;

    setShowAddTerritoryModal(false);
    setEditingTerritory(null);
    await refreshData();

    if (wasEditMode) {
      if (showTerritoryDetails && selectedTerritory) {
        const currentSelectedName = selectedTerritory.name || selectedTerritory.territory_name;
        if (currentSelectedName) {
          const updatedSelectedTerritory = territories.find(
            (t) => t.name === currentSelectedName || t.territory_name === currentSelectedName
          );
          if (updatedSelectedTerritory) {
            setSelectedTerritory(updatedSelectedTerritory);
          }
        }
      }
    } else if (territoryData) {
      const newItemName = territoryData.name || territoryData.territory_name;
      if (newItemName) {
        const newTerritory = territories.find(
          (t) => t.name === newItemName || t.territory_name === newItemName
        );
        if (newTerritory) {
          handleTerritoryCardClick(newTerritory);
        }
      }
    }
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  const getViewModeTitle = () => {
    return viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View';
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const clearAllFilters = () => {
    setRegionFilter('');
    setStateFilter('');
    setShowFilterModal(false);
  };

  const handleTerritoryCardClick = (territory: Territory) => {
    setSelectedTerritory(territory);
    setShowTerritoryDetails(true);
    setDetailsViewMode(window.innerWidth >= 768 ? 'split' : 'popup');
  };

  const closeTerritoryDetails = () => {
    setShowTerritoryDetails(false);
    setSelectedTerritory(null);
  };

  const handleViewProspects = (territory: Territory) => {
    router.push({ pathname: '/prospects', query: { territory: territory.territory_name || territory.name } });
  };

  const handleEditTerritory = (territory: Territory) => {
    setEditingTerritory(territory);
    setShowAddTerritoryModal(true);
    setShowTerritoryDetails(false);
  };

  const handleOpenPartner = (partner: any) => {
    router.push({ pathname: '/partners', query: { partner: partner.id || partner.name } });
  };

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
                    placeholder="Search territories, regions, states..."
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

                {/* Add Territory Button */}
                {isCorporateAdmin && (
                  <Tooltip text="Add new territory">
                    <button
                      onClick={() => {
                        setEditingTerritory(null);
                        setShowAddTerritoryModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 border border-green-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap h-10"
                    >
                      <Plus className="w-4 h-4" />
                      Add Territory
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
                  <Tooltip text="Sort territories by">
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
                    setEditingTerritory(null);
                    setShowAddTerritoryModal(true);
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

          {/* Territories Grid/List and Detail Panel */}
          <div
            className={`flex gap-6 ${
              detailsViewMode === 'split' && showTerritoryDetails ? 'flex-row' : 'flex-col'
            }`}
          >
            {/* Territories Section */}
            <div className={detailsViewMode === 'split' && showTerritoryDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading territories...</p>
                </div>
              ) : sortedTerritories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-lg">
                  <div className="text-center">
                    <AlertTriangle className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No territories found</h3>
                    <p className="text-sm text-gray-400">Try adjusting your filters.</p>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-6 ${getTerritoryGridClass}`}>
                  {paginatedTerritories.map((territory) => (
                    <TallacTerritoryCard
                      key={territory.id || territory.name}
                      territory={territory}
                      isSelected={selectedTerritory?.id === territory.id && showTerritoryDetails}
                      viewMode={viewMode}
                      onClick={() => handleTerritoryCardClick(territory)}
                      onViewProspects={() => handleViewProspects(territory)}
                      onEdit={() => handleEditTerritory(territory)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details Panel (Split View) */}
            {detailsViewMode === 'split' && showTerritoryDetails && selectedTerritory && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
                <TallacTerritoryDetails
                  territory={selectedTerritory}
                  mode="split"
                  showCloseButton={true}
                  isCorporateAdmin={isCorporateAdmin}
                  onClose={closeTerritoryDetails}
                  onOpenPartner={handleOpenPartner}
                  onViewProspects={handleViewProspects}
                  onEdit={handleEditTerritory}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Add/Edit Territory Modal */}
      {showAddTerritoryModal && (
        <AddTerritoryModal
          territory={editingTerritory || undefined}
          onClose={() => {
            setShowAddTerritoryModal(false);
            setEditingTerritory(null);
          }}
          onSuccess={handleTerritoryCreated}
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
        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
          <CustomDropdown
            value={regionFilter}
            options={regionOptions}
            onChange={setRegionFilter}
            buttonClass="bg-gray-700 border-gray-600 text-gray-300"
            showColorDot={false}
            showCheckmark={true}
          />
        </div>

        {/* State Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
          <CustomDropdown
            value={stateFilter}
            options={stateOptions}
            onChange={setStateFilter}
            buttonClass="bg-gray-700 border-gray-600 text-gray-300"
            showColorDot={false}
            showCheckmark={true}
          />
        </div>
      </FilterModal>

      {/* Territory Details Modal (Mobile) */}
      {detailsViewMode === 'popup' && showTerritoryDetails && selectedTerritory && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
          onClick={closeTerritoryDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <TallacTerritoryDetails
              territory={selectedTerritory}
              mode="popup"
              showCloseButton={true}
              isCorporateAdmin={isCorporateAdmin}
              onClose={closeTerritoryDetails}
              onOpenPartner={handleOpenPartner}
              onViewProspects={handleViewProspects}
              onEdit={handleEditTerritory}
            />
          </div>
        </div>
      )}
    </div>
  );
}

