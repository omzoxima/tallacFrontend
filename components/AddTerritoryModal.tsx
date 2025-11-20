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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
            <h2 className="text-xl font-semibold text-white">{subtitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-gray-800"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <section className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Basic Information</h3>
              <p className="text-xs text-gray-400">Add core identifiers for this territory.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-gray-400">Territory Code *</label>
                <input
                  type="text"
                  value={formData.territory_code}
                  onChange={(e) => handleInputChange('territory_code', e.target.value)}
                  className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 525TX"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-400">Territory Name *</label>
                <input
                  type="text"
                  value={formData.territory_name}
                  onChange={(e) => handleInputChange('territory_name', e.target.value)}
                  className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Northeast Region"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-gray-400">DBA (Doing Business As) *</label>
              <input
                type="text"
                value={formData.territory_dba}
                onChange={(e) => handleInputChange('territory_dba', e.target.value)}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Fastest Labs of Addison"
              />
            </div>
            <div className="md:w-1/2">
              <label className="text-xs uppercase text-gray-400">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </section>

          <section className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Location Information</h3>
              <p className="text-xs text-gray-400">Specify where this territory operates.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-gray-400">State *</label>
                <input
                  type="text"
                  value={formData.territory_state}
                  onChange={(e) => handleInputChange('territory_state', e.target.value.toUpperCase())}
                  className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500 uppercase"
                  placeholder="e.g., TX"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-400">Region *</label>
                <input
                  type="text"
                  value={formData.territory_region}
                  onChange={(e) => handleInputChange('territory_region', e.target.value)}
                  className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., South Central"
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

          <section className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Contact Information</h3>
              <p className="text-xs text-gray-400">Optional communication details.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-gray-400">Email</label>
                <input
                  type="email"
                  value={formData.territory_email}
                  onChange={(e) => handleInputChange('territory_email', e.target.value)}
                  className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., addison@fastestlabs.com"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-gray-400">Phone</label>
                <input
                  type="tel"
                  value={formData.territory_mobile}
                  onChange={(e) => handleInputChange('territory_mobile', e.target.value)}
                  className="mt-1 bg-gray-900 border border-gray-700 rounded-lg w-full px-3 py-2 text-white focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., (555) 000-0000"
                />
              </div>
            </div>
          </section>

          <section className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
              Coverage ZIP Codes
            </h3>
            <label className="text-xs uppercase text-gray-400">Territory Zipcodes *</label>
            <textarea
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 placeholder-gray-500 font-mono"
              placeholder={`Enter zipcodes separated by commas, spaces, or new lines\nExample: 90210, 90211, 90212\nor\n90210 90211 90212\nor one per line`}
            />
            <p className="text-xs text-gray-500">Zip codes inherit the state above unless otherwise specified.</p>
          </section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : ctaLabel}
            </button>
          </div>
        </form>
      </div>

      <datalist id="state-options">
        {states.map((state) => (
          <option key={state} value={state} />
        ))}
      </datalist>
    </div>
  );
}