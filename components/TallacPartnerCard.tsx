'use client';

import React from 'react';
import { MapPin, Users, UserCheck, UsersRound } from 'lucide-react';

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
}

interface TallacPartnerCardProps {
  partner: Partner;
  isSelected?: boolean;
  viewMode?: 'card' | 'list';
  onClick?: () => void;
}

export default function TallacPartnerCard({
  partner,
  isSelected = false,
  viewMode = 'card',
  onClick,
}: TallacPartnerCardProps) {
  const getStatusBorderClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      Active: 'border-transparent hover:border-green-500',
      Pending: 'border-transparent hover:border-yellow-500',
      Inactive: 'border-transparent hover:border-red-500',
    };
    return statusMap[status || ''] || 'border-transparent hover:border-gray-500';
  };

  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      Active: 'bg-green-600 text-white',
      Pending: 'bg-yellow-600 text-white',
      Inactive: 'bg-red-600 text-white',
    };
    return statusMap[status || ''] || 'bg-gray-500 text-white';
  };

  const getFullAddress = (partner: Partner) => {
    const parts = [];
    if (partner.partner_address) parts.push(partner.partner_address);
    if (partner.partner_city) parts.push(partner.partner_city);
    if (partner.partner_state) parts.push(partner.partner_state);
    return parts.join(', ') || 'No address provided';
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`bg-gray-800 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border-2 cursor-pointer p-4 grid gap-4 items-center ${
          isSelected ? 'ring-2 ring-indigo-500' : ''
        } ${getStatusBorderClass(partner.partner_status)}`}
        style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr' }}
      >
        {/* Column 1: Partner Name + Code */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-bold text-white truncate">{partner.partner_name}</h4>
            <span className="text-xs font-mono text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
              {partner.partner_code}
            </span>
          </div>
          <p className="text-sm text-gray-400 truncate">{getFullAddress(partner)}</p>
        </div>

        {/* Column 2: Territory Count */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white mb-1">{partner.territory_count || 0}</p>
          <p className="text-xs text-gray-400">Territories</p>
        </div>

        {/* Column 3: Admin Count */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white mb-1">{partner.admin_count || 0}</p>
          <p className="text-xs text-gray-400">Admins</p>
        </div>

        {/* Column 4: Team Size */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white mb-1">{partner.team_count || 0}</p>
          <p className="text-xs text-gray-400">Team Size</p>
        </div>

        {/* Column 5: Status */}
        <div className="min-w-0">
          <span
            className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(
              partner.partner_status
            )}`}
          >
            {partner.partner_status}
          </span>
        </div>
      </div>
    );
  }

  // Card View
  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border-2 cursor-pointer flex flex-col ${
        isSelected ? 'ring-2 ring-indigo-500' : ''
      } ${getStatusBorderClass(partner.partner_status)}`}
    >
      <div className="p-4">
        {/* Row 1: Name, Code, Status */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h4 className="text-lg font-bold text-white truncate">{partner.partner_name}</h4>
            <span className="text-sm font-mono text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded flex-shrink-0">
              {partner.partner_code}
            </span>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(
              partner.partner_status
            )}`}
          >
            {partner.partner_status}
          </span>
        </div>

        {/* Row 2: Address */}
        <p className="text-sm text-gray-400 mb-3">{getFullAddress(partner)}</p>

        {/* Row 3: Stats */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            {partner.territory_count || 0} Territories
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1 text-gray-300">
            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
            {partner.admin_count || 0} Admins
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1 text-gray-300">
            <UsersRound className="w-3.5 h-3.5 text-green-400" />
            {partner.team_count || 0} Team Size
          </span>
        </div>
      </div>
    </div>
  );
}

