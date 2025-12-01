'use client';

import { useState, useEffect } from 'react';
import { X, Building2, MapPin, List } from 'lucide-react';

interface EditCompanyModalProps {
  show: boolean;
  companyData?: any;
  onClose: () => void;
  onSave: (companyData: any) => void;
}

export default function EditCompanyModal({
  show,
  companyData,
  onClose,
  onSave,
}: EditCompanyModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'location' | 'profile'>('general');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    website: '',
    main_phone: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    employee_count: '',
    annual_revenue: '',
    social_profiles: [] as Array<{ platform: string; url: string }>,
    overview: '',
  });

  useEffect(() => {
    if (companyData && show) {
      setForm({
        company_name: companyData.company_name || companyData.partner_name || '',
        industry: companyData.industry || '',
        website: companyData.website || '',
        main_phone: companyData.main_phone || companyData.phone || '',
        street_address: companyData.street_address || companyData.address || '',
        city: companyData.city || '',
        state: companyData.state || '',
        zip_code: companyData.zip_code || '',
        employee_count: companyData.employee_count || companyData.employee_size || '',
        annual_revenue: companyData.annual_revenue || companyData.revenue || '',
        social_profiles: companyData.social_profiles || [],
        overview: companyData.overview || '',
      });
    }
  }, [companyData, show]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const addSocialProfile = () => {
    setForm(prev => ({
      ...prev,
      social_profiles: [...prev.social_profiles, { platform: 'Website', url: '' }],
    }));
  };

  const removeSocialProfile = (index: number) => {
    setForm(prev => ({
      ...prev,
      social_profiles: prev.social_profiles.filter((_, i) => i !== index),
    }));
  };

  const updateSocialProfile = (index: number, field: 'platform' | 'url', value: string) => {
    setForm(prev => {
      const newProfiles = [...prev.social_profiles];
      newProfiles[index] = { ...newProfiles[index], [field]: value };
      return { ...prev, social_profiles: newProfiles };
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Edit Company</h3>
              <p className="text-sm text-gray-400 mt-1">Update company details</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 bg-gray-800">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'location'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Location
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              Profile
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Website</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🌐
                  </span>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Main Phone (Office)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    📞
                  </span>
                  <input
                    type="tel"
                    value={form.main_phone}
                    onChange={(e) => setForm(prev => ({ ...prev, main_phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Street Address</label>
                <input
                  type="text"
                  value={form.street_address}
                  onChange={(e) => setForm(prev => ({ ...prev, street_address: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  State <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select State</option>
                  <option value="AL">AL</option>
                  <option value="AK">AK</option>
                  <option value="AZ">AZ</option>
                  <option value="AR">AR</option>
                  <option value="CA">CA</option>
                  <option value="CO">CO</option>
                  <option value="CT">CT</option>
                  <option value="DE">DE</option>
                  <option value="FL">FL</option>
                  <option value="GA">GA</option>
                  <option value="HI">HI</option>
                  <option value="ID">ID</option>
                  <option value="IL">IL</option>
                  <option value="IN">IN</option>
                  <option value="IA">IA</option>
                  <option value="KS">KS</option>
                  <option value="KY">KY</option>
                  <option value="LA">LA</option>
                  <option value="ME">ME</option>
                  <option value="MD">MD</option>
                  <option value="MA">MA</option>
                  <option value="MI">MI</option>
                  <option value="MN">MN</option>
                  <option value="MS">MS</option>
                  <option value="MO">MO</option>
                  <option value="MT">MT</option>
                  <option value="NE">NE</option>
                  <option value="NV">NV</option>
                  <option value="NH">NH</option>
                  <option value="NJ">NJ</option>
                  <option value="NM">NM</option>
                  <option value="NY">NY</option>
                  <option value="NC">NC</option>
                  <option value="ND">ND</option>
                  <option value="OH">OH</option>
                  <option value="OK">OK</option>
                  <option value="OR">OR</option>
                  <option value="PA">PA</option>
                  <option value="RI">RI</option>
                  <option value="SC">SC</option>
                  <option value="SD">SD</option>
                  <option value="TN">TN</option>
                  <option value="TX">TX</option>
                  <option value="UT">UT</option>
                  <option value="VT">VT</option>
                  <option value="VA">VA</option>
                  <option value="WA">WA</option>
                  <option value="WV">WV</option>
                  <option value="WI">WI</option>
                  <option value="WY">WY</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Zip Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={(e) => setForm(prev => ({ ...prev, zip_code: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter zip code"
                />
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Employee Count</label>
                <select
                  value={form.employee_count}
                  onChange={(e) => setForm(prev => ({ ...prev, employee_count: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Range</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Annual Revenue</label>
                <input
                  type="text"
                  value={form.annual_revenue}
                  onChange={(e) => setForm(prev => ({ ...prev, annual_revenue: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$1M - $5M"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Social Profiles</label>
                <div className="space-y-2">
                  {form.social_profiles.map((profile, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={profile.platform}
                        onChange={(e) => updateSocialProfile(index, 'platform', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Website">Website</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="url"
                        value={profile.url}
                        onChange={(e) => updateSocialProfile(index, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkedin.com/company/..."
                      />
                      <button
                        onClick={() => removeSocialProfile(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSocialProfile}
                    className="flex items-center gap-1.5 px-3 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    + Add Profile URL
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Overview / About Us</label>
                <textarea
                  value={form.overview}
                  onChange={(e) => setForm(prev => ({ ...prev, overview: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company overview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

