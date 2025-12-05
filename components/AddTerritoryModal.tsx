'use client';

import { useEffect, useMemo, useState } from 'react';

const zipRegex = /^\d{5}$/;

interface AddTerritoryModalProps {
  regions: string[];
  states: string[];
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  initialTerritory?: any;
}

function buildInitialFormValues(initialTerritory?: any) {
  return {
    territory_code: initialTerritory?.territory_code || '',
    territory_name: initialTerritory?.territory_name || '',
    territory_dba: initialTerritory?.territory_dba || initialTerritory?.doing_business_as || '',
    status: initialTerritory?.territory_status || initialTerritory?.status || 'Active',
    territory_region: initialTerritory?.territory_region || '',
    territory_state: initialTerritory?.territory_state || '',
    territory_email: initialTerritory?.territory_email || initialTerritory?.email || '',
    territory_mobile: initialTerritory?.territory_mobile || initialTerritory?.mobile || '',
  };
}

function buildInitialZipInput(initialTerritory?: any) {
  const zipArray = initialTerritory?.zip_codes || initialTerritory?.zipcodes || [];
  if (!zipArray.length) {
    const text = initialTerritory?.territory_zipcodes;
    return typeof text === 'string' ? text : '';
  }
  return zipArray
    .map((zip: any) => zip.zip_code || zip.zip || '')
    .filter(Boolean)
    .join('\n');
}

export default function AddTerritoryModal({
  regions,
  states,
  onClose,
  onSuccess,
  mode = 'create',
  initialTerritory,
}: AddTerritoryModalProps) {
  const isEditMode = mode === 'edit' && Boolean(initialTerritory);
  const [formData, setFormData] = useState(() => buildInitialFormValues(initialTerritory));
  const [zipInput, setZipInput] = useState(() => buildInitialZipInput(initialTerritory));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = isEditMode ? 'Edit Territory' : 'Add New Territory';
  const subtitle = isEditMode ? 'Update this territory’s details and coverage.' : 'Create a new territory with location details';
  const ctaLabel = isEditMode ? 'Save Changes' : 'Create Territory';

  useEffect(() => {
    if (initialTerritory) {
      setFormData(buildInitialFormValues(initialTerritory));
      setZipInput(buildInitialZipInput(initialTerritory));
    }
  }, [initialTerritory]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.territory_code.trim()) {
      setError('Territory code is required.');
      return false;
    }
    if (!formData.territory_name.trim()) {
      setError('Territory name is required.');
      return false;
    }
    if (!formData.territory_dba.trim()) {
      setError('Doing business as (DBA) is required.');
      return false;
    }
    if (!formData.territory_region.trim()) {
      setError('Region is required.');
      return false;
    }
    if (!formData.territory_state.trim()) {
      setError('State is required.');
      return false;
    }

    const tokens = zipInput
      .split(/[\s,]+/)
      .map((token: string) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      setError('Enter at least one ZIP code.');
      return false;
    }

    let cleanedZipCodes: Array<{ zip_code: string; city: string; state: string }>;
    try {
      cleanedZipCodes = tokens.map((zip: string) => {
        if (!zipRegex.test(zip)) {
          throw new Error(`Invalid ZIP code: ${zip}`);
        }
        return {
          zip_code: zip,
          city: '',
          state: formData.territory_state.trim(),
        };
      });
    } catch (zipError: any) {
      setError(zipError.message || 'Invalid ZIP code.');
      return false;
    }

    setError(null);
    return cleanedZipCodes;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanedZipCodes = validate();
    if (!cleanedZipCodes) return;

    try {
      setSubmitting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const endpoint =
        isEditMode && initialTerritory?.id
          ? `${apiUrl}/api/territories/${initialTerritory.id}`
          : `${apiUrl}/api/territories`;
      const method = isEditMode && initialTerritory?.id ? 'PUT' : 'POST';
      const payload = {
        territory_code: formData.territory_code.trim(),
        territory_name: formData.territory_name.trim(),
        doing_business_as: formData.territory_dba.trim(),
        status: formData.status,
        territory_status: formData.status,
        territory_region: formData.territory_region.trim(),
        territory_state: formData.territory_state.trim(),
        territory_email: formData.territory_email.trim(),
        territory_mobile: formData.territory_mobile.trim(),
        zip_codes: cleanedZipCodes,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create territory');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10001 }}
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-2xl font-bold text-white truncate">{title}</h2>
            <p className="text-sm text-gray-400 mt-1 hidden sm:block">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

          <section className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Territory Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.territory_code}
                  onChange={(e) => handleInputChange('territory_code', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  placeholder="e.g., TER-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Territory Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.territory_name}
                  onChange={(e) => handleInputChange('territory_name', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  placeholder="e.g., Northeast Region"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                DBA (Doing Business As) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.territory_dba}
                onChange={(e) => handleInputChange('territory_dba', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                placeholder="e.g., Northeast Sales Division"
              />
            </div>
            <div className="md:w-1/2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </section>

          <section className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.territory_state}
                  onChange={(e) => handleInputChange('territory_state', e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 uppercase"
                  placeholder="e.g., CA"
                />
                <p className="text-xs text-gray-500 mt-1">Two-letter state code</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.territory_region}
                  onChange={(e) => handleInputChange('territory_region', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  placeholder="e.g., West Coast"
                  list="region-options"
                />
                <datalist id="region-options">
                  {regions.map((region) => (
                    <option key={region} value={region} />
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          <section className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.territory_email}
                  onChange={(e) => handleInputChange('territory_email', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  placeholder="territory@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mobile</label>
                <input
                  type="tel"
                  value={formData.territory_mobile}
                  onChange={(e) => handleInputChange('territory_mobile', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </section>

          <section className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
              Zipcodes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Territory Zipcodes
              </label>
            <textarea
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              rows={5}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-400 font-mono"
              placeholder="Enter zipcodes separated by commas, spaces, or new lines&#10;Example: 90210, 90211, 90212&#10;or&#10;90210 90211 90212&#10;or one per line"
            />
            <p className="text-xs text-gray-500 mt-1">Enter zipcodes separated by commas, spaces, or new lines</p>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="flex-1">
                <p className="font-medium">Error {isEditMode ? 'updating' : 'creating'} territory</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800">
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
              disabled={submitting}
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Territory' : 'Create Territory')}
            </button>
          </div>
        </div>
      </div>

      <datalist id="state-options">
        {states.map((state) => (
          <option key={state} value={state} />
        ))}
      </datalist>
    </div>
  );
}