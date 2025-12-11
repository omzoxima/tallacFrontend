'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Hash, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface Territory {
  id?: string;
  name?: string;
  territory_name?: string;
  territory_code?: string;
  territory_status?: string;
  territory_dba?: string;
  territory_state?: string;
  territory_region?: string;
  zipcode_count?: number;
}

interface AddTerritoryToPartnerModalProps {
  partnerId: string;
  partnerName: string;
  existingTerritories?: Array<{ id?: string; territory?: string; name?: string }>;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function AddTerritoryToPartnerModal({
  partnerId,
  partnerName,
  existingTerritories = [],
  onClose,
  onSuccess,
}: AddTerritoryToPartnerModalProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedTerritories, setSelectedTerritories] = useState<Territory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadTerritories();
  }, []);

  const loadTerritories = async () => {
    setLoading(true);
    try {
      const result = await api.getTerritories({});
      if (result.success && result.data) {
        setTerritories(result.data);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to load territories');
    } finally {
      setLoading(false);
    }
  };

  const filteredTerritories = territories.filter((t) => {
    const existingIds = existingTerritories.map((et) => et.territory || et.name || et.id);
    if (existingIds.includes(t.id || t.name)) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (t.territory_name || '').toLowerCase().includes(query) ||
        (t.territory_code || '').toLowerCase().includes(query) ||
        (t.territory_dba || '').toLowerCase().includes(query) ||
        (t.territory_state || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const toggleTerritory = (territory: Territory) => {
    const index = selectedTerritories.findIndex((t) => (t.id || t.name) === (territory.id || territory.name));
    if (index > -1) {
      setSelectedTerritories(selectedTerritories.filter((_, i) => i !== index));
    } else {
      setSelectedTerritories([...selectedTerritories, territory]);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      Active: 'bg-green-600 text-white',
      Pending: 'bg-yellow-600 text-white',
      Inactive: 'bg-red-600 text-white',
    };
    return statusMap[status || ''] || 'bg-gray-500 text-white';
  };

  const handleSubmit = async () => {
    if (selectedTerritories.length === 0) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const territoryIds = selectedTerritories.map((t) => t.id || t.name || '').filter(Boolean);
      const result = await api.addTerritoriesToPartner(partnerId, territoryIds);
      if (result.success) {
        onSuccess(result.data);
      } else {
        setErrorMessage(result.message || 'Failed to add territories');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Territories to Partner</h2>
            <p className="text-sm text-gray-400 mt-1">Assign territories to {partnerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="search"
                placeholder="Search territories..."
                className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 pl-10 pr-3 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading territories...</p>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error loading territories</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          ) : filteredTerritories.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-xl text-gray-400 mb-2">No territories found</p>
              <p className="text-gray-500">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTerritories.map((territory) => {
                const isSelected = selectedTerritories.some(
                  (t) => (t.id || t.name) === (territory.id || territory.name)
                );
                return (
                  <div
                    key={territory.id || territory.name}
                    onClick={() => toggleTerritory(territory)}
                    className={`rounded-lg border-2 transition-all duration-200 cursor-pointer p-4 ${
                      isSelected
                        ? 'border-purple-500 bg-gray-800'
                        : 'border-transparent bg-gray-800/50 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h4 className="text-base font-bold text-white truncate">
                          {territory.territory_name}
                        </h4>
                        <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded flex-shrink-0">
                          {territory.territory_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {territory.territory_status && (
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(
                              territory.territory_status
                            )}`}
                          >
                            {territory.territory_status}
                          </span>
                        )}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-500 bg-gray-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </div>
                    {territory.territory_dba && (
                      <p className="text-sm text-gray-400 mb-2">{territory.territory_dba}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {territory.territory_state && (
                        <span className="flex items-center gap-1 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          {territory.territory_state}
                        </span>
                      )}
                      {territory.territory_region && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-300">{territory.territory_region}</span>
                        </>
                      )}
                      {territory.zipcode_count && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="flex items-center gap-1 text-gray-300">
                            <Hash className="w-3.5 h-3.5 text-purple-400" />
                            {territory.zipcode_count} Zipcodes
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Count */}
          {selectedTerritories.length > 0 && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
              <p className="text-sm text-blue-300">
                {selectedTerritories.length} {selectedTerritories.length === 1 ? 'territory' : 'territories'} selected
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedTerritories.length === 0}
            type="button"
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${selectedTerritories.length} ${selectedTerritories.length === 1 ? 'Territory' : 'Territories'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

