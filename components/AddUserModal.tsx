'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Info, User, Phone, MapPin, Mail } from 'lucide-react';
import { showToast } from './Toast';

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editUser?: any; // For editing existing user
  availableTerritories?: Array<any>; // Territories available for assignment
}

const ROLE_OPTIONS = [
  { value: 'Territory Admin', label: 'Territory Admin', color: '#f59e0b' },
  { value: 'Territory Manager', label: 'Territory Manager', color: '#8b5cf6' },
  { value: 'Tallac User', label: 'Tallac User', color: '#3b82f6' },
  { value: 'Corporate Admin', label: 'Corporate Admin', color: '#ef4444' },
  { value: 'SDR', label: 'SDR', color: '#3b82f6' },
  { value: 'Business Coach', label: 'Business Coach', color: '#10b981' },
  { value: 'Sales User', label: 'Sales User', color: '#6366f1' },
  { value: 'System Manager', label: 'System Manager', color: '#8b5cf6' }
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Territory Admin': 'Full access to manage territories, team members, and partner settings',
  'Territory Manager': 'Manage assigned territories and view partner information',
  'Tallac User': 'Sales Development Representative with access to leads and activities',
  'Corporate Admin': 'Full system access with all administrative privileges',
  'SDR': 'Sales Development Representative focused on lead generation',
  'Business Coach': 'Business development and coaching role',
  'Sales User': 'Standard sales user with lead and activity access',
  'System Manager': 'System administration and configuration access'
};

const ROLE_COLORS: Record<string, string> = {
  'Territory Admin': 'text-amber-400',
  'Territory Manager': 'text-purple-400',
  'Tallac User': 'text-blue-400',
  'Corporate Admin': 'text-red-400',
  'SDR': 'text-blue-400',
  'Business Coach': 'text-green-400',
  'Sales User': 'text-indigo-400',
  'System Manager': 'text-purple-400'
};

