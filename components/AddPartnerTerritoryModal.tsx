'use client';

import { useEffect, useMemo, useState } from 'react';
import { Map, MapPin, Globe, Search, X } from 'lucide-react';
import { showToast } from './Toast';

type Territory = {
  id: string;
  name: string;
  territory_name: string;
  territory_code?: string;
  territory_dba?: string;
  territory_state?: string;
  territory_region?: string;
  territory_status?: string;
  zipcode_count?: number;
};

type ExistingTerritory = {
  id?: string;
  name?: string;
  territory?: string;
  territory_name?: string;
};

interface AddPartnerTerritoryModalProps {
  partnerId: string;
  partnerName: string;
  existingTerritories?: ExistingTerritory[];
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_CLASSES: Record<string, string> = {
  Active: 'bg-green-600/20 text-green-300 border border-green-500/30',
  Pending: 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30',
  Inactive: 'bg-red-600/20 text-red-300 border border-red-500/30',
};

export default function AddPartnerTerritoryModal({
  partnerId,
  partnerName,
  existingTerritories = [],
  onClose,
  onSuccess,
}: AddPartnerTerritoryModalProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const excludedIds = useMemo(() => {
    return new Set(
      (existingTerritories || [])
        .map((item) => item.territory || item.id || item.name || item.territory_name)
        .filter(Boolean) as string[]
    );
  }, [existingTerritories]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const fetchTerritories = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/territories?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token ?? ''}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || 'Failed to load territories');
        }

        const data = await response.json();
        const normalized: Territory[] = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.id || item.name,
          name: item.name,
          territory_name: item.territory_name,
          territory_code: item.territory_code,
          territory_dba: item.territory_dba || item.doing_business_as,
          territory_state: item.territory_state,
          territory_region: item.territory_region,
          territory_status: item.territory_status || item.status,
          zipcode_count: item.zipcode_count || (item.zip_codes ? item.zip_codes.length : 0),
        }));

        setTerritories(normalized.filter((territory) => Boolean(territory.id)));
      } catch (fetchError: any) {
        console.error(fetchError);
        setError(fetchError.message || 'Unable to load territories');
      } finally {
        setLoading(false);
      }
    };

    fetchTerritories();
  }, []);

  const filteredTerritories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const available = territories.filter((territory) => {
      if (territory.id && excludedIds.has(territory.id)) {
        return false;
      }
      return true;
    });

    // If no search query, show only first 2 territories
    if (!query) {
      return available.slice(0, 2);
    }

    // If search query exists, filter and show all matching results
    return available.filter((territory) => {
      return (
        territory.territory_name?.toLowerCase().includes(query) ||
        territory.territory_code?.toLowerCase().includes(query) ||
        territory.territory_dba?.toLowerCase().includes(query) ||
        territory.territory_state?.toLowerCase().includes(query) ||
        territory.territory_region?.toLowerCase().includes(query)
      );
    });
  }, [territories, search, excludedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedIds.size) {
      setError('Please select at least one territory.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/partners/${partnerId}/territories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ territories: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to add territories');
      }

      showToast('Territories added successfully', 'success');
      onSuccess();
      onClose();
    } catch (submitError: any) {
      console.error(submitError);
      setError(submitError.message || 'Unable to add territories');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130] flex items-center justify-center p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Territories to Partner</h2>
            <p className="text-sm text-gray-400 mt-1">Assign territories to {partnerName}</p>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="search"
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-2.5 pl-10 pr-3 placeholder-gray-400"
              placeholder="Search territories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4" />
              Loading territories...
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-900/20 border border-red-600/40 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!loading && !error && filteredTerritories.length === 0 && search.trim() && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-semibold">No territories found</p>
              <p className="text-sm text-gray-500">Try adjusting your search</p>
            </div>
          )}

          {!loading && !error && filteredTerritories.length === 0 && !search.trim() && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <p className="text-lg font-semibold mb-2">Start typing to search territories</p>
              <p className="text-sm text-gray-500">Type territory name, code, state, or region to find and select territories</p>
            </div>
          )}

          {!loading && !error && filteredTerritories.map((territory) => {
            const isSelected = territory.id ? selectedIds.has(territory.id) : false;
            return (
              <div
                key={territory.id}
                onClick={() => territory.id && toggleSelect(territory.id)}
                className={`rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'border-purple-500 bg-gray-800' 
                    : 'border-transparent bg-gray-800/50 hover:border-purple-500/50'
                }`}
              >
                <div className="p-4">
                  {/* Row 1: Name, Code, Status, Checkbox */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white truncate">{territory.territory_name}</h4>
                      {territory.territory_code && (
                        <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded flex-shrink-0">
                          {territory.territory_code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {territory.territory_status && (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          territory.territory_status === 'Active' 
                            ? 'bg-green-600 text-white'
                            : territory.territory_status === 'Pending'
                            ? 'bg-yellow-600 text-white'
                            : territory.territory_status === 'Inactive'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {territory.territory_status}
                        </span>
                      )}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-500 bg-gray-700'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2: Description/DBA */}
                  {territory.territory_dba && (
                    <p className="text-sm text-gray-400 mb-2">{territory.territory_dba}</p>
                  )}
                  
                  {/* Row 3: State, Region, Zipcodes */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {territory.territory_state && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {territory.territory_state}
                      </span>
                    )}
                    {territory.territory_state && territory.territory_region && (
                      <span className="text-gray-500">•</span>
                    )}
                    {territory.territory_region && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <Globe className="w-3.5 h-3.5 text-green-400" />
                        {territory.territory_region}
                      </span>
                    )}
                    {(territory.territory_state || territory.territory_region) && territory.zipcode_count && (
                      <span className="text-gray-500">•</span>
                    )}
                    {typeof territory.zipcode_count === 'number' && territory.zipcode_count > 0 && (
                      <span className="flex items-center gap-1 text-gray-300">
                        <Map className="w-3.5 h-3.5 text-purple-400" />
                        {territory.zipcode_count} Zipcodes
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800">
          <div className="text-sm text-gray-400 flex-1">
            {selectedIds.size === 0
              ? 'Select territories to assign'
              : `${selectedIds.size} ${selectedIds.size === 1 ? 'territory' : 'territories'} selected`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || selectedIds.size === 0}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              `Add ${selectedIds.size} ${selectedIds.size === 1 ? 'Territory' : 'Territories'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
