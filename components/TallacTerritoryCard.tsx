'use client';

import React from 'react';
import { MapPin, Globe, Hash, Building2 } from 'lucide-react';

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

interface TallacTerritoryCardProps {
  territory: Territory;
  isSelected?: boolean;
  viewMode?: 'card' | 'list';
  onClick?: () => void;
  onViewProspects?: () => void;
  onEdit?: () => void;
}

export default function TallacTerritoryCard({
  territory,
  isSelected = false,
  viewMode = 'card',
  onClick,
  onViewProspects,
  onEdit,
}: TallacTerritoryCardProps) {
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

  const getInitials = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const primaryPartner = territory.partners?.find((p) => p.is_primary);

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`bg-gray-800 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl border-2 cursor-pointer p-4 grid gap-6 items-center ${
          isSelected ? 'ring-2 ring-indigo-500' : ''
        } ${getStatusBorderClass(territory.territory_status)}`}
        style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr' }}
      >
        {/* Column 1: Territory Name + Code, DBA */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-bold text-white truncate">
              {territory.territory_name || territory.name}
            </h4>
            <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
              {territory.territory_code}
            </span>
          </div>
          <p className="text-sm text-gray-400 truncate">{territory.territory_dba}</p>
        </div>

        {/* Column 2: State Code, Region */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white mb-1">{territory.territory_state}</p>
          <p className="text-xs text-gray-400 truncate">{territory.territory_region}</p>
        </div>

        {/* Column 3: Partner Name, Address */}
        <div className="min-w-0">
          {primaryPartner ? (
            <>
              <p className="text-sm font-semibold text-white mb-1 truncate">
                {primaryPartner.partner_name || primaryPartner.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{primaryPartner.address}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-500 mb-1">-</p>
              <p className="text-xs text-gray-400">No partner assigned</p>
            </>
          )}
        </div>

        {/* Column 4: Status, Zipcode Count */}
        <div className="min-w-0">
          <span
            className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full mb-2 ${getStatusBadgeClass(
              territory.territory_status
            )}`}
          >
            {territory.territory_status}
          </span>
          <p className="text-xs text-gray-400">{territory.zipcode_count || 0} Zipcodes</p>
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
      } ${getStatusBorderClass(territory.territory_status)}`}
    >
      <div className="p-4">
        {/* Row 1: Name, Code, Status */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h4 className="text-lg font-bold text-white truncate">
              {territory.territory_name || territory.name}
            </h4>
            <span className="text-sm font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded flex-shrink-0">
              {territory.territory_code}
            </span>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(
              territory.territory_status
            )}`}
          >
            {territory.territory_status}
          </span>
        </div>

        {/* Row 2: DBA */}
        <p className="text-sm text-gray-400 mb-2">{territory.territory_dba}</p>

        {/* Row 3: State, Region, Zipcodes */}
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          <span className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            {territory.territory_state}
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1 text-gray-300">
            <Globe className="w-3.5 h-3.5 text-green-400" />
            {territory.territory_region}
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1 text-gray-300">
            <Hash className="w-3.5 h-3.5 text-purple-400" />
            {territory.zipcode_count || 0} Zipcodes
          </span>
        </div>

        {/* Row 4: Partner Info */}
        {primaryPartner && (
          <div className="border-t border-gray-700 pt-3 mb-3">
            <div className="rounded-lg p-3 transition-all duration-200 border-b-2 border-violet-500/50 hover:border-violet-400 hover:translate-y-[-2px]">
              <div className="flex items-start gap-3">
                {/* Company Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br from-violet-500 to-violet-600">
                  {getInitials(primaryPartner.partner_name || primaryPartner.name)}
                </div>

                {/* Partner Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-white font-semibold text-xs">
                      {primaryPartner.partner_name || primaryPartner.name}
                    </h4>
                    <span className="text-[9px] font-medium text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-tight">{primaryPartner.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

