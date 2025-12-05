'use client';

import { useState, useEffect } from 'react';
import { X, Building2, MapPin, List, Plus, ChevronDown } from 'lucide-react';

interface EditCompanyModalProps {
  show: boolean;
  companyData?: any;
  mode?: 'create' | 'edit';
  onClose: () => void;
  onSave: (companyData: any) => void;
}

export default function EditCompanyModal({
  show,
  companyData,
  mode = 'edit',
  onClose,
  onSave,
}: EditCompanyModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'location' | 'profile'>('general');
  const [saving, setSaving] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    organization_name: '',
    doing_business_as: '',
    industry: '',
    organization_type: '',
    status: 'Active',
    address_line_1: '',
    address_line_2: '',
    zip_code: '',
    city: '',
    state: '',
    territory_id: '',
    truck_count: '',
    driver_count: '',
    employee_size: '',
    revenue: '',
    founded_date: '',
    website: '',
    main_phone: '',
    email: '',
    overview: '',
    social_profiles: [] as Array<{ platform: string; profile_url: string }>,
  });

  // Load industries on mount
  useEffect(() => {
    if (show) {
      loadIndustries();
    }
  }, [show]);

  useEffect(() => {
    if (companyData && show && mode === 'edit') {
      setForm({
        organization_name: companyData.organization_name || companyData.company_name || companyData.partner_name || '',
        doing_business_as: companyData.doing_business_as || '',
        industry: companyData.industry || '',
        organization_type: companyData.organization_type || '',
        status: companyData.status || 'Active',
        address_line_1: companyData.address_line_1 || companyData.street_address || companyData.address || '',
        address_line_2: companyData.address_line_2 || '',
        zip_code: companyData.zip_code || '',
        city: companyData.city || '',
        state: companyData.state || '',
        territory_id: companyData.territory_id || '',
        truck_count: companyData.truck_count?.toString() || '',
        driver_count: companyData.driver_count?.toString() || '',
        employee_size: companyData.employee_size || companyData.employee_count || '',
        revenue: companyData.revenue || companyData.annual_revenue || '',
        founded_date: companyData.founded_date || '',
        website: companyData.website || '',
        main_phone: companyData.main_phone || companyData.phone || '',
        email: companyData.email || '',
        overview: companyData.overview || '',
        social_profiles: companyData.social_profiles || [],
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setForm({
        organization_name: '',
        doing_business_as: '',
        industry: '',
        organization_type: '',
        status: 'Active',
        address_line_1: '',
        address_line_2: '',
        zip_code: '',
        city: '',
        state: '',
        territory_id: '',
        truck_count: '',
        driver_count: '',
        employee_size: '',
        revenue: '',
        founded_date: '',
        website: '',
        main_phone: '',
        email: '',
        overview: '',
        social_profiles: [],
      });
    }
  }, [companyData, show, mode]);

  const loadIndustries = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/industries`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setIndustries(result.data || []);
      }
    } catch (error) {
      console.error('Error loading industries:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.organization_name || !form.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      // Switch to tab with error
      if (errors.organization_name) setActiveTab('general');
      return;
    }
    
    setSaving(true);
    try {
      // Clean up data before saving
      const dataToSave = {
        ...form,
        truck_count: form.truck_count ? parseInt(form.truck_count) : null,
        driver_count: form.driver_count ? parseInt(form.driver_count) : null,
        social_profiles: form.social_profiles.filter(p => p.platform && p.profile_url),
      };
      
      await onSave(dataToSave);
    } finally {
      setSaving(false);
    }
  };

  const addSocialProfile = () => {
    setForm(prev => ({
      ...prev,
      social_profiles: [...prev.social_profiles, { platform: 'Website', profile_url: '' }],
    }));
  };

  const removeSocialProfile = (index: number) => {
    setForm(prev => ({
      ...prev,
      social_profiles: prev.social_profiles.filter((_, i) => i !== index),
    }));
  };

  const updateSocialProfile = (index: number, field: 'platform' | 'profile_url', value: string) => {
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
              <h3 className="text-xl font-bold text-white">
                {mode === 'create' ? 'Create Company' : 'Edit Company'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {mode === 'create' ? 'Add a new company to the database' : 'Update company details'}
              </p>
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
                  value={form.organization_name}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, organization_name: e.target.value }));
                    if (errors.organization_name) {
                      setErrors(prev => ({ ...prev, organization_name: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.organization_name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="e.g. Northern Logistics Inc."
                />
                {errors.organization_name && (
                  <p className="text-red-400 text-xs mt-1">{errors.organization_name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Doing Business As (DBA)</label>
                <input
                  type="text"
                  value={form.doing_business_as}
                  onChange={(e) => setForm(prev => ({ ...prev, doing_business_as: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. NorthLog"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Industry</option>
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.industry_code}>
                        {ind.industry_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Organization Type</label>
                  <select
                    value={form.organization_type}
                    onChange={(e) => setForm(prev => ({ ...prev, organization_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="S-Corporation">S-Corporation</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Customer">Customer</option>
                  <option value="Former Customer">Former Customer</option>
                  <option value="Do Not Contact">Do Not Contact</option>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Main Phone</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      📞
                    </span>
                    <input
                      type="tel"
                      value={form.main_phone}
                      onChange={(e) => setForm(prev => ({ ...prev, main_phone: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      ✉️
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="info@company.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Address Line 1</label>
                <input
                  type="text"
                  value={form.address_line_1}
                  onChange={(e) => setForm(prev => ({ ...prev, address_line_1: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Address Line 2 (Suite/Unit)</label>
                <input
                  type="text"
                  value={form.address_line_2}
                  onChange={(e) => setForm(prev => ({ ...prev, address_line_2: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Suite, Unit, Building, Floor, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Zip Code</label>
                  <input
                    type="text"
                    value={form.zip_code}
                    onChange={(e) => setForm(prev => ({ ...prev, zip_code: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter zip code"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">State</label>
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
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Number of Trucks</label>
                  <input
                    type="number"
                    value={form.truck_count}
                    onChange={(e) => setForm(prev => ({ ...prev, truck_count: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Number of Drivers</label>
                  <input
                    type="number"
                    value={form.driver_count}
                    onChange={(e) => setForm(prev => ({ ...prev, driver_count: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Employee Size</label>
                  <select
                    value={form.employee_size}
                    onChange={(e) => setForm(prev => ({ ...prev, employee_size: e.target.value }))}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Revenue</label>
                  <input
                    type="text"
                    value={form.revenue}
                    onChange={(e) => setForm(prev => ({ ...prev, revenue: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$1M - $5M"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Founded Date</label>
                  <input
                    type="date"
                    value={form.founded_date}
                    onChange={(e) => setForm(prev => ({ ...prev, founded_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Social Profiles & Links</label>
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
                        value={profile.profile_url}
                        onChange={(e) => updateSocialProfile(index, 'profile_url', e.target.value)}
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
                    <Plus className="w-4 h-4" />
                    Add Profile URL
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Overview / About Company</label>
                <textarea
                  value={form.overview}
                  onChange={(e) => setForm(prev => ({ ...prev, overview: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter company overview, description, or notes..."
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
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-green-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{mode === 'create' ? (saving ? 'Creating...' : 'Create & Attach') : (saving ? 'Saving...' : 'Save Changes')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

