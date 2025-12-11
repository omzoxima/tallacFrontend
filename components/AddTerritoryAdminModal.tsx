'use client';

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import CustomDropdown from './CustomDropdown';
import { User, Mail, Phone, Shield, MapPin, AlertCircle, Loader2, Check, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id?: string;
  name?: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  tallac_role?: string;
  status?: string;
}

interface AddTerritoryAdminModalProps {
  partnerId?: string | null;
  partnerName?: string | null;
  partnerTerritories?: Array<any>;
  editUser?: User | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function AddTerritoryAdminModal({
  partnerId,
  partnerName,
  partnerTerritories = [],
  editUser,
  onClose,
  onSuccess,
}: AddTerritoryAdminModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [availableTerritories, setAvailableTerritories] = useState<any[]>([]);
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(false);
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [territorySearchQuery, setTerritorySearchQuery] = useState('');
  const [formData, setFormData] = useState({
    user_role: 'Territory Admin',
    user_status: 'Active',
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    send_welcome_email: true,
  });

  useEffect(() => {
    if (editUser) {
      const nameParts = (editUser.full_name || '').split(' ');
      setFormData({
        user_role: editUser.tallac_role || 'Territory Admin',
        user_status: editUser.status || 'Active',
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: editUser.email || '',
        mobile: editUser.mobile_no ? editUser.mobile_no.replace(/\D/g, '').slice(-10) : '',
        send_welcome_email: false,
      });
    }
  }, [editUser]);

  useEffect(() => {
    if (partnerTerritories && partnerTerritories.length > 0) {
      setAvailableTerritories(partnerTerritories);
    } else if (!partnerId) {
      loadAllTerritories();
    }
  }, [partnerId, partnerTerritories]);

  const loadAllTerritories = async () => {
    setIsLoadingTerritories(true);
    try {
      const result = await api.getTerritories({ status: 'Active' });
      if (result.success && result.data) {
        setAvailableTerritories(result.data);
      }
    } catch (error) {
      console.error('Error loading territories:', error);
    } finally {
      setIsLoadingTerritories(false);
    }
  };

  const roleOptions = [
    { value: 'Corporate Admin', label: 'Corporate Admin', color: '#ef4444' },
    { value: 'Business Coach', label: 'Business Coach', color: '#10b981' },
    { value: 'Territory Admin', label: 'Territory Admin', color: '#f59e0b' },
    { value: 'Territory Manager', label: 'Territory Manager', color: '#8b5cf6' },
    { value: 'Tallac User', label: 'Tallac User', color: '#3b82f6' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'Active', color: '#22c55e' },
    { label: 'Inactive', value: 'Inactive', color: '#ef4444' },
  ];

  const toggleTerritory = (territory: any) => {
    const territoryId = territory.territory || territory.name || territory.id;
    const index = selectedTerritories.indexOf(territoryId);
    if (index > -1) {
      setSelectedTerritories(selectedTerritories.filter((_, i) => i !== index));
    } else {
      setSelectedTerritories([...selectedTerritories, territoryId]);
    }
  };

  // Filter territories based on search query
  const filteredTerritories = availableTerritories.filter((territory) => {
    if (!territorySearchQuery) return true;
    const query = territorySearchQuery.toLowerCase();
    return (
      (territory.territory_name || '').toLowerCase().includes(query) ||
      (territory.territory_code || '').toLowerCase().includes(query) ||
      (territory.territory_state || '').toLowerCase().includes(query) ||
      (territory.territory_region || '').toLowerCase().includes(query)
    );
  });

  // Show 4 territories by default, all when searching
  const displayedTerritories = territorySearchQuery ? filteredTerritories : filteredTerritories.slice(0, 4);

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const userData: any = {
        user_role: formData.user_role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile: formData.mobile,
        send_welcome_email: formData.send_welcome_email ? 1 : 0,
      };

      // Add territories if selected
      if (selectedTerritories.length > 0) {
        userData.territories = selectedTerritories;
      }

      if (editUser) {
        const result = await api.updateUser(editUser.id || editUser.email || '', {
          tallac_role: formData.user_role,
          status: formData.user_status,
        });
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to update user');
        }
      } else if (partnerId) {
        const result = await api.createTeamMember(partnerId, userData);
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to create team member');
        }
      } else {
        const result = await api.createUser(userData);
        if (result.success) {
          onSuccess(result.data);
        } else {
          setErrorMessage(result.message || 'Failed to create user');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 p-6">
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
            {editUser ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          editUser ? 'Update User' : 'Create User'
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      title={editUser ? 'Edit User' : 'Add User'}
      subtitle={editUser ? 'Update user information' : 'Create a new user'}
      maxWidth="2xl"
      onClose={onClose}
      footer={footer}
    >
      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  type="text"
                  required
                  placeholder="John"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  type="text"
                  required
                  placeholder="Doe"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  type="email"
                  required
                  disabled={!!editUser}
                  placeholder="john.doe@example.com"
                  className={`w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 ${
                    editUser ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editUser ? 'Email cannot be changed' : 'Will be used as username for login'}
                </p>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number</label>
                <input
                  value={formData.mobile}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, mobile: digits });
                  }}
                  type="tel"
                  maxLength={15}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Role and Permission Section */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              Role and Permission
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role <span className="text-red-400">*</span>
                </label>
                <CustomDropdown
                  value={formData.user_role}
                  options={roleOptions}
                  onChange={(val) => setFormData({ ...formData, user_role: val })}
                  buttonClass="bg-gray-700 border-gray-600 text-gray-200"
                  showColorDot={true}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <CustomDropdown
                  value={formData.user_status}
                  options={statusOptions}
                  onChange={(val) => setFormData({ ...formData, user_status: val })}
                  buttonClass="bg-gray-700 border-gray-600 text-gray-200"
                  showColorDot={true}
                />
              </div>
            </div>
          </div>

          {/* Territory Selection (if not in partner context) */}
          {!partnerId && availableTerritories.length > 0 && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                Territory Assignment
                {selectedTerritories.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({selectedTerritories.length} selected)
                  </span>
                )}
              </h3>
              {isLoadingTerritories ? (
                <div className="text-center py-8">
                  <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  <p className="text-sm text-gray-400 mt-2">Loading territories...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search territories..."
                      value={territorySearchQuery}
                      onChange={(e) => setTerritorySearchQuery(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 pr-3 py-2.5 placeholder-gray-400"
                    />
                  </div>

                  {/* Territories List */}
                  {displayedTerritories.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      {displayedTerritories.map((territory) => {
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
                          <div className="font-medium text-gray-200 mb-0.5">
                            {territory.territory_name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-mono text-gray-400">{territory.territory_code}</span>
                            <span className="text-gray-600">•</span>
                            <span>{territory.territory_state}</span>
                                {territory.territory_region && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span>{territory.territory_region}</span>
                                  </>
                                )}
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
                  ) : (
                    <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">No territories found matching your search</p>
                    </div>
                  )}

                  {/* Show more indicator */}
                  {!territorySearchQuery && availableTerritories.length > 4 && (
                    <p className="text-xs text-gray-500 text-center">
                      Showing 4 of {availableTerritories.length} territories. Use search to see all.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Send Welcome Email Section - Only show for new users */}
          {!editUser && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  checked={formData.send_welcome_email}
                  onChange={(e) => setFormData({ ...formData, send_welcome_email: e.target.checked })}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Send welcome email</p>
                  <p className="text-xs text-gray-500 mt-0.5">User will receive login credentials via email</p>
                </div>
              </label>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error {editUser ? 'updating' : 'creating'} user</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-900/30 border border-green-600 text-green-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">User {editUser ? 'updated' : 'created'} successfully!</p>
                <p className="text-sm mt-1">{successMessage}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
}

