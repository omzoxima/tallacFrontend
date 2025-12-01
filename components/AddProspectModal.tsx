'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Building2, User, MapPin, Search } from 'lucide-react';
import { showToast } from './Toast';

interface AddProspectModalProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
  territories?: Array<{ id: string; territory_name: string }>;
}

export default function AddProspectModal({ onClose, onSuccess, territories = [] }: AddProspectModalProps) {
  const [companySearch, setCompanySearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<any>(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);
  const [territorySearch, setTerritorySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // Load companies and contacts from API
  useEffect(() => {
    loadCompanies();
    loadContacts();
  }, []);

  const loadCompanies = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/companies?limit=1000`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently fail companies loading
    }
  };

  const loadContacts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/contacts?limit=1000`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently fail contacts loading
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return [];
    const searchLower = companySearch.toLowerCase();
    return companies.filter(c => {
      const name = (c.company_name || c.name || '').toLowerCase();
      return name.includes(searchLower);
    });
  }, [companies, companySearch]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return [];
    const searchLower = contactSearch.toLowerCase();
    return contacts.filter(c => {
      const name = (c.full_name || c.name || '').toLowerCase();
      const email = (c.email_id || c.email || '').toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });
  }, [contacts, contactSearch]);

  const filteredTerritories = useMemo(() => {
    if (territorySearch) {
      return territories.filter(t => {
        const name = t.territory_name || '';
        return name.toLowerCase().includes(territorySearch.toLowerCase());
      });
    }
    // Show first 2 initially, all when searching
    return territories.length > 2 ? territories.slice(0, 2) : territories;
  }, [territories, territorySearch]);

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setCompanySearch(company.company_name || company.name || '');
    setShowCompanyDropdown(false);
  };

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setContactSearch(contact.full_name || contact.name || '');
    setShowContactDropdown(false);
  };

  const handleTerritorySelect = (territory: any) => {
    setSelectedTerritory(territory);
    setShowTerritoryModal(false);
    setTerritorySearch('');
  };

  const handleSubmit = async () => {
    if (!selectedCompany && !companySearch.trim()) {
      showToast('Please select or enter a company name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const payload: any = {
        company_name: selectedCompany?.company_name || selectedCompany?.name || companySearch.trim(),
        status: 'New',
      };
      
      // Only add zip_code if territory is not selected
      if (!selectedTerritory) {
        payload.zip_code = ''; // Will be validated on backend
      }

      // Add contact if selected - send contact ID if exists
      if (selectedContact) {
        payload.selectedContact = {
          id: selectedContact.id,
          full_name: selectedContact.full_name || selectedContact.name,
          email: selectedContact.email_id || selectedContact.email,
          phone: selectedContact.mobile_no || selectedContact.phone,
        };
        // Also keep for backward compatibility
        payload.primary_contact_name = selectedContact.full_name || selectedContact.name;
        payload.primary_email = selectedContact.email_id || selectedContact.email;
        payload.primary_phone = selectedContact.mobile_no || selectedContact.phone;
      } else if (contactSearch.trim()) {
        payload.primary_contact_name = contactSearch.trim();
      }

      // Add territory if selected
      if (selectedTerritory) {
        payload.territory_id = selectedTerritory.id;
      }

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
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && error.message) || 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
        <div
          className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white">Add New Prospect</h2>
              <p className="text-sm text-gray-400 mt-1">Quick entry - Additional details can be added later</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* COMPANY Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <Building2 className="w-4 h-4" />
                COMPANY
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setShowCompanyDropdown(true);
                    if (!e.target.value) {
                      setSelectedCompany(null);
                    }
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  placeholder="Search or create company..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showCompanyDropdown && companySearch && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.map((company, index) => (
                      <button
                        key={company.id || index}
                        onClick={() => handleCompanySelect(company)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                      >
                        {company.company_name || company.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CONTACT (Optional) Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <User className="w-4 h-4" />
                CONTACT <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setShowContactDropdown(true);
                    if (!e.target.value) {
                      setSelectedContact(null);
                    }
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  placeholder="Search or create contact..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showContactDropdown && contactSearch && filteredContacts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredContacts.map((contact, index) => (
                      <button
                        key={contact.id || index}
                        onClick={() => handleContactSelect(contact)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                      >
                        <div className="font-medium">{contact.full_name || contact.name}</div>
                        {contact.email_id || contact.email ? (
                          <div className="text-xs text-gray-400">{contact.email_id || contact.email}</div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TERRITORY Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <MapPin className="w-4 h-4" />
                TERRITORY
              </label>
              {selectedTerritory ? (
                <div className="flex items-center justify-between p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                  <span className="text-white text-sm">{selectedTerritory.territory_name}</span>
                  <button
                    onClick={() => {
                      setSelectedTerritory(null);
                      setShowTerritoryModal(true);
                    }}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTerritoryModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                >
                  <span className="text-lg">+</span>
                  <span>Add Territory</span>
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Prospect will be visible to users in assigned territories.
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Prospect'}
            </button>
          </div>
        </div>
      </div>

      {/* Territory Selection Modal */}
      {showTerritoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowTerritoryModal(false)}>
          <div
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Select Territory</h3>
              <button
                onClick={() => setShowTerritoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={territorySearch}
                  onChange={(e) => setTerritorySearch(e.target.value)}
                  placeholder="Search territories..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredTerritories.length > 0 ? (
                  filteredTerritories.map((territory) => (
                    <button
                      key={territory.id}
                      onClick={() => handleTerritorySelect(territory)}
                      className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors"
                    >
                      {territory.territory_name}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No territories found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showCompanyDropdown || showContactDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCompanyDropdown(false);
            setShowContactDropdown(false);
          }}
        />
      )}
    </>
  );
}
