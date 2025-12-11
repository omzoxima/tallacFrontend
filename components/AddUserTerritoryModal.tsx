'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

interface AddUserTerritoryModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserTerritoryModal({
  userId,
  userName,
  onClose,
  onSuccess,
}: AddUserTerritoryModalProps) {
  const [formData, setFormData] = useState({
    partner: '',
    territory: '',
    role: '',
    assignment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [availableTerritories, setAvailableTerritories] = useState<any[]>([]);
  const [selectedTerritoryDetails, setSelectedTerritoryDetails] = useState<any>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (formData.partner) {
      loadPartnerTerritories();
    } else {
      setAvailableTerritories([]);
      setFormData((prev) => ({ ...prev, territory: '' }));
      setSelectedTerritoryDetails(null);
    }
  }, [formData.partner]);

  useEffect(() => {
    if (formData.territory) {
      loadTerritoryDetails();
    } else {
      setSelectedTerritoryDetails(null);
    }
  }, [formData.territory]);

  const fetchPartners = async () => {
    try {
      const response = await api.getPartners();
      if (response.success && response.data) {
        setPartners(
          response.data.map((p: any) => ({
            value: p.id || p.name,
            label: p.partner_name || p.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const loadPartnerTerritories = async () => {
    try {
      const response = await api.getPartnerDetails(formData.partner);
      if (response.success && response.data?.territories) {
        setAvailableTerritories(
          response.data.territories.map((t: any) => ({
            value: t.id || t.name,
            label: `${t.territory_name || t.name} - ${t.territory_code || ''}`,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading partner territories:', error);
    }
  };

  const loadTerritoryDetails = async () => {
    try {
      const response = await api.getTerritoryDetails(formData.territory);
      if (response.success && response.data) {
        setSelectedTerritoryDetails({
          code: response.data.territory_code,
          state: response.data.territory_state,
          region: response.data.territory_region,
          zipcode_count: response.data.zipcode_count || 0,
        });
      }
    } catch (error) {
      console.error('Error loading territory details:', error);
    }
  };

  const isFormValid = formData.partner && formData.territory;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await api.assignTerritoryToUser(userId, {
        territory_id: formData.territory,
        role: formData.role || undefined,
        assignment_date: formData.assignment_date || undefined,
        notes: formData.notes || undefined,
      });

      onSuccess();
    } catch (error) {
      console.error('Error assigning territory:', error);
      alert('Failed to assign territory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Territory</h2>
            <p className="text-sm text-gray-400 mt-1">Assign a territory to {userName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
            <div className="border-t border-gray-700 pt-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Territory Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Partner <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.partner}
                    onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5"
                  >
                    <option value="">Select a partner...</option>
                    {partners.map((partner) => (
                      <option key={partner.value} value={partner.value}>
                        {partner.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Select the partner organization first</p>
                </div>

                {formData.partner && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Territory <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.territory}
                      onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                      required
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5"
                    >
                      <option value="">Select a territory...</option>
                      {availableTerritories.map((territory) => (
                        <option key={territory.value} value={territory.value}>
                          {territory.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5">Select which territory to assign</p>
                  </div>
                )}

                {selectedTerritoryDetails && (
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-white mb-3">Territory Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Territory Code:</span>
                        <span className="text-white font-mono">{selectedTerritoryDetails.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">State:</span>
                        <span className="text-white">{selectedTerritoryDetails.state}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Region:</span>
                        <span className="text-white">{selectedTerritoryDetails.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Zip Codes:</span>
                        <span className="text-white">{selectedTerritoryDetails.zipcode_count || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {formData.territory && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Role in Territory</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5"
                      >
                        <option value="">Default (Based on User Role)</option>
                        <option value="Territory Manager">Territory Manager</option>
                        <option value="Sales User">Sales User</option>
                        <option value="Territory Admin">Territory Admin</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1.5">Specify their role within this territory (optional)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Assignment Date</label>
                      <input
                        type="date"
                        value={formData.assignment_date}
                        onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Date when this assignment takes effect</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Add any notes about this territory assignment..."
                        className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block px-3 py-2.5 placeholder-gray-500 resize-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors border border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-purple-600 hover:bg-purple-700 border border-purple-600'
                : 'bg-gray-600 cursor-not-allowed border border-gray-600'
            }`}
          >
            {!isSubmitting ? (
              'Assign Territory'
            ) : (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Assigning...
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

