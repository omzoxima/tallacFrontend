'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import Tooltip from '@/components/Tooltip';
import UserCard from '@/components/UserCard';
import UserDetails from '@/components/UserDetails';
import AddUserModal from '@/components/AddUserModal';
import AddTelephonyModal from '@/components/AddTelephonyModal';
import ManageUserTerritoryModal from '@/components/ManageUserTerritoryModal';
import { X } from 'lucide-react';
import { showToast } from '@/components/Toast';
import { useUser } from '@/contexts/UserContext';

interface User {
  id?: string;
  name?: string; // Document ID from Frappe
  full_name?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string; // This is the actual role field from API
  tallac_role?: string; // Alias for role (for compatibility)
  is_active?: boolean;
  status?: string; // Computed from is_active: 'Active' | 'Inactive'
  mobile_no?: string | null;
  territories?: Array<any> | null;
  telephony_lines?: Array<any> | null;
  territory_count?: number;
  telephony_count?: number;
  prospect_count?: number;
  activity_count?: number;
  reports_to_id?: string | null;
  reports_to?: string | null; // Alias for reports_to_id
  reports_to_name?: string | null;
  reports_to_email?: string | null;
  reports_to_details?: {
    full_name?: string;
    name?: string;
    email?: string;
    tallac_role?: string;
    role?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pageSize, setPageSize] = useState(1000);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [detailsViewMode, setDetailsViewMode] = useState<'popup' | 'split'>('split');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddTelephonyModal, setShowAddTelephonyModal] = useState(false);
  const [showManageTerritoryModal, setShowManageTerritoryModal] = useState(false);
  const [userForTerritoryAssignment, setUserForTerritoryAssignment] = useState<User | null>(null);

  const isCorporateAdmin = useMemo(() => {
    if (!user || !user.email || user.email === 'Guest') return false;
    if (user.role) {
      return user.role === 'Corporate Admin' || user.role === 'Territory Admin';
    }
    return false;
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const openUser = searchParams?.get('openUser');
    if (openUser && users.length > 0) {
      const user = users.find((u) => u.name === openUser || u.email === openUser);
      if (user) {
        openUserDetails(user, true);
        setTimeout(() => {
          router.replace('/users');
        }, 100);
      }
    }
  }, [searchParams, users, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/users?limit=1000`, {
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
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      // Transform API response to match our User interface
      const transformedUsers = Array.isArray(data) ? data.map((user: any) => ({
        ...user,
        name: user.name || user.email,
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        tallac_role: user.tallac_role || user.role,
        status: user.status || (user.is_active !== false ? 'Active' : 'Inactive'),
        reports_to: user.reports_to_id || user.reports_to || null,
        reports_to_details: user.reports_to_name ? {
          full_name: user.reports_to_name,
          email: user.reports_to_email || undefined,
          role: user.reports_to_role || undefined,
          tallac_role: user.reports_to_role || undefined
        } : null,
        territories: user.territories || [],
        telephony_lines: user.telephony_lines || [],
        territory_count: user.territory_count || 0,
        telephony_count: user.telephony_count || 0,
        prospect_count: user.prospect_count || 0,
        activity_count: user.activity_count || 0
      })) : [];
      setUsers(transformedUsers);
      return transformedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users. Please try again.', 'error');
      setUsers([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.full_name || '').toLowerCase().includes(query) ||
          (u.email || '').toLowerCase().includes(query) ||
          (u.tallac_role || '').toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      result = result.filter((u) => u.status === statusFilter);
    }

    if (roleFilter) {
      result = result.filter((u) => u.tallac_role === roleFilter);
    }

    return result;
  }, [users, searchQuery, statusFilter, roleFilter]);

  const sortedUsers = useMemo(() => {
    const filtered = [...filteredUsers];

    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof User] || '';
      let bVal: any = b[sortColumn as keyof User] || '';

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
  }, [filteredUsers, sortColumn, sortDirection]);

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice(0, pageSize);
  }, [sortedUsers, pageSize]);

  const hasActiveFilters = statusFilter !== '' || roleFilter !== '';
  const activeFiltersCount = (statusFilter ? 1 : 0) + (roleFilter ? 1 : 0);

  const openUserDetails = (user: User, forceSplit = false) => {
    const selectedUserData: User = {
      ...user,
      full_name: user.full_name || user.name || user.email || 'Unknown User',
      email: user.email || 'N/A',
      status: user.status || (user.is_active !== false ? 'Active' : 'Inactive'),
      tallac_role: user.tallac_role || user.role || 'User',
      mobile_no: (user.mobile_no ?? null) as string | null | undefined,
      territories: user.territories ?? [],
      telephony_lines: user.telephony_lines ?? [],
      territory_count: user.territory_count ?? 0,
      telephony_count: user.telephony_count ?? 0,
      prospect_count: user.prospect_count ?? 0,
      activity_count: user.activity_count ?? 0,
      reports_to_details: user.reports_to_details ?? (user.reports_to_name ? {
        full_name: user.reports_to_name,
        email: user.reports_to_email || undefined,
        role: undefined,
        tallac_role: undefined
      } : null)
    };
    setSelectedUser(selectedUserData);
    setShowUserDetails(true);
    if (forceSplit || window.innerWidth >= 768) {
      setDetailsViewMode('split');
    } else {
      setDetailsViewMode('popup');
    }
  };

  const handleAssignTerritory = () => {
    if (!selectedUser) {
      showToast('Select a user to assign territories', 'info');
      return;
    }
    setUserForTerritoryAssignment(selectedUser);
    setShowManageTerritoryModal(true);
  };

  const handleUserModalSuccess = async () => {
    const updatedList = await fetchUsers();
    if (selectedUser && updatedList) {
      const refreshed = updatedList.find(
        (user) =>
          (selectedUser.id && user.id === selectedUser.id) ||
          user.name === selectedUser.name ||
          user.email === selectedUser.email
      );
      if (refreshed) {
        openUserDetails(refreshed, detailsViewMode === 'split');
      }
    }
    setShowAddUserModal(false);
    setEditingUser(null);
  };

  const closeUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  const handleViewUserProspects = (user: User) => {
    const assignedTo = user.email || user.name || '';
    router.push(`/prospects?assignedTo=${encodeURIComponent(assignedTo)}`);
  };

  const handleViewUserActivities = (user: User) => {
    const assignedTo = user.email || user.name || '';
    router.push(`/activities?assignedTo=${encodeURIComponent(assignedTo)}`);
  };

  const handleOpenReportsTo = (managerDetails: any) => {
    const managerUser = users.find(
      (u) => u.email === managerDetails.email || u.name === managerDetails.name || u.name === managerDetails.full_name
    );

    if (managerUser) {
      openUserDetails(managerUser);
    } else {
      openUserDetails({
        ...managerDetails,
        user: managerDetails.name || managerDetails.full_name,
        email: managerDetails.email || 'N/A',
        full_name: managerDetails.full_name || managerDetails.name,
        status: 'Active',
        territories: [],
        telephony_lines: [],
        territory_count: 0,
        telephony_count: 0,
        prospect_count: 0,
        activity_count: 0
      });
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setRoleFilter('');
  };

  const refreshData = () => {
    fetchUsers();
    showToast('Refreshing users...', 'info', 2000);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleLayoutMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
  };

  const getUserGridClass = () => {
    if (detailsViewMode === 'split' && showUserDetails) {
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
                    placeholder="Search users..."
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

                {/* Add User Button */}
                {isCorporateAdmin && (
                  <Tooltip text="Add new user">
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setShowAddUserModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 border border-green-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add User
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
                  <Tooltip text="Sort users by">
                    <select
                      value={sortColumn}
                      onChange={(e) => setSortColumn(e.target.value)}
                      className="w-36 bg-gray-800 dark:bg-gray-800 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-gray-400 dark:text-gray-400 text-gray-700 text-sm rounded-lg px-3 py-2.5"
                    >
                      <option value="full_name">Name</option>
                      <option value="email">Email</option>
                      <option value="tallac_role">Role</option>
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
                  placeholder="Search users..."
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
                <select
                  value={sortColumn}
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 text-gray-400 text-sm rounded-lg px-3 py-2.5"
                >
                  <option value="full_name">Name</option>
                  <option value="email">Email</option>
                  <option value="tallac_role">Role</option>
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
                  <button onClick={() => setStatusFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {roleFilter && (
                <span className="flex items-center gap-1.5 bg-gray-700 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span>Role: {roleFilter}</span>
                  <button onClick={() => setRoleFilter('')} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-white underline">
                Clear All
              </button>
            </div>
          )}

          {/* Users Grid/List */}
          <div className={`flex gap-6 ${detailsViewMode === 'split' && showUserDetails ? 'flex-row' : 'flex-col'}`}>
            <div className={detailsViewMode === 'split' && showUserDetails ? 'flex-1' : 'w-full'}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="spinner w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Loading users...</p>
                </div>
              ) : paginatedUsers.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <p className="text-xl text-gray-400 mb-2">No users found</p>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className={viewMode === 'card' ? `grid ${getUserGridClass()} gap-4` : 'space-y-2'}>
                  {paginatedUsers.map((user) => (
                    <UserCard
                      key={user.name}
                      user={user}
                      isSelected={selectedUser?.name === user.name && showUserDetails}
                      viewMode={viewMode}
                      onClick={() => openUserDetails(user)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details Panel (Split View) */}
            {detailsViewMode === 'split' && showUserDetails && selectedUser && (
              <div className="w-full lg:w-2/5 xl:w-1/3 sticky top-0">
                <UserDetails
                  user={selectedUser}
                  mode="split"
                  showCloseButton={true}
                  onClose={closeUserDetails}
                  onOpenTerritory={(territory) => {
                    router.push(`/territories?openTerritory=${encodeURIComponent(territory.territory_name)}`);
                  }}
                  onViewUserProspects={(user) => handleViewUserProspects(user)}
                  onViewUserActivities={(user) => handleViewUserActivities(user)}
                  onAddTerritory={handleAssignTerritory}
                  onAddTelephony={() => {
                    setShowAddTelephonyModal(true);
                  }}
                  onOpenReportsTo={(user) => handleOpenReportsTo(user)}
                  onEditUser={(user) => {
                    setEditingUser(user);
                    setShowAddUserModal(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Add/Edit User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => {
            setShowAddUserModal(false);
            setEditingUser(null);
          }}
          onSuccess={handleUserModalSuccess}
          editUser={editingUser}
        />
      )}

      {/* Add Telephony Line Modal */}
      {showAddTelephonyModal && selectedUser && (
        <AddTelephonyModal
          user={selectedUser}
          onClose={() => {
            setShowAddTelephonyModal(false);
          }}
          onSuccess={async () => {
            await fetchUsers();
            // Refresh selected user with updated telephony data
            if (selectedUser) {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
              const token = localStorage.getItem('token');
              try {
                const response = await fetch(`${apiUrl}/api/users/${selectedUser.id || selectedUser.name}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                if (response.ok) {
                  const updatedUser = await response.json();
                  setSelectedUser({
                    ...updatedUser,
                    name: updatedUser.name || updatedUser.email,
                    full_name: updatedUser.full_name || `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email,
                    status: updatedUser.status || (updatedUser.is_active !== false ? 'Active' : 'Inactive'),
                    tallac_role: updatedUser.tallac_role || updatedUser.role,
                    territories: updatedUser.territories || [],
                    telephony_lines: updatedUser.telephony_lines || [],
                    territory_count: updatedUser.territory_count || 0,
                    telephony_count: updatedUser.telephony_count || 0
                  });
                }
              } catch (error) {
                console.error('Error fetching updated user:', error);
              }
            }
            setShowAddTelephonyModal(false);
          }}
        />
      )}

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
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                  <option value="">All Roles</option>
                  <option value="Corporate Admin">Corporate Admin</option>
                  <option value="Territory Admin">Territory Admin</option>
                  <option value="SDR">SDR</option>
                  <option value="System Manager">System Manager</option>
                  <option value="Business Coach">Business Coach</option>
                  <option value="Territory Manager">Territory Manager</option>
                  <option value="Sales User">Sales User</option>
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

      {/* User Details Modal (Mobile) */}
      {detailsViewMode === 'popup' && showUserDetails && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeUserDetails}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <UserDetails
              user={selectedUser}
              mode="popup"
              showCloseButton={true}
              onClose={closeUserDetails}
              onOpenTerritory={(territory) => {
                router.push(`/territories?openTerritory=${encodeURIComponent(territory.territory_name)}`);
              }}
              onViewUserProspects={(user) => handleViewUserProspects(user)}
              onViewUserActivities={(user) => handleViewUserActivities(user)}
              onAddTerritory={handleAssignTerritory}
              onAddTelephony={() => {
                    setShowAddTelephonyModal(true);
                  }}
              onOpenReportsTo={(user) => handleOpenReportsTo(user)}
            />
          </div>
        </div>
      )}

      {/* Manage Territories Modal (Vue3-style) */}
      {showManageTerritoryModal && userForTerritoryAssignment && (
        <ManageUserTerritoryModal
          user={userForTerritoryAssignment}
          onClose={() => {
            setShowManageTerritoryModal(false);
            setUserForTerritoryAssignment(null);
          }}
          onSuccess={async () => {
            const updatedList = await fetchUsers();
            if (updatedList && userForTerritoryAssignment) {
              const refreshed = updatedList.find(
                (u) =>
                  (userForTerritoryAssignment.id && u.id === userForTerritoryAssignment.id) ||
                  u.email === userForTerritoryAssignment.email
              );
              if (refreshed) {
                openUserDetails(refreshed, detailsViewMode === 'split');
              }
            }
            setShowManageTerritoryModal(false);
            setUserForTerritoryAssignment(null);
          }}
        />
      )}
    </div>
  );
}

export default function UsersPage() {
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
      <UsersPageContent />
    </Suspense>
  );
}

