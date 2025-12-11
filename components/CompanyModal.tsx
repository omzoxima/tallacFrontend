'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, MapPin, BarChart2, Globe, Phone, Plus, X } from 'lucide-react';
import BaseModal from './BaseModal';
import CustomDropdown from './CustomDropdown';
import { api } from '@/lib/api';

interface CompanyModalProps {
  initialData?: any;
  mode?: 'create' | 'edit';
  zIndex?: number;
  onClose: () => void;
  onSave: (companyData: any) => void;
}

export default function CompanyModal({
  initialData,
  mode = 'create',
  zIndex = 10002,
  onClose,
  onSave,
}: CompanyModalProps) {
  const isEditMode = mode === 'edit';
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [industries, setIndustries] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    organization_name: '',
    industry: '',
    website: '',
    phone: '',
    address_line_1: '',
    city: '',
    state: '',
    zip_code: '',
    territory: '',
    employee_size: '',
    revenue: '',
    social_profiles: [] as Array<{ platform: string; profile_url: string }>,
    overview: '',
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'profile', label: 'Profile', icon: BarChart2 },
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  const stateOptions = states.map((s) => ({ label: s, value: s }));

  const industryOptions = useMemo(() => {
    const opts = new Set(industries);
    if (formData.industry) {
      opts.add(formData.industry);
    }
    return Array.from(opts)
      .filter(Boolean)
      .sort()
      .map((i) => ({ label: i, value: i }));
  }, [industries, formData.industry]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        organization_name: initialData.organization_name || '',
        industry: initialData.industry || '',
        website: initialData.website || '',
        phone: initialData.phone || '',
        address_line_1: initialData.address_line_1 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip_code: initialData.zip_code || '',
        territory: initialData.territory || '',
        employee_size: initialData.employee_size || '',
        revenue: initialData.revenue || '',
        social_profiles: initialData.social_profiles
          ? initialData.social_profiles.map((p: any) => ({ ...p }))
          : [],
        overview: initialData.overview || '',
      });

      if (!formData.website && formData.social_profiles.length > 0) {
        const websiteProfile = formData.social_profiles.find((p) => p.platform === 'Website');
        if (websiteProfile && websiteProfile.profile_url) {
          setFormData((prev) => ({ ...prev, website: websiteProfile.profile_url }));
        }
      }
    }

    loadIndustries();
  }, [initialData]);

  const loadIndustries = async () => {
    try {
      const result = await api.getIndustries();
      if (result.success && result.data) {
        setIndustries(result.data.map((i: any) => i.industry_name || i.name));
      }
    } catch (e) {
      console.warn('Failed to fetch industries', e);
    }
  };

  const addSocialProfile = () => {
    setFormData({
      ...formData,
      social_profiles: [...formData.social_profiles, { platform: 'Other', profile_url: '' }],
    });
  };

  const removeSocialProfile = (index: number) => {
    setFormData({
      ...formData,
      social_profiles: formData.social_profiles.filter((_, i) => i !== index),
    });
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9+\-()\s]/g, '');
    if (value.length > 15) {
      value = value.slice(0, 15);
    }
    setFormData({ ...formData, phone: value });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Company Name is required';
      isValid = false;
    }

    const hasLocationData =
      formData.address_line_1 || formData.city || formData.state || formData.zip_code;

    if (hasLocationData) {
      if (!formData.city) {
        newErrors.city = 'City is required';
        isValid = false;
      }
      if (!formData.state) {
        newErrors.state = 'State is required';
        isValid = false;
      }
      if (!formData.zip_code) {
        newErrors.zip_code = 'Zip Code is required';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) {
      if (errors.organization_name) setActiveTab('general');
      else if (errors.city || errors.state || errors.zip_code) setActiveTab('location');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = { ...formData };

      if (payload.city) {
        payload.address_line_2 = payload.city;
      }

      if (payload.website) {
        const hasWebsite = payload.social_profiles.some((p: any) => p.platform === 'Website');
        if (!hasWebsite) {
          payload.social_profiles.push({ platform: 'Website', profile_url: payload.website });
        }
      }

      payload.social_profiles = payload.social_profiles.map((p: any) => {
        let platform = p.platform || 'Other';
        if (platform === 'Other' && p.profile_url) {
          const url = p.profile_url.toLowerCase();
          if (url.includes('linkedin')) platform = 'LinkedIn';
          else if (url.includes('twitter') || url.includes('x.com')) platform = 'Twitter';
          else if (url.includes('facebook')) platform = 'Facebook';
          else if (url.includes('instagram')) platform = 'Instagram';
        }
        return { ...p, platform };
      });

      onSave(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const TabIcon = ({ icon: Icon }: { icon: any }) => <Icon className="w-4 h-4" />;

  return (
    <BaseModal
      title={isEditMode ? 'Edit Company' : 'Create Company'}
      subtitle={isEditMode ? 'Update company details' : 'Add a new company to the database'}
      maxWidth="2xl"
      onClose={onClose}
    >
      <div className="flex flex-col h-[600px]">
        <div className="flex border-b border-gray-700 bg-gray-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-gray-700/50'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <TabIcon icon={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.organization_name}
                  onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                  type="text"
                  required
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.organization_name ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="e.g. Northern Logistics"
                />
                {errors.organization_name && (
                  <p className="text-red-400 text-xs mt-1">{errors.organization_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                <CustomDropdown
                  value={formData.industry}
                  options={industryOptions}
                  onChange={(value) => setFormData({ ...formData, industry: value })}
                  buttonClass="bg-gray-700 border-gray-600 text-white"
                  showColorDot={false}
                  showCheckmark={true}
                  searchable={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    type="url"
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Main Phone <span className="text-gray-500 text-xs">(Office)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={formData.phone}
                    onChange={handlePhoneInput}
                    type="text"
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'location' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
                <input
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  type="text"
                  required
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Portland"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    State <span className="text-red-400">*</span>
                  </label>
                  <CustomDropdown
                    value={formData.state}
                    options={stateOptions}
                    onChange={(value) => setFormData({ ...formData, state: value })}
                    buttonClass={`bg-gray-700 border text-white ${
                      errors.state ? 'border-red-500' : 'border-gray-600'
                    }`}
                    showColorDot={false}
                    showCheckmark={true}
                  />
                  {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Zip Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    type="text"
                    required
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.zip_code ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="97201"
                  />
                  {errors.zip_code && <p className="text-red-400 text-xs mt-1">{errors.zip_code}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Employee Count</label>
                  <select
                    value={formData.employee_size}
                    onChange={(e) => setFormData({ ...formData, employee_size: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Range</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Annual Revenue</label>
                  <input
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$1M - $5M"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Social Profiles</label>
                <div className="space-y-2">
                  {formData.social_profiles.map((profile, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={profile.profile_url}
                        onChange={(e) => {
                          const newProfiles = [...formData.social_profiles];
                          newProfiles[index].profile_url = e.target.value;
                          setFormData({ ...formData, social_profiles: newProfiles });
                        }}
                        type="text"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="https://linkedin.com/company/..."
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialProfile(index)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSocialProfile}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Profile URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Overview / About Us</label>
                <textarea
                  value={formData.overview}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Company description..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-green-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            <span>{isEditMode ? 'Save Changes' : 'Create & Attach'}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

