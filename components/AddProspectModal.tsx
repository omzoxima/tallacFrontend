'use client';

import { useState, useEffect } from 'react';
import { X, User, Building2, Settings, Phone, Mail, ChevronLeft, ChevronRight, CheckCircle, Check, Globe } from 'lucide-react';
import { showToast } from './Toast';

interface AddProspectModalProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
  territories?: Array<{ id: string; territory_name: string }>;
}

interface PhoneEntry {
  number: string;
  type: string;
  isPrimary: boolean;
}

interface EmailEntry {
  address: string;
  type: string;
  isPrimary: boolean;
}

export default function AddProspectModal({ onClose, onSuccess, territories = [] }: AddProspectModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    lead_name: '',
    title: '',
    phones: [{ number: '', type: 'Mobile', isPrimary: true }] as PhoneEntry[],
    emails: [{ address: '', type: 'Work', isPrimary: true }] as EmailEntry[],
    website: '',
    company_overview: '',
    status: 'New',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const steps = [
    { label: 'Contact', icon: User, activeColor: 'bg-purple-600' },
    { label: 'Company', icon: Building2, activeColor: 'bg-blue-600' },
    { label: 'Additional', icon: Settings, activeColor: 'bg-yellow-600' },
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const industries = [
    'Logistics', 'Warehousing', 'Specialty Moving', 'Freight',
    'Air Cargo', 'Maritime Shipping', 'Trucking', 'Distribution',
    'Freight Forwarding', 'Express Delivery'
  ];

  // Phone management
  const addPhone = () => {
    setFormData({
      ...formData,
      phones: [...formData.phones, { number: '', type: 'Mobile', isPrimary: false }]
    });
  };

  const removePhone = (index: number) => {
    if (formData.phones.length > 1) {
      const newPhones = formData.phones.filter((_, i) => i !== index);
      if (!newPhones.some(p => p.isPrimary) && newPhones.length > 0) {
        newPhones[0].isPrimary = true;
      }
      setFormData({ ...formData, phones: newPhones });
    }
  };

  const setPrimaryPhone = (index: number) => {
    setFormData({
      ...formData,
      phones: formData.phones.map((phone, i) => ({ ...phone, isPrimary: i === index }))
    });
  };

  // Email management
  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, { address: '', type: 'Work', isPrimary: false }]
    });
  };

  const removeEmail = (index: number) => {
    if (formData.emails.length > 1) {
      const newEmails = formData.emails.filter((_, i) => i !== index);
      if (!newEmails.some(e => e.isPrimary) && newEmails.length > 0) {
        newEmails[0].isPrimary = true;
      }
      setFormData({ ...formData, emails: newEmails });
    }
  };

  const setPrimaryEmail = (index: number) => {
    setFormData({
      ...formData,
      emails: formData.emails.map((email, i) => ({ ...email, isPrimary: i === index }))
    });
  };

  // Phone formatting
  const formatPhoneNumber = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = '';
    
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    const newPhones = [...formData.phones];
    newPhones[index].number = formatted;
    setFormData({ ...formData, phones: newPhones });
  };

  // Validation
  const validateAllFields = () => {
    const newErrors: Record<string, string> = {};
    
    // Step 1: Contact
    if (!formData.lead_name.trim()) {
      newErrors.lead_name = 'Full name is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    
    // Validate email formats
    formData.emails.forEach((email, index) => {
      if (email.address && email.address.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.address)) {
        newErrors[`email_${index}`] = 'Invalid email format';
      }
    });
    
    // Step 2: Company
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required';
    } else if (!/^[0-9]{5}$/.test(formData.zip_code)) {
      newErrors.zip_code = 'ZIP code must be 5 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const findFirstErrorStep = () => {
    if (errors.lead_name || errors.title || Object.keys(errors).some(k => k.startsWith('email_'))) return 0;
    if (errors.company_name || errors.industry || errors.address || errors.city || errors.state || errors.zip_code) return 1;
    return 2;
  };

  const stepHasErrors = (stepIndex: number) => {
    if (stepIndex === 0) {
      return !!(errors.lead_name || errors.title || Object.keys(errors).some(k => k.startsWith('email_')));
    } else if (stepIndex === 1) {
      return !!(errors.company_name || errors.industry || errors.address || errors.city || errors.state || errors.zip_code);
    }
    return false;
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // Handle submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setHasSubmitted(true);
    
    if (!validateAllFields()) {
      setCurrentStep(findFirstErrorStep());
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      // Get primary phone and email
      const primaryPhone = formData.phones.find(p => p.isPrimary)?.number || formData.phones[0]?.number || '';
      const primaryEmail = formData.emails.find(e => e.isPrimary)?.address || formData.emails[0]?.address || '';
      
      const payload = {
        company_name: formData.company_name,
        industry: formData.industry,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code, // Mandatory - backend will find territory from this
        primary_contact_name: formData.lead_name,
        primary_title: formData.title,
        primary_phone: primaryPhone,
        primary_email: primaryEmail,
        website: formData.website,
        company_overview: formData.company_overview,
        status: formData.status,
      };
      
      const response = await fetch(`${apiUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create prospect');
      }

      const data = await response.json();
      showToast('Prospect created successfully!', 'success');
      onSuccess(data);
      onClose();
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg shadow-2xl border dark:border-gray-700 border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Prospect</h2>
            <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">Quick entry - Additional details can be added later</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-0 border-b dark:border-gray-700 border-gray-200 px-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const hasError = stepHasErrors(index);
            return (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200 relative ${
                  currentStep === index
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  hasError && hasSubmitted
                    ? 'bg-red-600'
                    : currentStep === index
                    ? step.activeColor
                    : 'bg-gray-700'
                }`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:inline">{step.label}</span>
                {currentStep === index && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${step.activeColor}`}></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Contact */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-900/50 dark:bg-gray-900/50 bg-gray-50 rounded-lg p-4 border dark:border-gray-700 border-gray-200">
                <h3 className="text-sm font-semibold text-white dark:text-white text-gray-900 mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2 text-purple-400" />
                  Contact Person
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lead_name}
                    onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                    placeholder="e.g., Emily Chen"
                    className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.lead_name ? 'border-red-500 ring-2 ring-red-500/30' : ''
                    }`}
                  />
                  {errors.lead_name && <p className="text-red-400 text-xs mt-1">{errors.lead_name}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Job Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Director of Logistics"
                    className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.title ? 'border-red-500 ring-2 ring-red-500/30' : ''
                    }`}
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Phone Numbers <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <div className="space-y-2">
                    {formData.phones.map((phone, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1 relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="tel"
                            value={phone.number}
                            onChange={(e) => formatPhoneNumber(e.target.value, index)}
                            placeholder="(555) 555-5555"
                            className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <select
                          value={phone.type}
                          onChange={(e) => {
                            const newPhones = [...formData.phones];
                            newPhones[index].type = e.target.value;
                            setFormData({ ...formData, phones: newPhones });
                          }}
                          className="px-3 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 text-sm"
                        >
                          <option value="Mobile">Mobile</option>
                          <option value="Office">Office</option>
                          <option value="Home">Home</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setPrimaryPhone(index)}
                          className={`p-2.5 rounded-lg transition-all ${
                            phone.isPrimary ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                          title={phone.isPrimary ? 'Primary phone' : 'Set as primary'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        {formData.phones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="p-2.5 bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-all"
                          >
                            <span className="text-sm font-bold">×</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPhone}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span className="text-lg font-bold">+</span> Add Phone Number
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Email Addresses <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <div className="space-y-2">
                    {formData.emails.map((email, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1 relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="email"
                            value={email.address}
                            onChange={(e) => {
                              const newEmails = [...formData.emails];
                              newEmails[index].address = e.target.value;
                              setFormData({ ...formData, emails: newEmails });
                            }}
                            placeholder="email@example.com"
                            className={`w-full pl-10 pr-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                              errors[`email_${index}`] ? 'border-red-500 ring-2 ring-red-500/30' : ''
                            }`}
                          />
                        </div>
                        <select
                          value={email.type}
                          onChange={(e) => {
                            const newEmails = [...formData.emails];
                            newEmails[index].type = e.target.value;
                            setFormData({ ...formData, emails: newEmails });
                          }}
                          className="px-3 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 text-sm"
                        >
                          <option value="Work">Work</option>
                          <option value="Personal">Personal</option>
                          <option value="Other">Other</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setPrimaryEmail(index)}
                          className={`p-2.5 rounded-lg transition-all ${
                            email.isPrimary ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                          title={email.isPrimary ? 'Primary email' : 'Set as primary'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        {formData.emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            className="p-2.5 bg-gray-700 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-all"
                          >
                            <span className="text-sm font-bold">×</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addEmail}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span className="text-lg font-bold">+</span> Add Email Address
                  </button>
                  {Object.keys(errors).filter(k => k.startsWith('email_')).map(key => (
                    <p key={key} className="text-red-400 text-xs mt-1">{errors[key]}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-900/50 dark:bg-gray-900/50 bg-gray-50 rounded-lg p-4 border dark:border-gray-700 border-gray-200">
                <h3 className="text-sm font-semibold text-white dark:text-white text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-blue-400" />
                  Company Information
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g., Northern Logistics or select existing"
                    className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.company_name ? 'border-red-500 ring-2 ring-red-500/30' : ''
                    }`}
                  />
                  {errors.company_name && <p className="text-red-400 text-xs mt-1">{errors.company_name}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Industry <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer ${
                      errors.industry ? 'border-red-500 ring-2 ring-red-500/30' : ''
                    }`}
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="text-red-400 text-xs mt-1">{errors.industry}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 1234 Main Street"
                    className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.address ? 'border-red-500 ring-2 ring-red-500/30' : ''
                    }`}
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Portland"
                      className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.city ? 'border-red-500 ring-2 ring-red-500/30' : ''
                      }`}
                    />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                      State <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer ${
                        errors.state ? 'border-red-500 ring-2 ring-red-500/30' : ''
                      }`}
                    >
                      <option value="">State</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                      ZIP Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zip_code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setFormData({ ...formData, zip_code: value });
                      }}
                      placeholder="97201"
                      pattern="[0-9]{5}"
                      maxLength={5}
                      className={`w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.zip_code ? 'border-red-500 ring-2 ring-red-500/30' : ''
                      }`}
                    />
                    {errors.zip_code && <p className="text-red-400 text-xs mt-1">{errors.zip_code}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-900/50 dark:bg-gray-900/50 bg-gray-50 rounded-lg p-4 border dark:border-gray-700 border-gray-200">
                <h3 className="text-sm font-semibold text-white dark:text-white text-gray-900 mb-4 flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-yellow-400" />
                  Additional Details
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Optional - Can be added later)</span>
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Website <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                    Company Overview <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    rows={8}
                    value={formData.company_overview}
                    onChange={(e) => setFormData({ ...formData, company_overview: e.target.value })}
                    placeholder="Add business intelligence about the company such as:&#10;• Business model and key products/services&#10;• Target market and customer base&#10;• Competitive position and differentiators&#10;• Recent news, growth trends, or initiatives&#10;• Key decision makers or organizational structure&#10;• Pain points or opportunities for partnership"
                    className="w-full px-4 py-2.5 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-300 rounded-lg dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  ></textarea>
                  <p className="text-gray-500 text-xs mt-1">Provide strategic insights and intelligence that will help qualify and engage this prospect effectively</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3 mt-4">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="flex-1">
                <p className="font-medium">Error creating prospect</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700 border-gray-200 dark:bg-gray-800 bg-gray-50">
          <div className="sm:hidden text-xs text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          {/* Mobile Layout */}
          <div className="flex sm:hidden flex-col gap-2 w-full">
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold text-sm w-full"
              >
                <span>{currentStep === 1 ? 'Continue' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold text-sm w-full"
              >
                {!isSubmitting && <CheckCircle className="w-4 h-4" />}
                {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>Save Prospect</span>
              </button>
            )}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={previousStep}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all font-medium text-sm flex-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all font-medium text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center gap-3 w-full">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={previousStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div className="w-24"></div>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-400 hover:text-gray-300 rounded-lg transition-all font-medium text-sm"
            >
              Cancel
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm"
              >
                <span>{currentStep === 1 ? 'Continue' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm"
              >
                {!isSubmitting && <CheckCircle className="w-4 h-4" />}
                {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>Save Prospect</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
