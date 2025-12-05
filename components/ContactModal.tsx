'use client';

import { useState, useEffect } from 'react';
import { X, User, Plus, Trash2, Phone, Mail, Building2, Users } from 'lucide-react';
import { showToast } from './Toast';

interface ContactModalProps {
  show: boolean;
  mode: 'add' | 'edit';
  contactData?: any;
  organizationId?: string;
  onClose: () => void;
  onSave: (contactData: any) => void;
}

export default function ContactModal({
  show,
  mode,
  contactData,
  organizationId,
  onClose,
  onSave,
}: ContactModalProps) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: '',
    designation: '',
    phones: [{ phone: '', is_primary_phone: 1 }],
    emails: [{ email_id: '', is_primary: 1 }],
    preferred_call_time: '',
    organization_id: organizationId || '',
    partner_id: '',
  });

  useEffect(() => {
    if (show) {
      loadOrganizations();
      loadPartners();
    }
  }, [show]);

  useEffect(() => {
    if (contactData && mode === 'edit') {
      setForm({
        full_name: contactData.full_name || contactData.name || '',
        designation: contactData.designation || contactData.job_title || '',
        phones: contactData.phone_nos && contactData.phone_nos.length > 0
          ? contactData.phone_nos.map((p: any) => ({ phone: p.phone, is_primary_phone: p.is_primary_phone ? 1 : 0 }))
          : [{ phone: contactData.mobile_no || contactData.phone || '', is_primary_phone: 1 }],
        emails: contactData.email_ids && contactData.email_ids.length > 0
          ? contactData.email_ids.map((e: any) => ({ email_id: e.email_id, is_primary: e.is_primary ? 1 : 0 }))
          : [{ email_id: contactData.email || contactData.email_id || '', is_primary: 1 }],
        preferred_call_time: contactData.preferred_call_time || '',
        organization_id: contactData.organization_id || organizationId || '',
        partner_id: contactData.partner_id || '',
      });
    } else {
      resetForm();
    }
  }, [contactData, mode, show, organizationId]);

  const resetForm = () => {
    setForm({
      full_name: '',
      designation: '',
      phones: [{ phone: '', is_primary_phone: 1 }],
      emails: [{ email_id: '', is_primary: 1 }],
      preferred_call_time: '',
      organization_id: organizationId || '',
      partner_id: '',
    });
    setErrors({});
  };

  const loadOrganizations = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/organizations?limit=1000`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setOrganizations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadPartners = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/partners?limit=1000`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setPartners(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const addPhone = () => {
    setForm(prev => ({
      ...prev,
      phones: [...prev.phones, { phone: '', is_primary_phone: 0 }],
    }));
  };

  const removePhone = (index: number) => {
    setForm(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }));
  };

  const handlePrimaryPhoneChange = (index: number) => {
    setForm(prev => ({
      ...prev,
      phones: prev.phones.map((phone, i) => ({
        ...phone,
        is_primary_phone: i === index ? 1 : 0,
      })),
    }));
  };

  const addEmail = () => {
    setForm(prev => ({
      ...prev,
      emails: [...prev.emails, { email_id: '', is_primary: 0 }],
    }));
  };

  const removeEmail = (index: number) => {
    setForm(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  const handlePrimaryEmailChange = (index: number) => {
    setForm(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => ({
        ...email,
        is_primary: i === index ? 1 : 0,
      })),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.full_name || form.full_name.trim() === '') {
      newErrors.full_name = 'Full name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    form.emails.forEach((email, index) => {
      if (email.email_id && !emailRegex.test(email.email_id)) {
        newErrors[`email_${index}`] = 'Invalid email format';
        newErrors.email_format = 'One or more emails have invalid format';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const contactData = {
        ...form,
        phones: form.phones.filter(p => p.phone && p.phone.trim() !== ''),
        emails: form.emails.filter(e => e.email_id && e.email_id.trim() !== ''),
        organization_id: organizationId,
      };
      
      onSave(contactData);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                {mode === 'add' ? 'Add New Contact' : 'Edit Contact'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {mode === 'add' ? 'Create a new contact for this organization' : 'Update contact information'}
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.full_name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter full name"
            />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
          </div>

          {/* Designation */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Designation/Title</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => setForm(prev => ({ ...prev, designation: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Director of Operations"
            />
          </div>

          {/* Organization (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Building2 className="w-4 h-4" />
              Organization <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <select
              value={form.organization_id}
              onChange={(e) => setForm(prev => ({ ...prev, organization_id: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- No Organization --</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.organization_name || org.name} {org.city ? `(${org.city}, ${org.state})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Link this contact to a company</p>
          </div>

          {/* Partner (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Users className="w-4 h-4" />
              Partner <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <select
              value={form.partner_id}
              onChange={(e) => setForm(prev => ({ ...prev, partner_id: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- No Partner --</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.partner_name || partner.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Link this contact to a partner organization</p>
          </div>

          {/* Mobile Numbers */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Mobile Numbers</label>
            <div className="space-y-2">
              {form.phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="tel"
                    value={phone.phone}
                    onChange={(e) => {
                      const newPhones = [...form.phones];
                      newPhones[index].phone = e.target.value;
                      setForm(prev => ({ ...prev, phones: newPhones }));
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                  <select
                    value={phone.is_primary_phone}
                    onChange={(e) => {
                      handlePrimaryPhoneChange(index);
                    }}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Secondary</option>
                    <option value={1}>Primary</option>
                  </select>
                  {form.phones.length > 1 && (
                    <button
                      onClick={() => removePhone(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove phone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPhone}
                className="flex items-center gap-1.5 px-3 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Phone Number
              </button>
            </div>
          </div>

          {/* Email Addresses */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Email Addresses</label>
            <div className="space-y-2">
              {form.emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    value={email.email_id}
                    onChange={(e) => {
                      const newEmails = [...form.emails];
                      newEmails[index].email_id = e.target.value;
                      setForm(prev => ({ ...prev, emails: newEmails }));
                    }}
                    className={`flex-1 px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`email_${index}`] ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter email address"
                  />
                  <select
                    value={email.is_primary}
                    onChange={(e) => {
                      handlePrimaryEmailChange(index);
                    }}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>Secondary</option>
                    <option value={1}>Primary</option>
                  </select>
                  {form.emails.length > 1 && (
                    <button
                      onClick={() => removeEmail(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove email"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.email_format && <p className="text-red-400 text-xs">{errors.email_format}</p>}
              <button
                onClick={addEmail}
                className="flex items-center gap-1.5 px-3 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Email Address
              </button>
            </div>
          </div>

          {/* Preferred Call Timing */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Preferred Call Timing</label>
            <input
              type="text"
              value={form.preferred_call_time}
              onChange={(e) => setForm(prev => ({ ...prev, preferred_call_time: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 9:00 AM - 5:00 PM, Weekdays only"
            />
            <p className="text-xs text-gray-400 mt-1">Specify the best time to reach this contact</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            disabled={saving}
          >
            {saving ? 'Saving...' : mode === 'add' ? 'Create Contact' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

