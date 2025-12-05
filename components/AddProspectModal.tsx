'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Building2, User, MapPin, Search, Plus } from 'lucide-react';
import { showToast } from './Toast';
import EditCompanyModal from './EditCompanyModal';
import ContactModal from './ContactModal';

interface AddProspectModalProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
  territories?: Array<{ id: string; territory_name: string }>;
}

export default function AddProspectModal({ onClose, onSuccess, territories = [] }: AddProspectModalProps) {
  const [companySearch, setCompanySearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]); // Changed to array for multiple
  const [showContactList, setShowContactList] = useState(false); // Show list instead of search
  const [autoTerritory, setAutoTerritory] = useState<any>(null); // Auto-assigned from company
  const [additionalTerritories, setAdditionalTerritories] = useState<any[]>([]); // Manually added
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [territorySearch, setTerritorySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companyContacts, setCompanyContacts] = useState<any[]>([]);

  // Load companies and contacts from API
  useEffect(() => {
    loadCompanies();
    loadContacts();
  }, []);

  // Load contacts and territory for selected company
  useEffect(() => {
    if (selectedCompany?.id) {
      loadCompanyContacts(selectedCompany.id);
      
      // Auto-assign territory from company if available
      console.log('🏢 Selected company:', selectedCompany);
      console.log('🎯 Company territory_id:', selectedCompany.territory_id);
      console.log('📍 Available territories:', territories);
      
      // Try multiple methods to find territory
      let companyTerritory = null;
      
      if (selectedCompany.territory_id) {
        // Method 1: Match by territory_id (UUID)
        companyTerritory = territories.find(t => t.id === selectedCompany.territory_id);
        console.log('🔍 Match by ID:', companyTerritory);
      }
      
      // Method 2: If not found by ID, try by territory_name
      if (!companyTerritory && selectedCompany.territory_name) {
        companyTerritory = territories.find(
          t => t.territory_name === selectedCompany.territory_name
        );
        console.log('🔍 Match by Name:', companyTerritory);
      }
      
      // Method 3: If still not found but company has territory field
      if (!companyTerritory && selectedCompany.territory) {
        companyTerritory = territories.find(
          t => t.id === selectedCompany.territory || t.territory_name === selectedCompany.territory
        );
        console.log('🔍 Match by territory field:', companyTerritory);
      }
      
      if (companyTerritory) {
        console.log('✅ Auto-assigning territory:', companyTerritory);
        setAutoTerritory(companyTerritory);
      } else {
        console.log('⚠️ No territory found for company');
        setAutoTerritory(null);
      }
    } else {
      setCompanyContacts([]);
      setAutoTerritory(null);
      setSelectedContacts([]); // Changed from setSelectedContact to setSelectedContacts
      setContactSearch('');
    }
  }, [selectedCompany, territories]);

  const loadCompanies = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Changed from /api/companies to /api/organizations to get tallac_organizations data
      const response = await fetch(`${apiUrl}/api/organizations?limit=1000`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        // API returns { success: true, data: [...] }
        const data = result.data || result;
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
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

  const loadCompanyContacts = async (organizationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/contacts?organization_id=${organizationId}&limit=1000`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setCompanyContacts(Array.isArray(data) ? data : []);
      }
    } catch {
      setCompanyContacts([]);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return [];
    const searchLower = companySearch.toLowerCase();
    return companies.filter(c => {
      const name = (c.organization_name || c.company_name || c.name || '').toLowerCase();
      const dba = (c.doing_business_as || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      return name.includes(searchLower) || dba.includes(searchLower) || city.includes(searchLower);
    });
  }, [companies, companySearch]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return [];
    const searchLower = contactSearch.toLowerCase();
    
    // If company is selected, filter from company contacts, otherwise from all contacts
    const contactsToFilter = selectedCompany ? companyContacts : contacts;
    
    return contactsToFilter.filter(c => {
      const name = (c.full_name || c.name || '').toLowerCase();
      const email = (c.email_id || c.email || '').toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });
  }, [contacts, companyContacts, contactSearch, selectedCompany]);

  const filteredTerritories = useMemo(() => {
    // Exclude auto-territory and already added additional territories
    const excludeIds = [
      autoTerritory?.id,
      ...additionalTerritories.map(t => t.id)
    ].filter(Boolean);
    
    let available = territories.filter(t => !excludeIds.includes(t.id));
    
    if (territorySearch) {
      available = available.filter(t => {
        const name = t.territory_name || '';
        return name.toLowerCase().includes(territorySearch.toLowerCase());
      });
      return available;
    }
    
    // Show all available territories
    return available;
  }, [territories, territorySearch, autoTerritory, additionalTerritories]);

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setCompanySearch('');
    setShowCompanyDropdown(false);
    // Clear selected contacts when company changes
    setSelectedContacts([]);
    setContactSearch('');
  };

  const handleRemoveCompany = () => {
    setSelectedCompany(null);
    setCompanySearch('');
    setSelectedContacts([]); // Clear all selected contacts
    setContactSearch('');
    setShowContactList(false);
    setAutoTerritory(null);
    setAdditionalTerritories([]);
  };

  const handleCreateCompany = () => {
    setShowCreateCompanyModal(true);
    setShowCompanyDropdown(false);
  };

  const handleCompanyCreated = async (companyData: any) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${apiUrl}/api/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedCompany(result.data);
        setCompanySearch(result.data.organization_name);
        setShowCreateCompanyModal(false);
        showToast('Company created successfully!', 'success');
        // Reload companies list
        loadCompanies();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create company', 'error');
      }
    } catch (error) {
      showToast('Failed to create company', 'error');
    }
  };

  const handleCreateContact = () => {
    if (!selectedCompany) {
      showToast('Please select a company first', 'error');
      return;
    }
    setShowCreateContactModal(true);
    setShowContactDropdown(false);
  };

  const handleContactCreated = async (contactData: any) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('token');
    
    try {
      const payload = {
        ...contactData,
        // Set organization_id only if selectedCompany exists, otherwise use what contact modal provided
        organization_id: contactData.organization_id || selectedCompany?.id || null,
        partner_id: contactData.partner_id || null,
      };

      const response = await fetch(`${apiUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        // Add to selected contacts array
        setSelectedContacts([...selectedContacts, result.contact]);
        setShowCreateContactModal(false);
        showToast('Contact created successfully!', 'success');
        // Reload company contacts if company was selected
        if (selectedCompany?.id || contactData.organization_id) {
          loadCompanyContacts(contactData.organization_id || selectedCompany.id);
        }
        // Also reload all contacts
        loadContacts();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create contact', 'error');
      }
    } catch (error) {
      showToast('Failed to create contact', 'error');
    }
  };

  const handleContactSelect = (contact: any) => {
    // Toggle contact selection (can select multiple)
    const isSelected = selectedContacts.find(c => c.id === contact.id);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
  };

  const handleTerritorySelect = (territory: any) => {
    // Add to additional territories if not already there and not auto-territory
    if (autoTerritory?.id === territory.id) {
      showToast('This territory is already auto-assigned from company', 'info');
    } else if (!additionalTerritories.find(t => t.id === territory.id)) {
      setAdditionalTerritories([...additionalTerritories, territory]);
    }
    setShowTerritoryModal(false);
    setTerritorySearch('');
  };

  const handleRemoveAdditionalTerritory = (territoryId: string) => {
    setAdditionalTerritories(additionalTerritories.filter(t => t.id !== territoryId));
  };

  const handleSubmit = async () => {
    if (!selectedCompany) {
      showToast('Please select a company', 'error');
      return;
    }

    // If no contacts selected, create one prospect without contact
    // If contacts selected, create one prospect per contact
    const contactsToProcess = selectedContacts.length > 0 ? selectedContacts : [null];

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      // Prepare territories
      const allTerritories: string[] = [];
      if (autoTerritory) {
        allTerritories.push(autoTerritory.id);
      }
      additionalTerritories.forEach(t => {
        if (!allTerritories.includes(t.id)) {
          allTerritories.push(t.id);
        }
      });

      let createdCount = 0;
      let failedCount = 0;

      // Create prospect for each selected contact
      for (const contact of contactsToProcess) {
      const payload: any = {
          company_name: selectedCompany.organization_name || selectedCompany.company_name || selectedCompany.name,
          organization_id: selectedCompany.id,
        status: 'New',
      };
      
        // Add contact if exists
        if (contact) {
          payload.primary_contact_id = contact.id;
        payload.selectedContact = {
            id: contact.id,
            full_name: contact.full_name || contact.name,
            email: contact.email_id || contact.email,
            phone: contact.mobile_no || contact.phone,
          };
        }

        // Add territories
        if (allTerritories.length > 0) {
          payload.territory_id = allTerritories[0];
          payload.territory_ids = allTerritories;
        }

        try {
      const response = await fetch(`${apiUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

          if (response.ok) {
            createdCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      if (createdCount > 0) {
        const message = createdCount === 1 
          ? 'Prospect created successfully!' 
          : `${createdCount} prospects created successfully!`;
        showToast(message, 'success');
        onSuccess({ count: createdCount });
      onClose();
      } else {
        showToast('Failed to create prospects', 'error');
      }
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
          className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
              
              {selectedCompany ? (
                /* Selected Company Card */
                <div className="flex items-start gap-3 p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-base mb-2 truncate">
                      {selectedCompany.organization_name || selectedCompany.company_name || selectedCompany.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {selectedCompany.industry && (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded">
                          {selectedCompany.industry}
                        </span>
                      )}
                      {(selectedCompany.city || selectedCompany.state) && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {[selectedCompany.city, selectedCompany.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {selectedCompany.zip_code && (
                        <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded">
                          {selectedCompany.zip_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCompany}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1"
                    title="Remove company"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Company Search Input */
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
                  {showCompanyDropdown && companySearch && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCompanies.length > 0 ? (
                        <>
                    {filteredCompanies.map((company, index) => (
                      <button
                        key={company.id || index}
                        onClick={() => handleCompanySelect(company)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors border-b border-gray-600 last:border-b-0"
                      >
                              <div className="font-medium">{company.company_name || company.name || company.organization_name}</div>
                              {(company.city || company.state) && (
                                <div className="text-xs text-gray-400">{[company.city, company.state].filter(Boolean).join(', ')}</div>
                              )}
                      </button>
                    ))}
                          <button
                            onClick={handleCreateCompany}
                            className="w-full text-left px-4 py-3 text-sm bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors flex items-center gap-2 border-t border-gray-600"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create &quot;{companySearch}&quot;</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleCreateCompany}
                          className="w-full text-left px-4 py-3 text-sm bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create &quot;{companySearch}&quot;</span>
                        </button>
                      )}
                  </div>
                )}
              </div>
              )}
            </div>

            {/* CONTACT (Optional) Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <User className="w-4 h-4" />
                CONTACTS <span className="text-gray-500 text-xs">(Optional - Select Multiple)</span>
              </label>
              
              {!selectedCompany ? (
                /* Disabled state - Company must be selected first */
                <div>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      disabled
                      placeholder="Select a company first..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-500 placeholder-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Please select a company to enable contact selection</p>
                </div>
              ) : (
                /* Enabled - Company selected */
                <div className="space-y-3">
                  {/* Selected Contacts */}
                  {selectedContacts.length > 0 && (
                    <div className="space-y-2">
                      {selectedContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center gap-2 px-3 py-2 bg-green-600/20 border border-green-600/40 rounded-lg">
                          <User className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-white flex-1">{contact.full_name || contact.name}</span>
                          {contact.email_id || contact.email ? (
                            <span className="text-xs text-gray-400">{contact.email_id || contact.email}</span>
                          ) : null}
                          <button
                            onClick={() => handleRemoveContact(contact.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove contact"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <p className="text-xs text-green-400">
                        ✓ {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected - {selectedContacts.length} prospect{selectedContacts.length > 1 ? 's' : ''} will be created
                      </p>
                    </div>
                  )}

                  {/* Contact List Button */}
                  <button
                    onClick={() => setShowContactList(!showContactList)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{showContactList ? 'Hide Contacts' : `Select Contacts (${companyContacts.length} available)`}</span>
                  </button>

                  {/* Contact List Dropdown */}
                  {showContactList && (
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-600 rounded-lg p-2 bg-gray-700/30">
                      {companyContacts.length > 0 ? (
                        <>
                          {companyContacts.map((contact) => {
                            const isSelected = selectedContacts.find(c => c.id === contact.id);
                            return (
                              <button
                                key={contact.id}
                                onClick={() => handleContactSelect(contact)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                                  isSelected 
                                    ? 'bg-green-600/30 border border-green-600/50 text-white' 
                                    : 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-green-600 border-green-500' : 'border-gray-500'
                                }`}>
                                  {isSelected && <span className="text-white text-xs">✓</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{contact.full_name || contact.name}</div>
                                  {(contact.email_id || contact.email || contact.job_title) && (
                                    <div className="text-xs text-gray-400 truncate">
                                      {contact.job_title && <span>{contact.job_title}</span>}
                                      {contact.job_title && (contact.email_id || contact.email) && <span> • </span>}
                                      {(contact.email_id || contact.email) && <span>{contact.email_id || contact.email}</span>}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          No contacts found for this company
                        </div>
                      )}
                      
                      {/* Create New Contact Button */}
                      <button
                        onClick={handleCreateContact}
                        className="w-full text-left px-4 py-3 text-sm bg-green-600/10 hover:bg-green-600/20 text-green-400 transition-colors flex items-center gap-2 rounded-lg border-t border-gray-600 mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Contact</span>
                      </button>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* TERRITORY Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <MapPin className="w-4 h-4" />
                TERRITORY
              </label>
              
              <div className="space-y-2">
                {/* Auto-assigned Territory from Company */}
                {autoTerritory && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/30 border border-gray-600 rounded-lg">
                    <span className="flex items-center gap-1.5 text-sm text-gray-300 flex-1">
                      <span className="text-yellow-400">🔒</span>
                      <span>{autoTerritory.territory_name} <span className="text-gray-500">(Auto)</span></span>
                    </span>
                  </div>
                )}
                
                {/* Additional Territories */}
                {additionalTerritories.map((territory) => (
                  <div key={territory.id} className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <span className="text-sm text-white flex-1">{territory.territory_name}</span>
                  <button
                      onClick={() => handleRemoveAdditionalTerritory(territory.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove territory"
                    >
                      <X className="w-4 h-4" />
                  </button>
                </div>
                ))}
                
                {/* Add Territory Button */}
                <button
                  onClick={() => setShowTerritoryModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Territory</span>
                </button>
              </div>
              
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
              disabled={isSubmitting || !selectedCompany}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>
                  Create {selectedContacts.length > 0 ? `${selectedContacts.length} Prospect${selectedContacts.length > 1 ? 's' : ''}` : 'Prospect'}
                </span>
              )}
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

      {/* Company Creation Modal */}
      {showCreateCompanyModal && (
        <EditCompanyModal
          show={showCreateCompanyModal}
          mode="create"
          companyData={{ organization_name: companySearch }}
          onClose={() => setShowCreateCompanyModal(false)}
          onSave={handleCompanyCreated}
        />
      )}

      {/* Contact Creation Modal */}
      {showCreateContactModal && (
        <ContactModal
          show={showCreateContactModal}
          mode="add"
          organizationId={selectedCompany?.id}
          contactData={{ full_name: contactSearch }}
          onClose={() => setShowCreateContactModal(false)}
          onSave={handleContactCreated}
        />
      )}
    </>
  );
}