export default function AddUserModal({ onClose, onSuccess, editUser, availableTerritories = [] }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    user_role: editUser?.role || editUser?.tallac_role || 'Territory Admin',
    first_name: editUser?.first_name || '',
    last_name: editUser?.last_name || '',
    email: editUser?.email || '',
    mobile: editUser?.mobile_no || '',
    telephony_number: '',
    telephony_type: '',
    telephony_carrier: '',
    send_welcome_email: true
  });

  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [territories, setTerritories] = useState<any[]>([]);
  const [loadingTerritories, setLoadingTerritories] = useState(false);
  const [territorySearch, setTerritorySearch] = useState('');

  const territoriesLoadedRef = useRef(false);

  // Load territories if not provided
  useEffect(() => {
    if (availableTerritories.length > 0) {
      setTerritories(availableTerritories);
      territoriesLoadedRef.current = true;
      return;
    }

    if (!territoriesLoadedRef.current) {
      territoriesLoadedRef.current = true;
      loadTerritories();
    }
  }, [availableTerritories]);

  // Load selected territories if editing
  useEffect(() => {
    if (editUser?.territories) {
      const territoryIds = new Set<string>(
        editUser.territories
          .map((t: any) => (t.territory || t.id || t.name) as string | undefined)
          .filter((value: string | undefined): value is string => Boolean(value))
      );
      setSelectedTerritories(territoryIds);
    }
  }, [editUser]);

  const loadTerritories = async () => {
    try {
      setLoadingTerritories(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/territories?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTerritories(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently fail territories loading
    } finally {
      setLoadingTerritories(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTerritory = (territoryId: string) => {
    setSelectedTerritories((prev) => {
      const next = new Set(prev);
      if (next.has(territoryId)) {
        next.delete(territoryId);
      } else {
        next.add(territoryId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      const payload: any = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.user_role,
        tallac_role: formData.user_role,
        mobile_no: formData.mobile.trim() || null,
        is_active: true,
        territories: Array.from(selectedTerritories),
        send_welcome_email: formData.send_welcome_email
      };

      // Add telephony line if provided
      if (formData.telephony_number && formData.telephony_type) {
        payload.telephony = {
          phone_number: formData.telephony_number.trim(),
          line_type: formData.telephony_type,
          carrier: formData.telephony_carrier.trim() || null
        };
      }

      const url = editUser
        ? `${apiUrl}/api/users/${editUser.id || editUser.name}`
        : `${apiUrl}/api/users`;
      const method = editUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editUser ? 'update' : 'create'} user`);
      }

      await response.json();
      const successMsg = editUser ? 'User updated successfully!' : 'User created successfully!';
      setSuccessMessage(successMsg);
      showToast(successMsg, 'success');

      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && error.message) || 'An unexpected error occurred';
      setErrorMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showTerritorySection = useMemo(() => {
    if (territories.length === 0) return false;
    // Allow territory assignment for every role except Corporate/System level administrators
    const rolesWithoutTerritories = new Set(['Corporate Admin', 'System Manager']);
    return !rolesWithoutTerritories.has(formData.user_role);
  }, [formData.user_role, territories]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{editUser ? 'Edit User' : 'Add User'}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {editUser ? 'Update user information' : 'Create a new user profile'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.user_role}
              onChange={(e) => handleChange('user_role', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <p className={`text-xs text-gray-300 flex items-start gap-2 ${ROLE_COLORS[formData.user_role] || 'text-gray-300'}`}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{ROLE_DESCRIPTIONS[formData.user_role] || 'User role description'}</span>
              </p>
            </div>
          </div>

          {/* User Information Section */}
          <div className="border-t border-gray-700 pt-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Personal Information
            </h3>

            <div className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="John"
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john.doe@example.com"
                  disabled={!!editUser}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1.5">Will be used as username for login</p>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Telephony Assignment Section */}
          <div className="border-t border-gray-700 pt-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-400" />
              Telephony Line (Optional)
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.telephony_number}
                    onChange={(e) => handleChange('telephony_number', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-2 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Line Type</label>
                  <select
                    value={formData.telephony_type}
                    onChange={(e) => handleChange('telephony_type', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-2"
                  >
                    <option value="">Select type</option>
                    <option value="Mobile">Mobile</option>
                    <option value="VoIP">VoIP</option>
                    <option value="Landline">Landline</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Carrier/Provider</label>
                <input
                  type="text"
                  value={formData.telephony_carrier}
                  onChange={(e) => handleChange('telephony_carrier', e.target.value)}
                  placeholder="e.g., Twilio, AT&T, Verizon"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-2 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Territory Assignment Section */}
          {showTerritorySection && (
            <div className="border-t border-gray-700 pt-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Territory Assignment
              </h3>

              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-3">Select territories to assign:</p>
                
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    type="search"
                    value={territorySearch}
                    onChange={(e) => setTerritorySearch(e.target.value)}
                    placeholder="Start typing to search territories (name, code, state, region)..."
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block pl-10 pr-3 py-2 placeholder-gray-500"
                  />
                </div>

                {loadingTerritories ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading territories...
                  </div>
                ) : (() => {
                  // Filter territories based on search
                  const query = territorySearch.trim().toLowerCase();
                  const filtered = territories.filter((territory) => {
                    if (!query) return true; // Show all if no search
                    return (
                      territory.territory_name?.toLowerCase().includes(query) ||
                      territory.territory_code?.toLowerCase().includes(query) ||
                      territory.territory_state?.toLowerCase().includes(query) ||
                      territory.territory_region?.toLowerCase().includes(query)
                    );
                  });

                  // If no search, show only first 2
                  const displayTerritories = query ? filtered : filtered.slice(0, 2);

                  if (displayTerritories.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-400">
                        {query ? (
                          <>
                            <p className="text-sm font-semibold mb-1">No territories found</p>
                            <p className="text-xs text-gray-500">Try adjusting your search</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold mb-1">Start typing to search territories</p>
                            <p className="text-xs text-gray-500">Type territory name, code, state, or region to find territories</p>
                          </>
                        )}
                      </div>
                    );
                  }

                  return displayTerritories.map((territory) => {
                    const territoryId = territory.id || territory.name;
                    const isSelected = selectedTerritories.has(territoryId);
                    return (
                      <div
                        key={territoryId}
                        onClick={() => toggleTerritory(territoryId)}
                        className={`rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-gray-800'
                            : 'border-transparent bg-gray-800/50 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h4 className="text-base font-bold text-white truncate">
                                {territory.territory_name}
                              </h4>
                              {territory.territory_code && (
                                <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded flex-shrink-0">
                                  {territory.territory_code}
                                </span>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-500 bg-gray-700'
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          {territory.territory_state && (
                            <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                              <span>{territory.territory_state}</span>
                              {territory.territory_region && (
                                <>
                                  <span className="text-gray-500">•</span>
                                  <span>{territory.territory_region}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Send Welcome Email */}
          {!editUser && (
            <div className="border-t border-gray-700 pt-5">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.send_welcome_email}
                  onChange={(e) => handleChange('send_welcome_email', e.target.checked)}
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
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error {editUser ? 'updating' : 'creating'} user</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-900/30 border border-green-600 text-green-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">User {editUser ? 'updated' : 'created'} successfully!</p>
                <p className="text-sm mt-1">{successMessage}</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800">
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            type="button"
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? (editUser ? 'Updating...' : 'Creating...') : (editUser ? 'Update User' : `Create ${formData.user_role}`)}
          </button>
        </div>
      </div>
    </div>
  );
}

