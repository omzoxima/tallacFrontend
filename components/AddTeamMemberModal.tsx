'use client';

import { useMemo, useState } from 'react';
import { Check, Info, Mail, Map, MapPin, Phone, Plus, Radio, User, X } from 'lucide-react';
import { showToast } from './Toast';

interface Territory {
  territory?: string;
  name?: string;
  territory_name?: string;
  territory_code?: string;
  territory_state?: string;
  territory_region?: string;
  territory_dba?: string;
  zipcode_count?: number;
}

interface AddTeamMemberModalProps {
  partnerId: string;
  partnerName: string;
  partnerTerritories?: Territory[];
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  {
    value: 'Territory Admin',
    label: 'Territory Admin',
    description: 'Full access to manage territories, team members, and partner settings.',
    accent: 'text-amber-400',
  },
  {
    value: 'Territory Manager',
    label: 'Territory Manager',
    description: 'Manage assigned territories and view partner information.',
    accent: 'text-purple-400',
  },
  {
    value: 'Tallac User',
    label: 'Tallac User',
    description: 'SDR access to leads, calls, and activities.',
    accent: 'text-blue-400',
  },
];

export default function AddTeamMemberModal({
  partnerId,
  partnerName,
  partnerTerritories = [],
  onClose,
  onSuccess,
}: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: ROLE_OPTIONS[0].value,
    roleTitle: '',
    telephonyNumber: '',
    telephonyType: '',
    telephonyCarrier: '',
    sendWelcomeEmail: true,
  });
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [territorySearch, setTerritorySearch] = useState('');

  const roleMeta = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === formData.role) ?? ROLE_OPTIONS[0],
    [formData.role]
  );

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTerritory = (territory: Territory) => {
    const territoryId = territory.territory || territory.name || territory.territory_name;
    if (!territoryId) return;
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const payload = {
        member_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        role: formData.role.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role_title: formData.roleTitle.trim() || null,
        telephony_number: formData.telephonyNumber.trim() || null,
        telephony_type: formData.telephonyType.trim() || null,
        telephony_carrier: formData.telephonyCarrier.trim() || null,
        territories: Array.from(selectedTerritories),
        send_welcome_email: formData.sendWelcomeEmail,
      };

      const response = await fetch(`${apiUrl}/api/partners/${partnerId}/team-members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to add team member');
      }

      showToast('Team member added successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTerritories = () => {
    if (!partnerTerritories.length) return null;

    return (
      <div className="border-t border-gray-800 pt-5 space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Map className="w-4 h-4 text-purple-400" />
          Territory Assignment
        </h3>
        <p className="text-sm text-gray-400">Select territories to associate with this team member.</p>
        
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
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pl-10 text-sm text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="space-y-3">
          {(() => {
            // Filter territories based on search
            const query = territorySearch.trim().toLowerCase();
            const filtered = partnerTerritories.filter((territory) => {
              if (!query) return true; // Show all if no search
              return (
                territory.territory_name?.toLowerCase().includes(query) ||
                territory.territory_code?.toLowerCase().includes(query) ||
                territory.territory_state?.toLowerCase().includes(query) ||
                territory.territory_region?.toLowerCase().includes(query) ||
                territory.territory_dba?.toLowerCase().includes(query)
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

            return displayTerritories.map((territory, index) => {
            const territoryId = territory.territory || territory.name || territory.territory_name || `${index}`;
            const isSelected = selectedTerritories.has(territoryId);
            return (
              <button
                key={territoryId}
                type="button"
                onClick={() => toggleTerritory(territory)}
                className={`w-full text-left rounded-xl border-2 transition-all duration-200 px-4 py-3 bg-gray-800/70 hover:bg-gray-800 ${
                  isSelected ? 'border-purple-500' : 'border-transparent hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {territory.territory_name || territory.name || 'Unnamed Territory'}
                    </h4>
                    {territory.territory_code && (
                      <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded flex-shrink-0">
                        {territory.territory_code}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                {territory.territory_dba && <p className="text-xs text-gray-400">{territory.territory_dba}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-300">
                  {territory.territory_state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      {territory.territory_state}
                    </span>
                  )}
                  {territory.territory_region && (
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3 text-green-400" />
                      {territory.territory_region}
                    </span>
                  )}
                  {typeof territory.zipcode_count === 'number' && (
                    <span className="flex items-center gap-1">
                      <Map className="w-3 h-3 text-purple-400" />
                      {territory.zipcode_count} Zipcodes
                    </span>
                  )}
                </div>
              </button>
            );
          });
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Add Team Member</p>
            <h2 className="text-xl font-semibold text-white">Assign a teammate to {partnerName}</h2>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-gray-800" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-xs uppercase text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Role <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="p-3 bg-gray-800/70 rounded-lg border border-gray-700/70 text-xs text-gray-300 flex gap-2">
              <Info className={`w-4 h-4 flex-shrink-0 ${roleMeta.accent}`} />
              <span>{roleMeta.description}</span>
            </div>
          </div>

          {/* Personal Info */}
          <div className="border-t border-gray-800 pt-5 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-gray-400">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-gray-400">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                placeholder="member@example.com"
              />
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Will be used for login + notifications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-gray-400">Mobile</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-gray-400">Role Title</label>
                <input
                  type="text"
                  value={formData.roleTitle}
                  onChange={(e) => handleChange('roleTitle', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                  placeholder="Regional Manager"
                />
              </div>
            </div>
          </div>

          {/* Telephony */}
          <div className="border-t border-gray-800 pt-5 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-400" />
              Telephony Line (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-gray-400">Phone Number</label>
                <input
                  type="tel"
                  value={formData.telephonyNumber}
                  onChange={(e) => handleChange('telephonyNumber', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-gray-400">Line Type</label>
                <select
                  value={formData.telephonyType}
                  onChange={(e) => handleChange('telephonyType', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select type</option>
                  <option value="Mobile">Mobile</option>
                  <option value="VoIP">VoIP</option>
                  <option value="Landline">Landline</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">Carrier / Provider</label>
              <input
                type="text"
                value={formData.telephonyCarrier}
                onChange={(e) => handleChange('telephonyCarrier', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                placeholder="e.g., Twilio, AT&T, Verizon"
              />
            </div>
          </div>

          {renderTerritories()}

          {/* Welcome Email */}
          <div className="border-t border-gray-800 pt-5">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800/40 transition-colors">
              <input
                type="checkbox"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => handleChange('sendWelcomeEmail', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Send welcome email</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  User will automatically receive login credentials once approved.
                </p>
              </div>
            </label>
          </div>
        </form>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-800 bg-gray-900">
          <div className="text-xs text-gray-400">
            {selectedTerritories.size > 0
              ? `${selectedTerritories.size} territory${selectedTerritories.size > 1 ? 'ies' : ''} selected`
              : 'No territories selected'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isSubmitting ? 'Creating...' : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

