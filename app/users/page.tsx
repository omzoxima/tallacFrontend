'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Tooltip from '@/components/Tooltip';
import CustomDropdown from '@/components/CustomDropdown';
import FilterModal from '@/components/FilterModal';
import TallacUserCard from '@/components/TallacUserCard';
import TallacUserDetails from '@/components/TallacUserDetails';
import TallacTerritoryDetails from '@/components/TallacTerritoryDetails';
import AddTerritoryAdminModal from '@/components/AddTerritoryAdminModal';
import AssignTerritoryModal from '@/components/AssignTerritoryModal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, SlidersHorizontal, Plus, RotateCw, ArrowDownWideNarrow, ArrowUpWideNarrow,
  LayoutGrid, List, User as UserIcon
} from 'lucide-react';

interface User {
  name: string;
  full_name?: string;
  email: string;
  mobile_no?: string;
  tallac_role?: string;
  status?: string;
  territories?: any[];
  telephony_lines?: any[];
  territory_count?: number;
  telephony_count?: number;
  prospect_count?: number;
  activity_count?: number;
  reports_to?: string;
  reports_to_details?: {
    name: string;
    full_name?: string;
    email?: string;
    tallac_role?: string;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, canViewPartnersAndUsers } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsViewMode, setDetailsViewMode] = useState<'split' | 'popup'>('split');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showTerritoryDetails, setShowTerritoryDetails] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<any>(null);
  const [showAssignTerritoryModal, setShowAssignTerritoryModal] = useState(false);
  const [userForTerritoryAssignment, setUserForTerritoryAssignment] = useState<User | null>(null);

  const sortOptions = [
    { value: 'full_name', label: 'Name', color: '#6b7280' },
    { value: 'email', label: 'Email', color: '#6b7280' },
    { value: 'tallac_role', label: 'Role', color: '#6b7280' },
    { value: 'status', label: 'Status', color: '#6b7280' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses', color: '#6b7280' },
    { value: 'Active', label: 'Active', color: '#10b981' },
    { value: 'Inactive', label: 'Inactive', color: '#ef4444' },
  ];

  const roleOptions = [
    { value: '', label: 'All Roles', color: '#6b7280' },
    { value: 'Corporate Admin', label: 'Corporate Admin', color: '#a855f7' },
    { value: 'Territory Admin', label: 'Territory Admin', color: '#f97316' },
    { value: 'Sales User', label: 'Sales User', color: '#3b82f6' },
    { value: 'Territory Manager', label: 'Territory Manager', color: '#3b82f6' },
    { value: 'Business Coach', label: 'Business Coach', color: '#3b82f6' },
  ];

  const pageSizeOptions = [
    { value: '10', label: '10', color: '#6b7280' },
    { value: '20', label: '20', color: '#6b7280' },
    { value: '50', label: '50', color: '#6b7280' },
    { value: '100', label: '100', color: '#6b7280' },
  ];

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((u) =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.tallac_role?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter((u) => u.status === statusFilter);
    }

    if (roleFilter) {
      result = result.filter((u) => u.tallac_role === roleFilter);
    }

    result.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof User] || '';
      let bVal: any = b[sortColumn as keyof User] || '';

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

    return result;
  }, [users, searchQuery, statusFilter, roleFilter, sortColumn, sortDirection]);

  const totalPages = useMemo(() => Math.ceil(filteredUsers.length / pageSize), [filteredUsers.length, pageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, pageSize]);

  const hasActiveFilters = useMemo(() => statusFilter !== '' || roleFilter !== '', [statusFilter, roleFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (roleFilter) count++;
    return count;
  }, [statusFilter, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const openUser = searchParams.get('openUser');
    if (openUser && users.length > 0) {
      const user = users.find((u) => u.name === openUser || u.email === openUser);
      if (user) {
        openUserDetails(user, true);
        router.replace('/users');
      }
    }
  }, [searchParams, users, router]);

  useEffect(() => {
    if (showUserDetails && detailsViewMode === 'popup') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showUserDetails, detailsViewMode]);

  const refreshData = () => {
    fetchUsers();
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setRoleFilter('');
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const openUserDetails = (user: User, forceSplit = false) => {
    setSelectedUser({
      ...user,
      full_name: user.full_name || user.name || user.email || 'Unknown User',
      email: user.email || 'N/A',
      status: user.status || 'Active',
      tallac_role: user.tallac_role || 'User',
      mobile_no: user.mobile_no || null,
      territories: user.territories || [],
      telephony_lines: user.telephony_lines || [],
      territory_count: user.territory_count || 0,
      telephony_count: user.telephony_count || 0,
      prospect_count: user.prospect_count || 0,
      activity_count: user.activity_count || 0,
      reports_to_details: user.reports_to_details || null,
    });

    setShowUserDetails(true);

    if (forceSplit || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
      setDetailsViewMode('split');
    } else {
      setDetailsViewMode('popup');
    }
  };

  const closeUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  const handleOpenTerritory = (territory: any) => {
    router.push({ pathname: '/territories', query: { openTerritory: territory.territory || territory.territory_name } });
  };

  const handleViewUserProspects = (user: User) => {
    router.push({ pathname: '/prospects', query: { assignedTo: user.email || user.name } });
  };

  const handleViewUserActivities = (user: User) => {
    router.push({ pathname: '/activities', query: { assignedTo: user.email || user.name } });
  };

  const handleOpenReportsTo = (managerDetails: any) => {
    const managerUser = users.find(
      (u) => u.email === managerDetails.email || u.name === managerDetails.name || u.name === managerDetails.full_name
    );

    if (managerUser) {
      openUserDetails(managerUser);
    } else {
      openUserDetails({
        name: managerDetails.name || managerDetails.full_name,
        email: managerDetails.email || 'N/A',
        full_name: managerDetails.full_name || managerDetails.name,
        status: 'Active',
        territories: [],
        telephony_lines: [],
        territory_count: 0,
        telephony_count: 0,
        prospect_count: 0,
        activity_count: 0,
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowAddUserModal(false);
    setEditingUser(null);
  };

  const handleUserCreated = async (userData: any) => {
    const wasEditMode = !!editingUser;

    setShowAddUserModal(false);
    setEditingUser(null);

    await fetchUsers();

    if (wasEditMode) {
      if (selectedUser) {
        const updatedUser = users.find((u) => u.name === selectedUser.name);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      return;
    }

    if (userData && userData.user) {
      const newUser = users.find((u) => u.email === userData.email || u.name === userData.user);

      if (newUser) {
        openUserDetails(newUser);
      }

      if (userData.role === 'Corporate Admin') {
        return;
      }

      setUserForTerritoryAssignment({
        email: userData.email,
        full_name: userData.full_name,
        tallac_role: userData.role,
        name: userData.user,
        ...userData,
      });
      setShowAssignTerritoryModal(true);
    }
  };

  const handleCloseAssignTerritoryModal = () => {
    setShowAssignTerritoryModal(false);
    setUserForTerritoryAssignment(null);
  };

  const handleAssignTerritorySuccess = async () => {
    setShowAssignTerritoryModal(false);
    setUserForTerritoryAssignment(null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.reload();
  };

  const handleAddTerritory = (user: User) => {
    setUserForTerritoryAssignment({
      email: user.email,
      full_name: user.full_name || user.name,
      tallac_role: user.tallac_role,
      name: user.name,
      territories: user.territories || [],
    });
    setShowAssignTerritoryModal(true);
  };

  const handleOpenTerritoryDetails = (territory: any) => {
    setSelectedTerritory(territory);
    setShowTerritoryDetails(true);
  };

  const closeTerritoryDetails = () => {
    setShowTerritoryDetails(false);
    setSelectedTerritory(null);
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
          <div className="flex flex-col mb-6 gap-3">
            <div className="hidden md:flex gap-4">
              <div className="flex flex-1 gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-10 py-2.5 pl-10 pr-3 placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg whitespace-nowrap h-10 ${
                    hasActiveFilters
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-blue-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowAddUserModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 border border-green-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap h-10"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <CustomDropdown
                      value={pageSize.toString()}
                      onChange={(val) => {
                        setPageSize(parseInt(val));
                        setCurrentPage(1);
                      }}
                      options={pageSizeOptions}
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
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-36">
                    <CustomDropdown
                      value={sortColumn}
                      onChange={(val) => setSortColumn(val)}
                      options={sortOptions}
                      buttonClass="bg-gray-800 border-gray-600 text-gray-400"
                      showColorDot={false}
                      showCheckmark={false}
                    />
                  </div>
                  <Tooltip text={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}>
                    <button
                      onClick={toggleSortDirection}
                      className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
                    >
                      {sortDirection === 'asc' ? (
                        <ArrowDownWideNarrow className="w-4 h-4" />
                      ) : (
                        <ArrowUpWideNarrow className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>

                <div className="hidden md:flex items-center rounded-lg border border-gray-600 shadow-sm overflow-hidden">
                  <Tooltip text={viewMode === 'list' ? 'Switch to Card View' : 'Switch to List View'}>
                    <button
                      onClick={toggleLayoutMode}
                      className="flex items-center justify-center w-10 h-10 p-2.5 bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      {viewMode === 'list' ? (
                        <LayoutGrid className="w-4 h-4" />
                      ) : (
                        <List className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="md:hidden space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <CustomDropdown
                    value={sortColumn}
                    onChange={(val) => setSortColumn(val)}
                    options={sortOptions}
                    buttonClass="bg-gray-800 border-gray-600 text-gray-400"
                    showColorDot={false}
                    showCheckmark={false}
                  />
                </div>
                <button
                  onClick={toggleSortDirection}
                  className="flex items-center justify-center p-2.5 border border-gray-600 text-white rounded-lg hover:bg-gray-700 flex-shrink-0"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowDownWideNarrow className="w-4 h-4" />
                  ) : (
                    <ArrowUpWideNarrow className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 font-medium">Active Filters:</span>
              {statusFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Status: {statusFilter}</span>
                  <button onClick={() => setStatusFilter('')} className="text-gray-400 hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
              {roleFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Role: {roleFilter}</span>
                  <button onClick={() => setRoleFilter('')} className="text-gray-400 hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          <div className={`flex gap-6 ${detailsViewMode === 'split' && showUserDetails ? 'flex-row' : 'flex-col'}`}>
            <div className={detailsViewMode === 'split' && showUserDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                  <UserIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-xl text-gray-400 mb-2">No users found</p>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  {viewMode === 'card' ? (
                    <div
                      className={`grid grid-cols-1 gap-4 ${
                        detailsViewMode === 'split' && showUserDetails
                          ? 'md:grid-cols-1 lg:grid-cols-2'
                          : 'md:grid-cols-2 lg:grid-cols-3'
                      }`}
                    >
                      {paginatedUsers.map((user, index) => (
                        <div key={user.id || user.name || `user-${index}`} onClick={() => openUserDetails(user)}>
                          <TallacUserCard
                            user={user}
                            isSelected={selectedUser?.name === user.name}
                            viewMode={viewMode}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paginatedUsers.map((user, index) => (
                        <div key={user.id || user.name || `user-${index}`} onClick={() => openUserDetails(user)}>
                          <TallacUserCard
                            user={user}
                            isSelected={selectedUser?.name === user.name}
                            viewMode={viewMode}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {showUserDetails && detailsViewMode === 'split' && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
                {selectedUser && (
                  <TallacUserDetails
                    user={selectedUser}
                    mode="split"
                    showCloseButton={true}
                    onClose={closeUserDetails}
                    onViewUserProspects={handleViewUserProspects}
                    onViewUserActivities={handleViewUserActivities}
                    onOpenTerritory={handleOpenTerritory}
                    onOpenReportsTo={handleOpenReportsTo}
                    onEditUser={handleEditUser}
                    onAddTerritory={handleAddTerritory}
                    onOpenTerritoryDetails={handleOpenTerritoryDetails}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showUserDetails && detailsViewMode === 'popup' && (
        <div className="user-modal-overlay" onClick={closeUserDetails}>
          <div className="user-modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedUser && (
              <TallacUserDetails
                user={selectedUser}
                mode="popup"
                showCloseButton={true}
                onClose={closeUserDetails}
                onViewUserProspects={handleViewUserProspects}
                onViewUserActivities={handleViewUserActivities}
                onOpenTerritory={handleOpenTerritory}
                onOpenReportsTo={handleOpenReportsTo}
                onEditUser={handleEditUser}
                onAddTerritory={handleAddTerritory}
                onOpenTerritoryDetails={handleOpenTerritoryDetails}
              />
            )}
          </div>
        </div>
      )}

      <FilterModal show={showFilterModal} onClose={() => setShowFilterModal(false)} onApply={applyFilters}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={statusOptions}
              buttonClass="bg-gray-700 border-gray-600 text-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <CustomDropdown
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={roleOptions}
              buttonClass="bg-gray-700 border-gray-600 text-gray-300"
            />
          </div>
        </div>
      </FilterModal>

      {showTerritoryDetails && (
        <div className="user-modal-overlay">
          <div className="user-modal-content">
            <TallacTerritoryDetails
              territory={selectedTerritory}
              mode="popup"
              showCloseButton={true}
              onClose={closeTerritoryDetails}
            />
          </div>
        </div>
      )}

      {showAddUserModal && (
        <AddTerritoryAdminModal
          partnerId={null}
          partnerName={null}
          partnerTerritories={[]}
          editUser={editingUser}
          onClose={handleCloseUserModal}
          onSuccess={handleUserCreated}
        />
      )}

      {showAssignTerritoryModal && userForTerritoryAssignment && (
        <AssignTerritoryModal
          user={userForTerritoryAssignment}
          onClose={handleCloseAssignTerritoryModal}
          onSuccess={handleAssignTerritorySuccess}
        />
      )}

      <MobileBottomNav />
    </div>
  );
}

