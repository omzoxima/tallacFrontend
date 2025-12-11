'use client';

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import CustomDropdown from './CustomDropdown';
import { Info, MapPin, Mail, Phone, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Partner {
  id?: string;
  name?: string;
  partner_code?: string;
  partner_name?: string;
  partner_status?: string;
  partner_address?: string;
  partner_city?: string;
  partner_state?: string;
  partner_zip?: string;
  partner_email?: string;
  partner_mobile?: string;
  primary_admin_email?: string;
}

interface AddPartnerModalProps {
  mode?: 'add' | 'edit';
  partnerData?: Partner | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function AddPartnerModal({ mode = 'add', partnerData, onClose, onSuccess }: AddPartnerModalProps) {
  const isEditMode = mode === 'edit';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [states, setStates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    partner_code: '',
    partner_name: '',
    partner_status: 'Active',
    partner_address: '',
    partner_city: '',
    partner_state: '',
    partner_zip: '',
    partner_email: '',
    partner_mobile: '',
    primary_admin_email: '',
  });

  useEffect(() => {
    if (partnerData) {
      setFormData({
        partner_code: partnerData.partner_code || '',
        partner_name: partnerData.partner_name || '',
        partner_status: partnerData.partner_status || 'Active',
        partner_address: partnerData.partner_address || '',
        partner_city: partnerData.partner_city || '',
        partner_state: partnerData.partner_state || '',
        partner_zip: partnerData.partner_zip || '',
        partner_email: partnerData.partner_email || '',
        partner_mobile: partnerData.partner_mobile ? partnerData.partner_mobile.replace(/\D/g, '').slice(-10) : '',
        primary_admin_email: partnerData.primary_admin_email || '',
      });
    }
  }, [partnerData]);

  useEffect(() => {
    loadStates();
    loadUsers();
  }, []);

  const loadStates = async () => {
    try {
      const result = await api.getStates();
      if (result.success && result.data) {
        setStates(result.data);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await api.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const statusOptions = [
    { label: 'Active', value: 'Active', color: '#22c55e' },
    { label: 'Pending', value: 'Pending', color: '#eab308' },
    { label: 'Inactive', value: 'Inactive', color: '#ef4444' },
  ];

  const stateOptions = states.map((state) => ({
    label: state.state,
    value: state.state,
    state_name: state.state_name,
  }));

  const userOptions = users.map((user) => ({
    label: `${user.full_name} (${user.email})`,
    value: user.email,
    user: user,
  }));

  const handleSubmit = async () => {
    if (!formData.partner_code || !formData.partner_name) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setErrorMessage('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const partnerDataToSubmit = { ...formData };

      if (formData.primary_admin_email && !isEditMode) {
        const selectedUser = users.find((u) => u.email === formData.primary_admin_email);
        if (selectedUser) {
          partnerDataToSubmit.team_members = [
            {
              name: selectedUser.full_name,
              role: 'Territory Admin',
              email: selectedUser.email,
              phone: selectedUser.mobile_no,
              tallac_user: selectedUser.email,
            },
          ];
        }
      }

      if (isEditMode && partnerData?.id) {
        const result = await api.updatePartner(partnerData.id, partnerDataToSubmit);
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to update partner');
        }
      } else {
        const result = await api.createPartner(partnerDataToSubmit);
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to create partner');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    setFormData({ ...formData, partner_mobile: digits.slice(0, 10) });
  };

  const formattedMobile = formData.partner_mobile
    ? `+1 (${formData.partner_mobile.slice(0, 3)}) ${formData.partner_mobile.slice(3, 6)}-${formData.partner_mobile.slice(6, 10)}`
    : '';

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
            {isEditMode ? 'Saving...' : 'Creating...'}
          </>
        ) : (
          isEditMode ? 'Save Changes' : 'Create Partner'
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      title={isEditMode ? 'Edit Partner' : 'Add New Partner'}
      subtitle={isEditMode ? 'Update partner details' : 'Create a new partner profile with basic details'}
      maxWidth="2xl"
      onClose={onClose}
      footer={footer}
    >
      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-400" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Partner Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Partner Code <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.partner_code}
                  onChange={(e) => setFormData({ ...formData, partner_code: e.target.value })}
                  type="text"
                  required
                  disabled={isEditMode}
                  placeholder="e.g., PART-001"
                  className={`w-full bg-gray-700 border text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 ${
                    fieldErrors.partner_code ? 'border-red-500' : 'border-gray-600'
                  } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.partner_code && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.partner_code}</p>
                )}
              </div>

              {/* Partner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Partner Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.partner_name}
                  onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  type="text"
                  required
                  placeholder="e.g., Smith Enterprises"
                  className={`w-full bg-gray-700 border text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 ${
                    fieldErrors.partner_name ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {fieldErrors.partner_name && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.partner_name}</p>
                )}
              </div>

              {/* Partner Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <CustomDropdown
                  value={formData.partner_status}
                  options={statusOptions}
                  onChange={(val) => setFormData({ ...formData, partner_status: val })}
                  buttonClass="bg-gray-700 border-gray-600 text-gray-200"
                  showColorDot={true}
                  showCheckmark={true}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Address Information
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <input
                  value={formData.partner_address}
                  onChange={(e) => setFormData({ ...formData, partner_address: e.target.value })}
                  type="text"
                  placeholder="Street address"
                  className={`w-full bg-gray-700 border text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 ${
                    fieldErrors.partner_address ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    value={formData.partner_city}
                    onChange={(e) => setFormData({ ...formData, partner_city: e.target.value })}
                    type="text"
                    placeholder="City"
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <CustomDropdown
                    value={formData.partner_state}
                    options={stateOptions}
                    onChange={(val) => setFormData({ ...formData, partner_state: val })}
                    buttonClass={`bg-gray-700 ${fieldErrors.partner_state ? 'border-red-500' : 'border-gray-600'} text-gray-200`}
                    showColorDot={false}
                    showCheckmark={true}
                    searchable={true}
                  />
                  {fieldErrors.partner_state && (
                    <p className="mt-1 text-sm text-red-400">{fieldErrors.partner_state}</p>
                  )}
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Zip Code</label>
                  <input
                    value={formData.partner_zip}
                    onChange={(e) => setFormData({ ...formData, partner_zip: e.target.value })}
                    type="text"
                    placeholder="Zip Code"
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Primary Admin Section */}
          {isEditMode && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Primary Admin
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assign User (Optional)</label>
                <CustomDropdown
                  value={formData.primary_admin_email}
                  options={userOptions}
                  onChange={(val) => setFormData({ ...formData, primary_admin_email: val })}
                  buttonClass="bg-gray-700 border-gray-600 text-gray-200"
                  searchable={true}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select an existing user to be the primary admin for this partner.
                </p>
              </div>
            </div>
          )}

          {/* Contact Section */}
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
                  value={formData.partner_email}
                  onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
                  type="email"
                  placeholder="partner@example.com"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
                <input
                  value={formattedMobile}
                  onChange={handleMobileInput}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  maxLength={18}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {(errorMessage || Object.keys(fieldErrors).length > 0) && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {Object.keys(fieldErrors).length > 0 ? 'Validation Failed' : 'Error creating partner'}
                </p>
                <p className="text-sm mt-1">
                  {Object.keys(fieldErrors).length > 0
                    ? 'Please check the highlighted fields and try again.'
                    : errorMessage}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
}

