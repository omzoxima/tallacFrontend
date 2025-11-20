'use client';

import { useState } from 'react';
import {
  X,
  MapPin,
  Globe,
  Map,
  Mail,
  Phone,
  Building2,
  ChevronRight,
  Users,
  ClipboardList,
  PencilLine,
} from 'lucide-react';

interface TerritoryDetailsProps {
  territory: any;
  mode?: 'popup' | 'split';
  showCloseButton?: boolean;
  onClose?: () => void;
  onOpenPartner?: (partner: any) => void;
  onViewProspects?: (territory: any) => void;
  onViewActivities?: (territory: any) => void;
  onEditTerritory?: (territory: any) => void;
}

export default function TerritoryDetails({
  territory,
  mode = 'split',
  showCloseButton = true,
  onClose,
  onOpenPartner,
  onViewProspects,
  onViewActivities,
  onEditTerritory,
}: TerritoryDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'zipcodes'>('overview');
  const zipList = territory?.zip_codes || territory?.zipcodes || [];

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

  const formatNumber = (num: number) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  const getZipcodesPreview = () => {
    if (!zipList || zipList.length === 0) {
      return 'No zipcodes available';
    }
    return zipList
      .slice(0, 6)
      .map((z: any) => z.zip_code || z.zip)
      .join(', ');
  };

  const getValidZipcodesCount = () => {
    if (!zipList) return 0;
    return zipList.filter((z: any) => !z.not_found).length;
  };

  const getInvalidZipcodesCount = () => {
    if (!zipList) return 0;
    return zipList.filter((z: any) => z.not_found).length;
  };

  const getTotalPopulation = () => {
    if (!zipList) return 0;
    return zipList
      .filter((z: any) => !z.not_found)
      .reduce((sum: number, z: any) => sum + (z.population || 0), 0);
  };

  const getAverageDensity = () => {
    if (!zipList) return 0;
    const validZipcodes = zipList.filter((z: any) => !z.not_found && z.density > 0);
    if (validZipcodes.length === 0) return 0;
    const totalDensity = validZipcodes.reduce((sum: number, z: any) => sum + z.density, 0);
    return totalDensity / validZipcodes.length;
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 ${
      mode === 'popup' ? 'h-full flex flex-col' : 'max-h-screen overflow-y-auto'
    }`}>
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{territory.territory_name}</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeClass(territory.territory_status)}`}>
              {territory.territory_status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{territory.territory_dba}</p>
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium ${
            onViewProspects ? 'border-gray-600 text-gray-200 hover:bg-gray-700/70' : 'border-gray-800 text-gray-500 cursor-not-allowed'
          } transition-colors`}
          onClick={() => onViewProspects?.(territory)}
          disabled={!onViewProspects}
        >
          <Users className="w-4 h-4" />
          Prospects
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium ${
            onViewActivities ? 'border-gray-600 text-gray-200 hover:bg-gray-700/70' : 'border-gray-800 text-gray-500 cursor-not-allowed'
          } transition-colors`}
          onClick={() => onViewActivities?.(territory)}
          disabled={!onViewActivities}
        >
          <ClipboardList className="w-4 h-4" />
          Activities
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium ${
            onEditTerritory ? 'border-gray-600 text-gray-200 hover:bg-gray-700/70' : 'border-gray-800 text-gray-500 cursor-not-allowed'
          } transition-colors`}
          onClick={() => onEditTerritory?.(territory)}
          disabled={!onEditTerritory}
        >
          <PencilLine className="w-4 h-4" />
          Edit
        </button>
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
            onClick={() => setActiveTab('zipcodes')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'zipcodes'
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Zipcodes
            <span className="bg-gray-700 text-xs px-1.5 py-0.5 rounded">
              {zipList.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-6 ${mode === 'popup' ? 'flex-1 overflow-y-auto' : ''}`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Territory Information Section */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                Territory Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Territory Code */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Territory Code</p>
                    <p className="text-sm font-medium text-white mt-0.5">{territory.territory_code}</p>
                  </div>
                </div>

                {/* Region */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Region</p>
                    <p className="text-sm font-medium text-white mt-0.5">{territory.territory_region}</p>
                  </div>
                </div>

                {/* State */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">State</p>
                    <p className="text-sm font-medium text-white mt-0.5">{territory.territory_state}</p>
                  </div>
                </div>

                {/* Zipcode Count */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <Map className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Zipcodes</p>
                    <p className="text-sm font-medium text-white mt-0.5">
                      {zipList.length} Zipcodes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-400" />
                Contact Information
              </h3>

              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`mailto:${territory.territory_email}`}
                      className="text-sm font-medium text-white hover:text-gray-300 transition-colors truncate block"
                    >
                      {territory.territory_email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {territory.territory_mobile && (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-3 h-3 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`tel:${territory.territory_mobile}`}
                        className="text-sm font-medium text-white hover:text-gray-300 transition-colors truncate block"
                      >
                        {territory.territory_mobile}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Franchise Partners Section */}
            {territory.partners && territory.partners.length > 0 && (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  Franchise Partners
                </h3>

                <div className="space-y-3">
                  {territory.partners.map((partner: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => onOpenPartner?.(partner)}
                      className={`rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                        partner.is_primary
                          ? 'border-b-2 border-violet-500/50 hover:border-violet-400 hover:translate-y-[-2px]'
                          : 'border-b-2 border-blue-500/50 hover:border-blue-400 hover:translate-y-[-2px]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            partner.is_primary
                              ? 'bg-gradient-to-br from-violet-500 to-violet-600'
                              : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}
                        >
                          {getInitials(partner.partner_name || partner.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-semibold text-sm">
                              {partner.partner_name || partner.name}
                            </h4>
                            {partner.is_primary && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-xs">{partner.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zipcodes Preview Section */}
            <div className="bg-gray-700/30 hover:bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-purple-500 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Map className="w-4 h-4 text-purple-400" />
                  Coverage Zipcodes
                </h3>
                <button
                  onClick={() => setActiveTab('zipcodes')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed">
                {getZipcodesPreview()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'zipcodes' && (
          <div className="space-y-3">
            {/* Header with count and statistics */}
            {zipList && zipList.length > 0 && (
              <>
                <div className="mb-4 pb-3 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Coverage Zipcodes</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-sm font-medium bg-purple-600/20 text-purple-300 rounded-full border border-purple-500/30">
                        {getValidZipcodesCount()} Valid
                      </span>
                      {getInvalidZipcodesCount() > 0 && (
                        <span className="px-3 py-1 text-sm font-medium bg-red-600/20 text-red-300 rounded-full border border-red-500/30">
                          {getInvalidZipcodesCount()} Not Found
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statistics Summary */}
                  {getTotalPopulation() > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-700/20 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Total Population</p>
                        <p className="text-sm font-bold text-white">{formatNumber(getTotalPopulation())}</p>
                      </div>
                      <div className="bg-gray-700/20 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Avg Density</p>
                        <p className="text-sm font-bold text-white">
                          {getAverageDensity().toFixed(1)}/km²
                        </p>
                      </div>
                      <div className="bg-gray-700/20 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Coverage</p>
                        <p className="text-sm font-bold text-white">{zipList.length} ZIP</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {zipList.map((zipcode: any, index: number) => {
                    const zipValue = zipcode.zip_code || zipcode.zip;
                    const cityName = zipcode.city || zipcode.city_name || 'Unknown';
                    const stateName = zipcode.state || zipcode.state_name || territory.territory_state || 'Unknown';
                    return (
                    <div
                      key={`${zipValue}-${index}`}
                      className={`rounded-lg p-3 border transition-all duration-200 ${
                        zipcode.not_found
                          ? 'bg-red-900/10 hover:bg-red-900/20 border-red-600/30'
                          : 'bg-gray-700/30 hover:bg-gray-700/50 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                            zipcode.not_found
                              ? 'bg-red-600/20 border-red-500/30'
                              : 'bg-purple-600/20 border-purple-500/30'
                          }`}
                        >
                          <span
                            className={`text-sm font-bold ${
                              zipcode.not_found ? 'text-red-300' : 'text-purple-300'
                            }`}
                          >
                            {zipValue}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              zipcode.not_found ? 'text-red-300' : 'text-white'
                            }`}
                          >
                            {cityName}
                          </p>
                          <p
                            className={`text-xs truncate ${
                              zipcode.not_found ? 'text-red-400/70' : 'text-gray-400'
                            }`}
                          >
                            {stateName}
                          </p>
                        </div>

                        {!zipcode.not_found && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{zipcode.timezone || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </>
            )}

            {(!zipList || zipList.length === 0) && (
              <div className="text-center py-16 text-gray-400">
                <Map className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-gray-300 mb-1">No zipcodes available</p>
                <p className="text-sm text-gray-500">
                  This territory doesn't have any zipcodes assigned yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

