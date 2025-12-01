'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { showToast } from './Toast';

interface Territory {
  id: string;
  territory_name: string;
  territory_code?: string;
  territory_state?: string;
  territory_region?: string;
}

interface PartnerTerritory {
  partner_id: string;
  partner_name: string;
  territory_id: string;
  territory_name: string;
  territory_code?: string;
  territory_state?: string;
  territory_region?: string;
}

interface ManageUserTerritoryModalProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    full_name?: string;
    territories?: any[];
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManageUserTerritoryModal({
  user,
  onClose,
  onSuccess,
}: ManageUserTerritoryModalProps) {
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<string>>(new Set());

  const [availableTerritories, setAvailableTerritories] = useState<PartnerTerritory[]>([]);
  const [selectedTerritoryIds, setSelectedTerritoryIds] = useState<Set<string>>(new Set());
  const [territorySearch, setTerritorySearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load partners (with territories)
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoadingPartners(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/partners?limit=1000`, {
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load partners');
        }
        const data = await response.json();
        setPartners(Array.isArray(data) ? data : []);

        // Build territory list from all partners for initial state
        const allTerritories: PartnerTerritory[] = [];
        (Array.isArray(data) ? data : []).forEach((p: any) => {
          (p.territories || []).forEach((t: any) => {
            if (t.territory) {
              allTerritories.push({
                partner_id: p.id,
                partner_name: p.partner_name,
                territory_id: t.territory,
                territory_name: t.territory_name,
                territory_code: t.territory_code,
                territory_state: t.territory_state,
                territory_region: t.territory_region,
              });
            }
          });
        });
        setAvailableTerritories(allTerritories);
      } catch (error) {
        console.error('Error loading partners:', error);
        showToast('Failed to load partners/territories', 'error');
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, []);

  // Pre-select existing user territories
  useEffect(() => {
    if (user?.territories && Array.isArray(user.territories)) {
      const existing = new Set<string>();
      user.territories.forEach((t: any) => {
        const id = t.territory || t.territory_id || t.id || t.name;
        if (id) existing.add(id);
      });
      setSelectedTerritoryIds(existing);
    }
  }, [user]);

  const filteredPartners = useMemo(() => {
    const q = partnerSearch.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(
      (p) =>
        (p.partner_name || '').toLowerCase().includes(q) ||
        (p.partner_code || '').toLowerCase().includes(q)
    );
  }, [partners, partnerSearch]);

  const allPartnerTerritories = useMemo(() => {
    const result: PartnerTerritory[] = [];
    partners.forEach((p: any) => {
      (p.territories || []).forEach((t: any) => {
        if (t.territory) {
          result.push({
            partner_id: p.id,
            partner_name: p.partner_name,
            territory_id: t.territory,
            territory_name: t.territory_name,
            territory_code: t.territory_code,
            territory_state: t.territory_state,
            territory_region: t.territory_region,
          });
        }
      });
    });
    return result;
  }, [partners]);

  const filteredTerritories = useMemo(() => {
    const q = territorySearch.trim().toLowerCase();

    let base = allPartnerTerritories;

    // If partners selected, show only their territories
    if (selectedPartnerIds.size) {
      base = base.filter((t) => selectedPartnerIds.has(t.partner_id));
    }

    if (!q) {
      // No search: limit to first few to keep list light
      return base.slice(0, 20);
    }

    return base.filter((t) => {
      return (
        t.territory_name?.toLowerCase().includes(q) ||
        t.territory_code?.toLowerCase().includes(q) ||
        t.territory_state?.toLowerCase().includes(q) ||
        t.territory_region?.toLowerCase().includes(q) ||
        t.partner_name?.toLowerCase().includes(q)
      );
    });
  }, [allPartnerTerritories, selectedPartnerIds, territorySearch]);

  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      return next;
    });
  };

  const toggleTerritory = (territoryId: string) => {
    setSelectedTerritoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(territoryId)) next.delete(territoryId);
      else next.add(territoryId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user?.id && !user?.name) {
      showToast('Invalid user for territory assignment', 'error');
      return;
    }
    if (!selectedTerritoryIds.size) {
      showToast('Please select at least one territory', 'info');
      return;
    }

    try {
      setSaving(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const userId = user.id || user.name;

      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          territories: Array.from(selectedTerritoryIds),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save territories');
      }

      showToast('Territories updated successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving user territories:', error);
      showToast(error.message || 'Unable to save territories', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedPartners = useMemo(() => {
    return partners.filter((p) => selectedPartnerIds.has(p.id));
  }, [partners, selectedPartnerIds]);

  const unselectedFilteredPartners = useMemo(() => {
    return filteredPartners.filter((p) => !selectedPartnerIds.has(p.id));
  }, [filteredPartners, selectedPartnerIds]);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-4xl my-auto flex flex-col"
        style={{ maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-400" />
              Manage Territories
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              for{' '}
              <span className="font-semibold text-purple-300">
                {user?.full_name || user?.email || user?.name || 'User'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Partners selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <span>Partners</span>
            </label>
            {loadingPartners ? (
              <div className="text-sm text-gray-400">Loading partners...</div>
            ) : (
              <div className="space-y-3">
                {/* Selected partners chips */}
                {selectedPartners.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedPartners.map((p) => (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/50 rounded-lg text-sm font-medium text-purple-300 group hover:bg-purple-600/30 transition-all"
                      >
                        <span>{p.partner_name}</span>
                        <button
                          type="button"
                          onClick={() => togglePartner(p.id)}
                          className="hover:bg-purple-500/30 rounded p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Partner search + dropdown */}
                <div className="relative">
                  <input
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    type="text"
                    placeholder="Search partners to add..."
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5 pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  {/* Dropdown results - show only unselected partners */}
                  {partnerSearch.trim() && unselectedFilteredPartners.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl max-h-56 overflow-y-auto">
                      {unselectedFilteredPartners.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePartner(p.id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-600 text-gray-200 text-sm transition-colors flex items-center gap-2 border-b border-gray-600 last:border-0"
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600/30 text-xs font-bold text-purple-200">
                            {(p.partner_name || '?')
                              .split(' ')
                              .map((w: string) => w[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                          <span className="flex-1 truncate">
                            {p.partner_name}
                            {p.partner_code && (
                              <span className="ml-2 text-[11px] font-mono text-gray-400">
                                {p.partner_code}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Territories selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              Territories
              <span className="ml-auto text-xs font-normal text-gray-500">
                {selectedTerritoryIds.size} selected
              </span>
            </label>

            {selectedPartnerIds.size === 0 ? (
              <div className="text-center py-8 bg-gray-800/60 rounded-lg border border-dashed border-gray-600 text-xs text-gray-400">
                Select at least one partner above to see available territories.
              </div>
            ) : (
              <>
                {/* Territory search */}
                <div className="mb-3">
                  <div className="relative">
                    <input
                      value={territorySearch}
                      onChange={(e) => setTerritorySearch(e.target.value)}
                      type="text"
                      placeholder="Search territories by name, code, state, region..."
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5 pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto pr-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  {filteredTerritories.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      No territories found for current filters
                    </div>
                  ) : (
                    filteredTerritories.map((t) => {
                      const id = t.territory_id;
                      const selected = selectedTerritoryIds.has(id);
                      return (
                        <div
                          key={`${t.partner_id}-${id}`}
                          onClick={() => toggleTerritory(id)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selected
                              ? 'bg-gray-700 border-purple-500'
                              : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="font-medium text-gray-200 truncate">
                                {t.territory_name}
                              </div>
                              {t.territory_code && (
                                <span className="text-[11px] font-mono text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded">
                                  {t.territory_code}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
                              {t.territory_state && <span>{t.territory_state}</span>}
                              {t.territory_region && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span>{t.territory_region}</span>
                                </>
                              )}
                              {t.partner_name && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-gray-300">
                                    Partner: <span className="text-purple-300">{t.partner_name}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              selected ? 'bg-blue-600 border-blue-600 scale-110' : 'border-gray-500'
                            }`}
                          >
                            {selected && (
                              <svg
                                className="w-3.5 h-3.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  Click territories to select/deselect them
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors hidden sm:block"
          >
            Skip for now
          </button>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors border border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 sm:flex-none px-4 py-2 text-white text-sm font-medium rounded-lg transition-all ${
                !saving && selectedTerritoryIds.size
                  ? 'bg-blue-600 hover:bg-blue-700 border border-blue-600'
                  : 'bg-gray-600 cursor-not-allowed border border-gray-600'
              }`}
            >
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


