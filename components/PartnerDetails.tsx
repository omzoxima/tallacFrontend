'use client';

import { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Building2,
  Users,
  UserCog,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Map,
} from 'lucide-react';

interface PartnerDetailsProps {
  partner: any;
  mode?: 'popup' | 'split';
  showCloseButton?: boolean;
  onClose?: () => void;
  onAddTeamMember?: () => void;
  onAddTerritory?: () => void;
  onOpenTerritory?: (territory: any) => void;
}

export default function PartnerDetails({
  partner,
  mode = 'split',
  showCloseButton = true,
  onClose,
  onAddTeamMember,
  onAddTerritory,
  onOpenTerritory,
}: PartnerDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'team'>('overview');

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-600 text-white',
      'Pending': 'bg-yellow-600 text-white',
      'Inactive': 'bg-red-600 text-white'
    };
    return statusMap[status] || 'bg-gray-500 text-white';
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFullAddress = (partner: any) => {
    const parts = [];
    if (partner.partner_address) parts.push(partner.partner_address);
    if (partner.partner_city) parts.push(partner.partner_city);
    if (partner.partner_state) parts.push(partner.partner_state);
    return parts.join(', ') || 'No address provided';
  };

  const territoryAdmins = useMemo(() => {
    if (!partner.team_members || !Array.isArray(partner.team_members)) {
      return [];
    }
    
    return partner.team_members.filter((member: any) => {
      const role = (member.role || member.tallac_role || '').toString().toLowerCase();
      return role === 'territory admin' || 
             role.includes('territory admin') || 
             role.includes('admin') || 
             role.includes('owner') || 
             role.includes('director');
    }).map((member: any) => ({
      name: member.name || member.full_name || member.member_name || 'Unknown',
      role: member.role || member.tallac_role || 'Territory Admin',
      email: member.email || member.user_email || '',
      phone: member.phone || ''
    }));
  }, [partner.team_members]);

  const editTeamMember = (member: any) => {
    console.log('Edit team member:', member);
    // TODO: Open edit modal or emit event to parent
    alert(`Edit team member: ${member.name}`);
  };

  const removeTeamMember = (member: any) => {
    console.log('Remove team member:', member);
    // TODO: Confirm and remove team member
    if (confirm(`Remove ${member.name} from the team?`)) {
      alert(`Removing team member: ${member.name}`);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 ${
      mode === 'popup' ? 'h-full flex flex-col' : 'max-h-screen overflow-y-auto'
    }`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{partner.partner_name}</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeClass(partner.partner_status)}`}>
              {partner.partner_status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{partner.partner_code}</p>
        </div>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'team'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Team
            <span className="bg-gray-700 text-xs px-1.5 py-0.5 rounded">
              {partner.team_members?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-6 ${mode === 'popup' ? 'flex-1 overflow-y-auto' : ''}`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Partner Information Section */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                Partner Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Partner Code */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Partner Code</p>
                    <p className="text-sm font-medium text-white mt-0.5">{partner.partner_code}</p>
                  </div>
                </div>

                {/* Partner Name */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Partner Name</p>
                    <p className="text-sm font-medium text-white mt-0.5">{partner.partner_name}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Address</p>
                    <p className="text-sm font-medium text-white mt-0.5">{getFullAddress(partner)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Territory Admins Section */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-orange-400" />
                  Territory Admins
                </h3>
                <button
                  onClick={() => setActiveTab('team')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-900/20 border border-blue-500/30"
                >
                  <Users className="w-4 h-4" />
                  See Full Team ({partner.team_count || 0})
                </button>
              </div>

              {territoryAdmins.length > 0 ? (
                <div className="space-y-3">
                  {territoryAdmins.map((admin: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-lg p-3 border-b-2 border-orange-500/50 hover:border-orange-400 hover:translate-y-[-2px] transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-orange-500 to-orange-600">
                          {getInitials(admin.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold text-sm">{admin.name}</h4>
                            <span className="text-[9px] font-medium text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs">{admin.role}</p>
                          {admin.email && <p className="text-gray-400 text-xs">{admin.email}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <UserCog className="w-16 h-16 mx-auto mb-3 text-gray-400 opacity-50" />
                  <p className="text-sm font-medium text-gray-400">No territory admins yet</p>
                </div>
              )}
            </div>

            {/* Territories Section */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Map className="w-5 h-5 text-purple-400" />
                  Territories
                </h3>
                <button
                  onClick={onAddTerritory}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg hover:bg-blue-900/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Territory
                </button>
              </div>

              {partner.territories && partner.territories.length > 0 ? (
                <div className="space-y-3">
                  {partner.territories.map((territory: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => onOpenTerritory?.(territory)}
                      className="bg-gray-800 rounded-lg border-2 border-transparent hover:border-purple-500 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className="text-base font-bold text-white truncate">
                              {territory.territory_name}
                            </h4>
                            <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded flex-shrink-0">
                              {territory.territory_code}
                            </span>
                          </div>
                          {territory.territory_status && (
                            <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(territory.territory_status)}`}>
                              {territory.territory_status}
                            </span>
                          )}
                        </div>

                        {territory.territory_dba && (
                          <p className="text-sm text-gray-400 mb-2">{territory.territory_dba}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          {territory.territory_state && (
                            <>
                              <span className="flex items-center gap-1 text-gray-300">
                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                {territory.territory_state}
                              </span>
                              {territory.territory_region && <span className="text-gray-500">•</span>}
                            </>
                          )}
                          {territory.territory_region && (
                            <>
                              <span className="flex items-center gap-1 text-gray-300">
                                <MapPin className="w-3.5 h-3.5 text-green-400" />
                                {territory.territory_region}
                              </span>
                              {territory.zipcode_count && <span className="text-gray-500">•</span>}
                            </>
                          )}
                          {territory.zipcode_count && (
                            <span className="flex items-center gap-1 text-gray-300">
                              <Map className="w-3.5 h-3.5 text-purple-400" />
                              {territory.zipcode_count} Zipcodes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No territories assigned</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-400" />
                All Team Members ({partner.team_members?.length || 0})
              </h3>
              <button
                onClick={onAddTeamMember}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-md transition-all border border-blue-600/30 hover:border-blue-600/50"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                <span>Add Team Member</span>
              </button>
            </div>

            {partner.team_members && partner.team_members.length > 0 ? (
              <div className="space-y-2.5">
                {partner.team_members.map((member: any, index: number) => (
                  <div
                    key={index}
                    className="group bg-gray-800/50 hover:bg-gray-800/80 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                            {getInitials(member.name)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-base font-bold text-white truncate">{member.name}</h4>
                              {member.role === 'Territory Admin' && (
                                <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{member.role || 'Team Member'}</p>

                            <div className="flex flex-col gap-1.5">
                              {member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-blue-400 transition-colors w-fit"
                                >
                                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </a>
                              )}
                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-green-400 transition-colors w-fit"
                                >
                                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                  {member.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editTeamMember(member);
                            }}
                            className="p-1.5 rounded-md bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
                            title="Edit member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTeamMember(member);
                            }}
                            className="p-1.5 rounded-md bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No team members available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

