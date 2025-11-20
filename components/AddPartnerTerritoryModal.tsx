'use client';

import { useEffect, useMemo, useState } from 'react';
import { Map, MapPin, X } from 'lucide-react';
import { showToast } from './Toast';

type Territory = {
  id: string;
  name: string;
  territory_name: string;
  territory_code?: string;
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
          territory_state: item.territory_state,
          territory_region: item.territory_region,
          territory_status: item.territory_status,
          zipcode_count: item.zipcode_count,
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
    return territories.filter((territory) => {
      if (territory.id && excludedIds.has(territory.id)) {
        return false;
      }
      if (!query) return true;
      return (
        territory.territory_name?.toLowerCase().includes(query) ||
        territory.territory_code?.toLowerCase().includes(query) ||
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Add territories</p>
            <h2 className="text-xl font-semibold text-white">Assign coverage to {partnerName}</h2>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-gray-800"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-800">
          <div className="relative flex items-center">
            <input
              type="search"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by territory name, code, state or region"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedIds.size > 0 && (
            <p className="text-xs text-blue-300 mt-2">
              {selectedIds.size} {selectedIds.size === 1 ? 'territory selected' : 'territories selected'}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
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

          {!loading && !error && filteredTerritories.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-semibold">No territories found</p>
              <p className="text-sm text-gray-500">Try adjusting your search</p>
            </div>
          )}

          {!loading && !error && filteredTerritories.map((territory) => {
            const isSelected = territory.id ? selectedIds.has(territory.id) : false;
            return (
              <button
                key={territory.id}
                type="button"
                onClick={() => territory.id && toggleSelect(territory.id)}
                className={`w-full text-left rounded-xl border-2 transition-all duration-200 px-4 py-3 bg-gray-800/70 hover:bg-gray-800 ${
                  isSelected ? 'border-blue-500' : 'border-transparent hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-white truncate">{territory.territory_name}</p>
                    {territory.territory_code && (
                      <p className="text-xs text-gray-400 mt-0.5">Code: {territory.territory_code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {territory.territory_status && (
                      <span className={`px-3 py-1 text-xs rounded-full ${STATUS_CLASSES[territory.territory_status] || 'border border-gray-600 text-gray-300'}`}>
                        {territory.territory_status}
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-500'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-300">
                  {territory.territory_state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {territory.territory_state}
                    </span>
                  )}
                  {territory.territory_region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-green-400" />
                      {territory.territory_region}
                    </span>
                  )}
                  {typeof territory.zipcode_count === 'number' && (
                    <span className="flex items-center gap-1">
                      <Map className="w-3.5 h-3.5 text-purple-400" />
                      {territory.zipcode_count} Zipcodes
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900">
          <div className="text-sm text-gray-400">
            {selectedIds.size === 0
              ? 'Select territories to assign'
              : `${selectedIds.size} ${selectedIds.size === 1 ? 'territory' : 'territories'} selected`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || selectedIds.size === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Territories'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
