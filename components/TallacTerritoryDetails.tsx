'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, ClipboardList, Edit, MapPin, Globe, Hash, Mail, Phone, Building2, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface Territory {
  id?: string;
  name?: string;
  territory_name?: string;
  territory_code?: string;
  territory_dba?: string;
  territory_state?: string;
  territory_region?: string;
  territory_status?: string;
  territory_email?: string;
  territory_mobile?: string;
  territory_zipcodes?: string;
  zipcode_count?: number;
  partners?: Array<{
    id?: string;
    name?: string;
    partner_name?: string;
    is_primary?: boolean;
    address?: string;
  }>;
}

interface TallacTerritoryDetailsProps {
  territory: Territory;
  mode?: 'split' | 'popup';
  showCloseButton?: boolean;
  isCorporateAdmin?: boolean;
  onClose?: () => void;
  onOpenPartner?: (partner: any) => void;
  onViewProspects?: (territory: Territory) => void;
  onEdit?: (territory: Territory) => void;
}

export default function TallacTerritoryDetails({
  territory,
  mode = 'split',
  showCloseButton = true,
  isCorporateAdmin = false,
  onClose,
  onOpenPartner,
  onViewProspects,
  onEdit,
}: TallacTerritoryDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'zipcodes'>('overview');
  const [zipcodesLoaded, setZipcodesLoaded] = useState(false);
  const [detailedZipcodes, setDetailedZipcodes] = useState<any[]>([]);
  const [loadingZipcodes, setLoadingZipcodes] = useState(false);

  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      Active: 'bg-green-600 text-white',
      Pending: 'bg-yellow-600 text-white',
      Inactive: 'bg-red-600 text-white',
    };
    return statusMap[status || ''] || 'bg-gray-500 text-white';
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

  const parsedZipcodes = useMemo(() => {
    if (zipcodesLoaded && detailedZipcodes.length > 0) {
      return detailedZipcodes;
    }

    const zipcodesStr = territory.territory_zipcodes || '';
    if (!zipcodesStr || typeof zipcodesStr !== 'string') {
      return [];
    }

    const zipcodesList = zipcodesStr
      .split(',')
      .map((z) => z.trim())
      .filter((z) => z.length > 0);

    return zipcodesList.map((zip) => ({
      zip: zip,
      city: 'Loading...',
      state_name: territory.territory_state || '',
      county_name: '',
      population: 0,
    }));
  }, [territory.territory_zipcodes, territory.territory_state, zipcodesLoaded, detailedZipcodes]);

  const zipcodesCount = useMemo(() => {
    return territory.zipcode_count || parsedZipcodes.length;
  }, [territory.zipcode_count, parsedZipcodes.length]);

  const getZipcodesPreview = () => {
    if (!parsedZipcodes || parsedZipcodes.length === 0) {
      return 'No zipcodes available';
    }
    const preview = parsedZipcodes
      .slice(0, 20)
      .map((z) => z.zip)
      .join(', ');
    if (parsedZipcodes.length > 20) {
      return preview + '...';
    }
    return preview;
  };

  useEffect(() => {
    if (activeTab === 'zipcodes' && !zipcodesLoaded && territory.name) {
      loadZipcodeDetails();
    }
  }, [activeTab, territory.name]);

  const loadZipcodeDetails = async () => {
    if (!territory.name) return;
    setLoadingZipcodes(true);
    try {
      const result = await api.getTerritoryZipcodeDetails(territory.name);
      if (result.success && result.data) {
        setDetailedZipcodes(result.data);
        setZipcodesLoaded(true);
      }
    } catch (error) {
      console.error('Error loading zipcode details:', error);
    } finally {
      setLoadingZipcodes(false);
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 ${
        mode === 'popup' ? 'h-full flex flex-col' : 'max-h-screen overflow-y-auto'
      }`}
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{territory.territory_name || territory.name}</h2>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeClass(
                territory.territory_status
              )}`}
            >
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

      {/* Action Bar */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="bg-gray-900/50 rounded-lg p-1 backdrop-blur-sm border border-gray-700/50">
          <div className="grid grid-cols-3 gap-1">
            {/* Prospects Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProspects?.(territory);
              }}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-orange-600/20 text-gray-300 hover:text-orange-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-orange-600/30 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/5 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <Users className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Prospects</span>
            </button>

            {/* Activities Button */}
            <button className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-blue-600/30 hover:scale-105 active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <ClipboardList className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Activities</span>
            </button>

            {/* Edit Button */}
            {isCorporateAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(territory);
                }}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-purple-600/20 text-gray-300 hover:text-purple-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-purple-600/30 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
                <Edit className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Edit</span>
              </button>
            )}
          </div>
        </div>
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
            <span className="bg-gray-700 text-xs px-1.5 py-0.5 rounded">{zipcodesCount || 0}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-6 ${mode === 'popup' ? 'flex-1 overflow-y-auto' : ''}`}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Territory Information Section */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-400" />
                Territory Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Territory Code */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Hash className="w-4 h-4 text-purple-400" />
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
                    <Hash className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Zipcodes</p>
                    <p className="text-sm font-medium text-white mt-0.5">{zipcodesCount} Zipcodes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            {(territory.territory_email || territory.territory_mobile) && (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-400" />
                  Contact Information
                </h3>

                <div className="space-y-3">
                  {territory.territory_email && (
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
                  )}

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
            )}

            {/* Franchise Partners Section */}
            {territory.partners && territory.partners.length > 0 && (
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  Franchise Partners
                </h3>

                <div className="space-y-3">
                  {territory.partners.map((partner, index) => (
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
                  <Hash className="w-4 h-4 text-purple-400" />
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
              <div className="text-sm text-gray-300 leading-relaxed">{getZipcodesPreview()}</div>
            </div>
          </div>
        )}

        {/* Zipcodes Tab */}
        {activeTab === 'zipcodes' && (
          <div>
            {loadingZipcodes ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 text-purple-400 mx-auto mb-4 border-4 border-purple-400 border-t-transparent rounded-full"></div>
                  <p className="text-sm text-gray-400">Loading zipcode details...</p>
                </div>
              </div>
            ) : parsedZipcodes && parsedZipcodes.length > 0 ? (
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-400" />
                    Coverage Zipcodes
                  </h3>
                  <span className="px-3 py-1 text-xs font-semibold bg-purple-600/20 text-purple-400 rounded-full border border-purple-500/30">
                    {zipcodesCount} Total
                  </span>
                </div>

                <div className="space-y-2">
                  {parsedZipcodes.map((zipcode, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Hash className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0 text-gray-300">
                        <span className="font-semibold text-white">{zipcode.zip}</span>
                        <span className="text-gray-600">•</span>
                        <span className="truncate">{zipcode.city || 'Unknown'}</span>
                        <span className="text-gray-600">•</span>
                        <span className="truncate">{zipcode.county_name || 'Unknown'}</span>
                        <span className="text-gray-600">•</span>
                        <span>{zipcode.state_name || territory.territory_state || 'Unknown'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Hash className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-gray-300 mb-1">No zipcodes available</p>
                <p className="text-sm text-gray-500">This territory doesn't have any zipcodes assigned yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

