'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Building2, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id?: string;
  name?: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  mobile?: string;
  tallac_role?: string;
  role?: string;
  territories?: Array<{ territory?: string; name?: string; id?: string }>;
}

interface Partner {
  id?: string;
  name?: string;
  partner_name?: string;
  territories?: Array<{ territory?: string; name?: string; id?: string }>;
}

interface AssignTerritoryModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignTerritoryModal({ user, onClose, onSuccess }: AssignTerritoryModalProps) {
  const [formData, setFormData] = useState({
    partners: [] as string[],
  });
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [availableTerritories, setAvailableTerritories] = useState<any[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  useEffect(() => {
    loadPartners();
    if (user.territories && user.territories.length > 0) {
      setSelectedTerritories(user.territories.map((t) => t.territory || t.name || t.id || '').filter(Boolean));
    }
  }, [user]);

  useEffect(() => {
    if (formData.partners.length > 0) {
      loadTerritoriesForSelectedPartners();
    } else {
      setAvailableTerritories([]);
    }
  }, [formData.partners]);

  const loadPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const result = await api.getPartners();
      if (result.success && result.data) {
        // Normalize partners for compatibility (Vue3/Python-style)
        const normalized = (result.data || []).map((p: any) => {
          const name = p.name || p.id || p.partner_code || p.partner_name;
          const territories = (p.territories || []).map((t: any) => ({
            ...t,
            id: t.id || t.territory_id || t.territory || t.name,
            territory: t.territory || t.territory_id || t.id || t.name,
          }));
          return {
            ...p,
            name,
            territories,
          };
        });
        setPartners(normalized);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const loadTerritoriesForSelectedPartners = async () => {
    setIsLoadingTerritories(true);
    try {
      const territoryMap = new Map();
      for (const partnerName of formData.partners) {
        const partner = partners.find((p) => p.name === partnerName);
        if (partner && partner.territories) {
          partner.territories.forEach((territory) => {
            const territoryId = territory.territory || territory.name || territory.id;
            if (territoryId && !territoryMap.has(territoryId)) {
              territoryMap.set(territoryId, territory);
            }
          });
        }
      }
      setAvailableTerritories(Array.from(territoryMap.values()));
    } catch (error) {
      console.error('Error loading territories:', error);
    } finally {
      setIsLoadingTerritories(false);
    }
  };

  const unselectedPartners = partners.filter((p) => {
    const isNotSelected = !formData.partners.includes(p.name || '');
    const matchesSearch = !partnerSearchQuery || (p.partner_name || '').toLowerCase().includes(partnerSearchQuery.toLowerCase());
    return isNotSelected && matchesSearch;
  });

  const getPartnerLabel = (partnerName: string) => {
    const partner = partners.find((p) => p.name === partnerName);
    return partner ? partner.partner_name : partnerName;
  };

  const addPartner = (partnerName: string) => {
    if (!formData.partners.includes(partnerName)) {
      setFormData({ ...formData, partners: [...formData.partners, partnerName] });
    }
    setPartnerSearchQuery('');
    setShowPartnerDropdown(false);
  };

  const removePartner = (partnerName: string) => {
    setFormData({ ...formData, partners: formData.partners.filter((p) => p !== partnerName) });
  };

  const toggleTerritory = (territory: any) => {
    const territoryId = territory.territory || territory.name || territory.id;
    const index = selectedTerritories.indexOf(territoryId);
    if (index > -1) {
      setSelectedTerritories(selectedTerritories.filter((_, i) => i !== index));
    } else {
      setSelectedTerritories([...selectedTerritories, territoryId]);
    }
  };

  const isFormValid = formData.partners.length > 0 && selectedTerritories.length > 0;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      console.log('=== SAVE ASSIGNMENT API CALL ===');
      console.log('Selected Partners:', formData.partners);
      console.log('Selected Territories:', selectedTerritories);
      console.log('User:', user);

      for (const partnerName of formData.partners) {
        const partner = partners.find((p) => p.name === partnerName || p.id === partnerName || p.partner_code === partnerName);
        if (!partner) {
          console.warn(`Partner not found: ${partnerName}`);
          continue;
        }

        const partnerId = partner.id || partner.name || partner.partner_code || partnerName;
        const partnerTerritoryIds = (partner.territories || [])
          .map((t) => t.territory || t.name || t.id || t.territory_id)
          .filter(Boolean);

        // Limit to selected territories that belong to this partner
        const territoriesForThisPartner = selectedTerritories.filter((tId) => partnerTerritoryIds.includes(tId));

        console.log(`\n--- Processing Partner: ${partner.partner_name || partnerName} (ID: ${partnerId}) ---`);
        console.log('Partner Territory IDs:', partnerTerritoryIds);
        console.log('Territories for this partner:', territoriesForThisPartner);

        if (territoriesForThisPartner.length > 0) {
          const userData = {
            email: user.email,
            user_role: user.role || user.tallac_role,
            first_name: user.first_name || user.full_name?.split(' ')[0] || '',
            last_name: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
            mobile: user.mobile_no || user.mobile || '',
          };

          const requestBody = {
            ...userData,
            territories: territoriesForThisPartner,
          };

          console.log(`\nAPI Request to: POST ${apiBaseUrl}/api/partners/${partnerId}/team-members`);
          console.log('Request Body:', JSON.stringify(requestBody, null, 2));
          
          // Generate curl command
          const curlCommand = `curl -X POST "${apiBaseUrl}/api/partners/${partnerId}/team-members" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${JSON.stringify({ user_data: requestBody })}'`;
          
          console.log('\n--- CURL Command ---');
          console.log(curlCommand);
          console.log('--- End CURL ---\n');

          const response = await api.createTeamMember(partnerId, requestBody);
          console.log('API Response:', response);
        } else {
          console.warn(`No territories selected for partner ${partner.partner_name || partnerName}`);
        }
      }
      
      console.log('\n=== ASSIGNMENT SUCCESSFUL ===');
      alert('Territories assigned successfully!');
      
      // Delay before calling onSuccess to allow user to see the success message
      setTimeout(() => {
      onSuccess();
      }, 1000);
    } catch (error: any) {
      console.error('\n=== ERROR ASSIGNING TERRITORIES ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response || error.data);
      alert(error.message || 'Failed to assign territories. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-3xl my-auto flex flex-col"
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
              for <span className="font-semibold text-purple-300">{user.full_name || user.email}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* Partner Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Partners
                <span className="text-red-400">*</span>
              </label>
              {isLoadingPartners ? (
                <div className="text-sm text-gray-400">Loading partners...</div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Partners as Chips */}
                  {formData.partners.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.partners.map((partnerName) => (
                        <div
                          key={partnerName}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/50 rounded-lg text-sm font-medium text-purple-300 group hover:bg-purple-600/30 transition-all"
                        >
                          <span>{getPartnerLabel(partnerName)}</span>
                          <button
                            type="button"
                            onClick={() => removePartner(partnerName)}
                            className="hover:bg-purple-500/30 rounded p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search to Add Partners */}
                  <div className="relative">
                    <input
                      value={partnerSearchQuery}
                      onFocus={() => setShowPartnerDropdown(true)}
                      onChange={(e) => setPartnerSearchQuery(e.target.value)}
                      type="text"
                      placeholder="Search to add more partners..."
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5 pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    {/* Dropdown Results */}
                    {showPartnerDropdown && unselectedPartners.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                        {unselectedPartners.map((partner) => (
                          <button
                            key={partner.name}
                            type="button"
                            onClick={() => addPartner(partner.name || '')}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-600 text-gray-200 text-sm transition-colors flex items-center gap-2 border-b border-gray-600 last:border-0"
                          >
                            <Check className="w-4 h-4 text-green-400" />
                            {partner.partner_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Select partners to manage their territories</p>
                </div>
              )}
            </div>

            {/* Territory Selection */}
            {formData.partners.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Territories
                  <span className="text-red-400">*</span>
                  <span className="ml-auto text-xs font-normal text-gray-500">
                    {selectedTerritories.length} selected
                  </span>
                </label>

                {isLoadingTerritories ? (
                  <div className="text-center py-8">
                    <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    <p className="text-sm text-gray-400 mt-2">Loading territories...</p>
                  </div>
                ) : availableTerritories.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-gray-600 border-dashed">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-400">No territories available for selected partners</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    {availableTerritories.map((territory) => {
                      const territoryId = territory.territory || territory.name || territory.id;
                      const isSelected = selectedTerritories.includes(territoryId);
                      return (
                        <div
                          key={territoryId}
                          onClick={() => toggleTerritory(territory)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                              : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-200 mb-0.5">{territory.territory_name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="font-mono text-gray-400">{territory.territory_code}</span>
                              <span className="text-gray-600">•</span>
                              <span>{territory.territory_state}</span>
                            </div>
                          </div>
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-blue-600 border-blue-600 scale-110' : 'border-gray-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Click territories to select/deselect them
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
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
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 sm:flex-none px-4 py-2 text-white text-sm font-medium rounded-lg transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 border border-blue-600'
                  : 'bg-gray-600 cursor-not-allowed border border-gray-600'
              }`}
            >
              {!isSubmitting ? (
                'Save Assignment'
              ) : (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Saving...
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

