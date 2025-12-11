'use client';

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Info, MapPin, Mail, Phone, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Territory {
  id?: string;
  name?: string;
  territory_code?: string;
  territory_name?: string;
  territory_dba?: string;
  territory_status?: string;
  territory_state?: string;
  territory_region?: string;
  territory_email?: string;
  territory_mobile?: string;
  territory_zipcodes?: string;
}

interface AddTerritoryModalProps {
  territory?: Territory | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function AddTerritoryModal({ territory, onClose, onSuccess }: AddTerritoryModalProps) {
  const isEditMode = !!territory;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    territory_code: '',
    territory_name: '',
    territory_dba: '',
    territory_status: 'Active',
    territory_state: '',
    territory_region: '',
    territory_email: '',
    territory_mobile: '',
    territory_zipcodes: '',
  });

  useEffect(() => {
    if (territory) {
      setFormData({
        territory_code: territory.territory_code || '',
        territory_name: territory.territory_name || '',
        territory_dba: territory.territory_dba || '',
        territory_status: territory.territory_status || 'Active',
        territory_state: territory.territory_state || '',
        territory_region: territory.territory_region || '',
        territory_email: territory.territory_email || '',
        territory_mobile: territory.territory_mobile || '',
        territory_zipcodes: territory.territory_zipcodes || '',
      });
    }
  }, [territory]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (
      !formData.territory_code ||
      !formData.territory_name ||
      !formData.territory_dba ||
      !formData.territory_state ||
      !formData.territory_region
    ) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isEditMode && territory?.id) {
        const result = await api.updateTerritory(territory.id, formData);
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to update territory');
        }
      } else {
        const result = await api.createTerritory(formData);
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to create territory');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 2);
    setFormData({ ...formData, territory_state: value });
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 p-6">
      <button
        onClick={onClose}
        type="button"
        className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        type="button"
        className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEditMode ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          isEditMode ? 'Update Territory' : 'Create Territory'
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      title={isEditMode ? 'Edit Territory' : 'Add New Territory'}
      subtitle={isEditMode ? 'Update territory information' : 'Create a new territory with location details'}
      maxWidth="2xl"
      onClose={onClose}
      footer={footer}
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-400" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Territory Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Territory Code <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.territory_code}
                  onChange={(e) => setFormData({ ...formData, territory_code: e.target.value })}
                  type="text"
                  required
                  placeholder="e.g., TER-001"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Territory Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Territory Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.territory_name}
                  onChange={(e) => setFormData({ ...formData, territory_name: e.target.value })}
                  type="text"
                  required
                  placeholder="e.g., Northeast Region"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Territory DBA */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DBA (Doing Business As) <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.territory_dba}
                  onChange={(e) => setFormData({ ...formData, territory_dba: e.target.value })}
                  type="text"
                  required
                  placeholder="e.g., Northeast Sales Division"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Territory Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.territory_status}
                  onChange={(e) => setFormData({ ...formData, territory_status: e.target.value })}
                  required
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Location Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.territory_state}
                  onChange={handleStateChange}
                  type="text"
                  required
                  placeholder="e.g., CA"
                  maxLength={2}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">Two-letter state code</p>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.territory_region}
                  onChange={(e) => setFormData({ ...formData, territory_region: e.target.value })}
                  type="text"
                  required
                  placeholder="e.g., West Coast"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  value={formData.territory_email}
                  onChange={(e) => setFormData({ ...formData, territory_email: e.target.value })}
                  type="email"
                  placeholder="territory@example.com"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
                <input
                  value={formData.territory_mobile}
                  onChange={(e) => setFormData({ ...formData, territory_mobile: e.target.value })}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Zipcodes Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-purple-400" />
              Zipcodes
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Territory Zipcodes</label>
              <textarea
                value={formData.territory_zipcodes}
                onChange={(e) => setFormData({ ...formData, territory_zipcodes: e.target.value })}
                rows={5}
                placeholder="Enter zipcodes separated by commas, spaces, or new lines&#10;Example: 90210, 90211, 90212&#10;or&#10;90210 90211 90212&#10;or one per line"
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Enter zipcodes separated by commas, spaces, or new lines</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error {isEditMode ? 'updating' : 'creating'} territory</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
}

