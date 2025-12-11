'use client';

import React, { useMemo } from 'react';
import { X, Users, ClipboardList, Edit, Mail, Phone, MapPin, UserCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id?: string;
  name?: string;
  email?: string;
  full_name?: string;
  mobile_no?: string;
  tallac_role?: string;
  status?: string;
  territory_count?: number;
  territories?: Array<{
    id?: string;
    territory?: string;
    territory_name?: string;
    territory_code?: string;
    territory_status?: string;
    territory_dba?: string;
    territory_state?: string;
    territory_region?: string;
    zipcode_count?: number;
  }>;
  reports_to_details?: {
    id?: string;
    name?: string;
    full_name?: string;
    email?: string;
    tallac_role?: string;
  };
}

interface TallacUserDetailsProps {
  user: User;
  mode?: 'split' | 'popup';
  showCloseButton?: boolean;
  onClose?: () => void;
  onViewUserProspects?: (user: User) => void;
  onViewUserActivities?: (user: User) => void;
  onOpenTerritory?: (territory: any) => void;
  onOpenReportsTo?: (user: User) => void;
  onAddTerritory?: (user: User) => void;
  onEditUser?: (user: User) => void;
  onOpenTerritoryDetails?: (territory: any) => void;
}

export default function TallacUserDetails({
  user,
  mode = 'split',
  showCloseButton = true,
  onClose,
  onViewUserProspects,
  onViewUserActivities,
  onOpenTerritory,
  onOpenReportsTo,
  onAddTerritory,
  onEditUser,
  onOpenTerritoryDetails,
}: TallacUserDetailsProps) {
  const { user: currentUser } = useAuth();

  const canManageTerritories = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    // Check if user has tallac_role property (single role) or roles array
    const userRole = currentUser.tallac_role;
    const userRoles = currentUser.roles && Array.isArray(currentUser.roles) ? currentUser.roles : [];
    
    const allowedRoles = ['Corporate Admin', 'Administrator', 'System Manager', 'Territory Admin'];
    
    // Check single role
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }
    
    // Check roles array
    if (userRoles.length > 0) {
      return userRoles.some((role) => allowedRoles.includes(role));
    }
    
    return false;
  }, [currentUser]);

  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      Active: 'bg-green-600 text-white',
      Inactive: 'bg-red-600 text-white',
      Pending: 'bg-yellow-600 text-white',
    };
    return statusMap[status || ''] || 'bg-gray-500 text-white';
  };

  const getRoleBadgeClass = (role?: string) => {
    const roleMap: Record<string, string> = {
      'Corporate Admin': 'bg-red-600/20 text-red-300 border border-red-500/30',
      'Business Coach': 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
      'Territory Admin': 'bg-orange-600/20 text-orange-300 border border-orange-500/30',
      'Territory Manager': 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
      'Sales User': 'bg-green-600/20 text-green-300 border border-green-500/30',
    };
    return roleMap[role || ''] || 'bg-gray-600/20 text-gray-300 border border-gray-500/30';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 ${
        mode === 'popup' ? 'h-full flex flex-col' : 'max-h-screen overflow-y-auto'
      }`}
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800/95 border-b border-gray-700 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-gray-700">
              {getInitials(user.full_name || user.name || user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white truncate">
                  {user.full_name || user.name || user.email || 'Unknown User'}
                </h2>
                {user.status && (
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate mt-0.5">{user.email || 'No email'}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {user.tallac_role && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${getRoleBadgeClass(user.tallac_role)}`}>
                    {user.tallac_role}
                  </span>
                )}
                {user.territory_count && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {user.territory_count} Territory
                  </span>
                )}
              </div>
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-6 ${mode === 'popup' ? 'flex-1 overflow-y-auto' : ''}`}>
        {/* Action Buttons */}
        <div className="bg-gray-900/50 rounded-lg p-1 backdrop-blur-sm border border-gray-700/50">
          <div className="grid grid-cols-3 gap-1">
            {/* View Prospects Button */}
            <button
              onClick={() => onViewUserProspects?.(user)}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-orange-600/20 text-gray-300 hover:text-orange-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-orange-600/30 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/5 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <Users className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Prospects</span>
            </button>

            {/* View Activities Button */}
            <button
              onClick={() => onViewUserActivities?.(user)}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-blue-600/30 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <ClipboardList className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Activities</span>
            </button>

            {/* Edit User Button */}
            <button
              onClick={() => onEditUser?.(user)}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-purple-600/20 text-gray-300 hover:text-purple-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-purple-600/30 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <Edit className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Edit</span>
            </button>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Mail className="w-4 h-4 text-green-400" />
            Contact Information
          </h3>

          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <a
                href={`mailto:${user.email}`}
                className="text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors hover:underline truncate flex-1 min-w-0"
              >
                {user.email || 'N/A'}
              </a>
            </div>

            {/* Mobile */}
            {user.mobile_no && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center border border-green-500/20">
                  <Phone className="w-4 h-4 text-green-400" />
                </div>
                <a
                  href={`tel:${user.mobile_no}`}
                  className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors hover:underline"
                >
                  {user.mobile_no}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Reports To Section */}
        {user.reports_to_details && user.reports_to_details.full_name && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <UserCheck className="w-4 h-4 text-blue-400" />
              User Details
            </h3>
            <div
              onClick={() => onOpenReportsTo?.(user.reports_to_details!)}
              className="rounded-lg p-3 border-b-2 border-orange-500/50 hover:border-orange-400 transition-all duration-200 cursor-pointer hover:bg-gray-700/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-orange-500 to-orange-600">
                  {getInitials(user.reports_to_details.full_name || user.reports_to_details.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold text-sm truncate">
                      {user.reports_to_details.full_name || user.reports_to_details.name || 'N/A'}
                    </h4>
                    <span className="text-[9px] font-medium text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded flex-shrink-0">
                      Manager
                    </span>
                  </div>
                  {user.reports_to_details.tallac_role && (
                    <p className="text-gray-300 text-xs truncate">{user.reports_to_details.tallac_role}</p>
                  )}
                  {user.reports_to_details.email && (
                    <p className="text-gray-400 text-xs truncate">{user.reports_to_details.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Territories Section */}
        {user.tallac_role !== 'Corporate Admin' && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-purple-400" />
                Territories ({user.territory_count || 0})
              </h3>
              {canManageTerritories && (
                <button
                  onClick={() => onAddTerritory?.(user)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 text-xs font-medium rounded-lg transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Manage Territories</span>
                </button>
              )}
            </div>

            {user.territories && user.territories.length > 0 ? (
              <div className="space-y-3">
                {user.territories.map((territory, index) => (
                  <div
                    key={index}
                    onClick={() => onOpenTerritoryDetails?.(territory)}
                    className="rounded-lg p-3 transition-all duration-200 cursor-pointer border-b-2 border-purple-500/50 hover:border-purple-400 hover:translate-y-[-2px]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-purple-500 to-purple-600">
                        {getInitials(territory.territory_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-semibold text-sm truncate">
                            {territory.territory_name}
                          </h4>
                          <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                            {territory.territory_code}
                          </span>
                          {territory.territory_status && (
                            <span
                              className={`flex-shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded border ${getStatusBadgeClass(
                                territory.territory_status
                              )}`}
                            >
                              {territory.territory_status}
                            </span>
                          )}
                        </div>
                        {territory.territory_dba && (
                          <p className="text-gray-400 text-xs truncate mb-1">{territory.territory_dba}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-400">
                          {territory.territory_state && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-blue-400" />
                              {territory.territory_state}
                            </span>
                          )}
                          {territory.territory_region && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span>{territory.territory_region}</span>
                            </>
                          )}
                          {territory.zipcode_count && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span>{territory.zipcode_count} Zipcodes</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No territories assigned</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

