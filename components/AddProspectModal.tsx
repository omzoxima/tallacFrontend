'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Building2, User, Map, Search, Plus, ChevronRight, MapPin, Phone, Mail, X, AlertCircle, CheckCircle } from 'lucide-react';
import BaseModal from './BaseModal';
import CompanyModal from './CompanyModal';
import ContactModal from './ContactModal';
import CustomDropdown from './CustomDropdown';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface AddProspectModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit?: (prospect: any) => void;
}

export default function AddProspectModal({ show, onClose, onSubmit }: AddProspectModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyContacts, setCompanyContacts] = useState<any[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState('');
  const [autoTerritory, setAutoTerritory] = useState('');
  const [globalTerritories, setGlobalTerritories] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [alreadyExistsMessage, setAlreadyExistsMessage] = useState<string | null>(null);
  const companySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = useMemo(() => {
    const role = user?.tallac_role;
    return role === 'Administrator' || role === 'Corporate Admin';
  }, [user]);

  const allowedTerritories = useMemo(() => {
    if (isAdmin) {
      return globalTerritories.map((t: any) => ({
        name: t.territory_name || t.name,
        id: t.id || t.name, // Use territory ID (number) or name as ID
        territory_id: t.id, // Keep original ID for matching
      }));
    } else {
      if (!user?.territories) return [];
      return user.territories.map((t: any) => ({
        name: t.territory_name || t.territory || t.name,
        id: t.territory || t.id || t.name, // Use territory ID or name
        territory_id: t.territory || t.id, // Keep original ID for matching
      }));
    }
  }, [isAdmin, user, globalTerritories]);

  const territoryOptions = useMemo(() => {
    return allowedTerritories.map((t) => ({
      label: t.name,
      value: t.id,
    }));
  }, [allowedTerritories]);

  const exactMatchFound = useMemo(() => {
    return filteredCompanies.some(
      (c) => c.organization_name?.toLowerCase() === companySearchQuery.toLowerCase()
    );
  }, [filteredCompanies, companySearchQuery]);

  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery) return companyContacts;
    return companyContacts.filter((c) =>
      c.full_name?.toLowerCase().includes(contactSearchQuery.toLowerCase())
    );
  }, [companyContacts, contactSearchQuery]);

  const exactContactMatchFound = useMemo(() => {
    return filteredContacts.some(
      (c) => c.full_name?.toLowerCase() === contactSearchQuery.toLowerCase()
    );
  }, [filteredContacts, contactSearchQuery]);

  const isValid = useMemo(() => {
    return !!selectedCompany && !!selectedTerritory;
  }, [selectedCompany, selectedTerritory]);

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    if (longer.includes(shorter)) {
      return 0.9 + (shorter.length / longer.length) * 0.1;
    }

    const editDistance = levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const searchCompanies = async () => {
    // Minimum 15 characters required (including spaces)
    const trimmedQuery = companySearchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < 15) {
      setFilteredCompanies([]);
      return;
    }

    try {
      const result = await api.searchOrganizations(companySearchQuery);
      if (result.success && result.data) {
        const query = trimmedQuery.toLowerCase();
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        
        const matches = result.data
          .map((company: any) => {
            const name = (company.organization_name || company.company_name || '').toLowerCase().trim();
            
            // Priority 1: Exact match (case-insensitive)
            if (name === query) {
              return { ...company, similarity: 1.0, matchType: 'exact' };
            }
            
            // Priority 2: Substring match (query is substring of name or vice versa)
            if (name.includes(query) || query.includes(name)) {
              return { ...company, similarity: 0.95, matchType: 'substring' };
            }
            
            // Priority 3: All query words are present in company name
            const nameWords = name.split(/\s+/).filter(w => w.length > 0);
            const allWordsMatch = queryWords.every(qWord => 
              nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))
            );
            
            if (allWordsMatch) {
              // Calculate similarity for ranking
            const similarity = calculateSimilarity(query, name);
              return { ...company, similarity: Math.max(similarity, 0.75), matchType: 'all-words' };
            }
            
            // Priority 4: Some query words match
            const matchingWords = queryWords.filter(qWord => 
              nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))
            ).length;
            if (matchingWords > 0) {
              const similarity = calculateSimilarity(query, name);
              const wordMatchBonus = (matchingWords / queryWords.length) * 0.2;
              return { ...company, similarity: Math.max(similarity, 0.6) + wordMatchBonus, matchType: 'partial-words' };
            }
            
            // Priority 5: Fallback to similarity calculation
            const similarity = calculateSimilarity(query, name);
            return { ...company, similarity, matchType: 'similarity' };
          })
          .filter((company: any) => {
            // Show if similarity >= 0.5 OR if at least one query word matches
            if (company.similarity >= 0.5) return true;
            
            const name = (company.organization_name || company.company_name || '').toLowerCase();
            return queryWords.some(qWord => name.includes(qWord));
          })
          .sort((a: any, b: any) => {
            // Sort by similarity first, then by match type priority
            if (Math.abs(a.similarity - b.similarity) > 0.01) {
              return b.similarity - a.similarity;
            }
            const typePriority = { exact: 1, substring: 2, 'all-words': 3, 'partial-words': 4, similarity: 5 };
            return (typePriority[a.matchType] || 5) - (typePriority[b.matchType] || 5);
          })
          .slice(0, 10); // Increased limit to show more results

        setFilteredCompanies(matches);
      } else {
        setFilteredCompanies([]);
      }
    } catch (e) {
      console.error('Failed to search companies', e);
      setFilteredCompanies([]);
    }
  };

  useEffect(() => {
    if (companySearchTimeoutRef.current) {
      clearTimeout(companySearchTimeoutRef.current);
    }

    // Minimum 15 characters required (including spaces)
    const trimmedQuery = companySearchQuery.trim();
    companySearchTimeoutRef.current = setTimeout(() => {
      if (trimmedQuery.length >= 15) {
        searchCompanies();
      } else {
        setFilteredCompanies([]);
      }
    }, 300);

    return () => {
      if (companySearchTimeoutRef.current) {
        clearTimeout(companySearchTimeoutRef.current);
      }
    };
  }, [companySearchQuery]);

  useEffect(() => {
    if (show && isAdmin) {
      loadTerritories();
    }
  }, [show, isAdmin]);

  const loadTerritories = async () => {
    try {
      const result = await api.getTerritories();
      if (result.success && result.data) {
        setGlobalTerritories(
          result.data.map((t: any) => ({
            name: t.territory_name || t.name,
            id: t.id || t.name, // Use territory ID (number) as primary ID
            territory_id: t.id, // Keep for reference
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load global territories', e);
    }
  };

  const selectCompany = async (company: any) => {
    setSelectedCompany(company);
    setCompanySearchQuery('');
    setShowCompanyDropdown(false);
    
    // Use contacts from search result if available, otherwise load from API
    if (company.contacts && Array.isArray(company.contacts) && company.contacts.length > 0) {
      setCompanyContacts(company.contacts);
    } else {
    // Load contacts for this company automatically (like Vue3 does)
    // Use organization_id from prospect or company id/name
    const companyId = company.organization_id || company.id || company.name;
    if (companyId) {
      await loadCompanyContacts(companyId);
    }
    }
    
    // Use territory from search result if available
    if (company.territory_data) {
      const territoryId = company.territory_data.territory_id || company.territory_data.id;
      const match = allowedTerritories.find((t) => {
        const tId = t.territory_id || t.id;
        return tId === territoryId || Number(tId) === territoryId || String(tId) === String(territoryId);
      });
      if (match) {
        setSelectedTerritory(match.id);
        setAutoTerritory(match.name);
      }
    } else {
    // Determine Territory automatically - use organization's territory field if available
    // Priority: territory_id (number) > territory (string/name) > territory_name
    // Backend returns territory_id (number) and territory_name (string) in search results
    const orgTerritory = company.territory_id || company.territory || company.territory_name;
    await determineAutoTerritory(company.zip_code, orgTerritory);
    }
  };

  const clearCompany = () => {
    setSelectedCompany(null);
    setSelectedContact(null);
    setCompanyContacts([]);
    setContactSearchQuery('');
    setAutoTerritory('');
    setSelectedTerritory('');
  };

  const loadCompanyContacts = async (companyId: string) => {
    try {
      const result = await api.getOrganizationContacts(companyId);
      if (result.success && result.data) {
        setCompanyContacts(result.data);
      } else {
        setCompanyContacts([]);
      }
    } catch (e) {
      console.error('Failed to load contacts', e);
      setCompanyContacts([]);
    }
  };

  const determineAutoTerritory = async (zip?: string, orgTerritory?: string | number) => {
    // Priority #1: If Organization has a territory, use it directly (like Vue3)
    if (orgTerritory !== undefined && orgTerritory !== null && orgTerritory !== '') {
      // orgTerritory can be territory_id (number) or territory name (string)
      let match = null;
      
      // Try to match by territory_id first (if it's a number or numeric string)
      const territoryId = typeof orgTerritory === 'number' ? orgTerritory : 
                         (typeof orgTerritory === 'string' && !isNaN(Number(orgTerritory)) ? Number(orgTerritory) : null);
      
      if (territoryId !== null) {
        // Match by territory_id (number)
        match = allowedTerritories.find((t) => {
          const tId = t.territory_id || t.id;
          return tId === territoryId || Number(tId) === territoryId || String(tId) === String(territoryId);
        });
      }
      
      // If not found by ID, try to match by name
      if (!match && typeof orgTerritory === 'string') {
        match = allowedTerritories.find((t) => 
          t.name === orgTerritory || 
          t.name?.toLowerCase() === orgTerritory.toLowerCase() ||
          String(t.id) === String(orgTerritory)
        );
      }
      
      if (match) {
        // Set auto territory name for display
        setAutoTerritory(match.name || String(match.id));
        // Set selected territory ID for form submission
        setSelectedTerritory(String(match.id));
        return;
      }
    }
    
    // Priority #2: If no Org territory, try to match by Zip Code (Legacy/Fallback)
    // Vue3 doesn't do this by default, but we can add it if needed
    // For now, skip zip code matching as per Vue3 behavior
    
    // Priority #3: Default - leave empty
    setAutoTerritory('');
    setSelectedTerritory('');
  };

  const handleCompanyCreated = async (companyData: any) => {
    try {
      // Create organization on server immediately (like Vue3 does)
      // But don't create prospect - that happens only when user clicks "Create Prospect"
      // Backend createProspect endpoint creates prospect only if territories is provided
      // So we send organization_data without territories to create org only
      const orgPayload = {
        company_name: companyData.organization_name,
        industry: companyData.industry,
        address: companyData.address_line_1,
        city: companyData.city,
        state: companyData.state,
        zip_code: companyData.zip_code,
        company_overview: companyData.overview,
        // Don't include territories - this prevents prospect creation
        // Don't include status - this prevents prospect creation
      };

      const result = await api.createProspect(orgPayload);

      if (result.success && result.data) {
        // Backend returns organization_id even if prospect wasn't created
        const orgId = result.data.organization_id;
        if (orgId) {
          // Fetch the created organization
          const orgResult = await api.getProspect(orgId);
          if (orgResult.success && orgResult.data) {
            const org = orgResult.data.organization || {
              id: orgId,
              name: orgId,
              ...companyData,
              organization_name: companyData.organization_name,
            };
            setSelectedCompany(org);
            setShowCreateCompanyModal(false);
            
            // Determine territory automatically
            const orgTerritory = org.territory_id || org.territory || org.territory_name;
            await determineAutoTerritory(org.zip_code, orgTerritory);
            
            // Load contacts for the newly created organization
            await loadCompanyContacts(orgId);
          } else {
            // Fallback: use the ID from response
            const org = {
              id: orgId,
              name: orgId,
              ...companyData,
              organization_name: companyData.organization_name,
            };
        setSelectedCompany(org);
        setShowCreateCompanyModal(false);
            const orgTerritory = companyData.territory_id || companyData.territory || companyData.territory_name;
            await determineAutoTerritory(companyData.zip_code, orgTerritory);
          }
        } else {
          // Fallback: store locally if no org ID returned
          const orgData = {
            ...companyData,
            organization_name: companyData.organization_name,
            id: `TEMP-ORG-${Date.now()}`,
            name: `TEMP-ORG-${Date.now()}`,
          };
          setSelectedCompany(orgData);
          setShowCreateCompanyModal(false);
          determineAutoTerritory(companyData.zip_code, companyData.territory);
        }
      } else {
        // Fallback: store locally if API fails
        const orgData = {
          ...companyData,
          organization_name: companyData.organization_name,
          id: `TEMP-ORG-${Date.now()}`,
          name: `TEMP-ORG-${Date.now()}`,
        };
        setSelectedCompany(orgData);
        setShowCreateCompanyModal(false);
        determineAutoTerritory(companyData.zip_code, companyData.territory);
      }
    } catch (e) {
      console.error('Failed to create company', e);
      // Fallback: store locally on error
      const orgData = {
        ...companyData,
        organization_name: companyData.organization_name,
        id: `TEMP-ORG-${Date.now()}`,
        name: `TEMP-ORG-${Date.now()}`,
      };
      setSelectedCompany(orgData);
      setShowCreateCompanyModal(false);
      determineAutoTerritory(companyData.zip_code, companyData.territory);
    }
  };

  const selectContact = (contact: any) => {
    setSelectedContact(contact);
    setContactSearchQuery('');
    setShowContactDropdown(false);
  };

  const clearContact = () => {
    setSelectedContact(null);
    setContactSearchQuery('');
  };

  const handleContactCreated = async (contactData: any) => {
    try {
      // Create contact on server immediately (like Vue3 does)
      // But don't create prospect - that happens only when user clicks "Create Prospect"
      const nameParts = (contactData.full_name || '').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Backend expects lead_name, title, phones, emails format
      const contactPayload = {
        organization_id: selectedCompany?.id || selectedCompany?.name,
        lead_name: contactData.full_name,
        title: contactData.designation,
        phones: contactData.phones.map((p: any) => ({
          number: p.phone,
          isPrimary: p.is_primary_phone || false,
        })),
        emails: contactData.emails.map((e: any) => ({
          address: e.email_id,
          isPrimary: e.is_primary || false,
        })),
        // Don't include territories - this prevents prospect creation
        // Don't include status - this prevents prospect creation
      };

      const result = await api.createProspect(contactPayload);

      if (result.success && result.data) {
        // Backend returns primary_contact_id even if prospect wasn't created
        const contactId = result.data.primary_contact_id;
        if (contactId) {
          const newContact = {
            id: contactId,
            name: contactId,
            full_name: contactData.full_name,
            first_name: firstName,
            last_name: lastName,
            designation: contactData.designation,
            phone: contactData.phones.find((p: any) => p.is_primary_phone)?.phone || contactData.phones[0]?.phone,
            email_id: contactData.emails.find((e: any) => e.is_primary)?.email_id || contactData.emails[0]?.email_id,
          };
          setCompanyContacts([...companyContacts, newContact]);
          setSelectedContact(newContact);
          setShowCreateContactModal(false);
        } else {
          // Fallback: store locally if no contact ID returned
          const newContact = {
            id: `TEMP-CNT-${Date.now()}`,
            name: `TEMP-CNT-${Date.now()}`,
            full_name: contactData.full_name,
            first_name: firstName,
            last_name: lastName,
            designation: contactData.designation,
            phone: contactData.phones.find((p: any) => p.is_primary_phone)?.phone || contactData.phones[0]?.phone,
            email_id: contactData.emails.find((e: any) => e.is_primary)?.email_id || contactData.emails[0]?.email_id,
          };
          setCompanyContacts([...companyContacts, newContact]);
          setSelectedContact(newContact);
          setShowCreateContactModal(false);
        }
      } else {
        // Fallback: store locally if API fails
        const newContact = {
          id: `TEMP-CNT-${Date.now()}`,
          name: `TEMP-CNT-${Date.now()}`,
          full_name: contactData.full_name,
          first_name: firstName,
          last_name: lastName,
          designation: contactData.designation,
          phone: contactData.phones.find((p: any) => p.is_primary_phone)?.phone || contactData.phones[0]?.phone,
          email_id: contactData.emails.find((e: any) => e.is_primary)?.email_id || contactData.emails[0]?.email_id,
        };
        setCompanyContacts([...companyContacts, newContact]);
        setSelectedContact(newContact);
        setShowCreateContactModal(false);
      }
    } catch (e) {
      console.error('Failed to create contact', e);
      // Fallback: store locally on error
      const nameParts = (contactData.full_name || '').split(' ');
      const newContact = {
        id: `TEMP-CNT-${Date.now()}`,
        name: `TEMP-CNT-${Date.now()}`,
        full_name: contactData.full_name,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' '),
        designation: contactData.designation,
        phone: contactData.phones.find((p: any) => p.is_primary_phone)?.phone || contactData.phones[0]?.phone,
        email_id: contactData.emails.find((e: any) => e.is_primary)?.email_id || contactData.emails[0]?.email_id,
      };
      setCompanyContacts([...companyContacts, newContact]);
      setSelectedContact(newContact);
      setShowCreateContactModal(false);
    }
  };

  const getPrimaryPhone = (contact: any) => {
    if (contact.phone) return contact.phone;
    if (contact.mobile_no) return contact.mobile_no;
    if (contact.phone_nos && contact.phone_nos.length) {
      const primary = contact.phone_nos.find((p: any) => p.is_primary_phone);
      return primary ? primary.phone : contact.phone_nos[0].phone;
    }
    return '';
  };

  const getPrimaryEmail = (contact: any) => {
    if (contact.email_id) return contact.email_id;
    if (contact.email_ids && contact.email_ids.length) {
      const primary = contact.email_ids.find((e: any) => e.is_primary);
      return primary ? primary.email_id : contact.email_ids[0].email_id;
    }
    return '';
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate click');
      return;
    }
    
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Check if company was just created (has TEMP- prefix) or is existing
      const isNewCompany = selectedCompany.id?.startsWith('TEMP-') || selectedCompany.name?.startsWith('TEMP-');
      const isNewContact = selectedContact && (selectedContact.id?.startsWith('TEMP-') || selectedContact.name?.startsWith('TEMP-'));

      let finalOrganizationId = selectedCompany.id || selectedCompany.name;
      let finalContactId = selectedContact?.id || selectedContact?.name;

      // If company is new (TEMP), create it first (like Vue3 does)
      if (isNewCompany) {
        const orgPayload = {
          company_name: selectedCompany.organization_name,
          industry: selectedCompany.industry,
          address: selectedCompany.address_line_1,
          city: selectedCompany.city,
          state: selectedCompany.state,
          zip_code: selectedCompany.zip_code || null, // Optional - can be null if not in zipcodes table
          company_overview: selectedCompany.overview,
          // Don't include territories - this prevents prospect creation
        };

        const orgResult = await api.createProspect(orgPayload);
        if (orgResult.success && orgResult.data?.organization_id) {
          finalOrganizationId = orgResult.data.organization_id;
        } else {
          throw new Error('Failed to create organization: ' + (orgResult.message || 'Unknown error'));
        }
      }

      // If contact is new (TEMP), create it first (like Vue3 does)
      if (isNewContact && finalOrganizationId) {
        const contactPayload = {
          organization_id: finalOrganizationId,
          lead_name: selectedContact.full_name,
          title: selectedContact.designation,
          phones: (selectedContact.phone_nos || []).map((p: any) => ({
            number: p.phone,
            isPrimary: p.is_primary_phone || false,
          })),
          emails: (selectedContact.email_ids || []).map((e: any) => ({
            address: e.email_id || e.email,
            isPrimary: e.is_primary || false,
          })),
          // Don't include territories - this prevents prospect creation
        };

        const contactResult = await api.createProspect(contactPayload);
        if (contactResult.success && contactResult.data?.primary_contact_id) {
          finalContactId = contactResult.data.primary_contact_id;
        } else {
          // Contact creation failed, but continue with prospect creation
          console.warn('Failed to create contact, continuing without contact:', contactResult.message);
        }
      }

      // Now create prospect with existing organization and contact IDs (like Vue3)
      const prospectData: any = {
        organization_id: finalOrganizationId,
        contact_id: finalContactId || null,
        territories: [selectedTerritory],
        status: 'New',
      };

      const result = await api.createProspect(prospectData);
      console.log('Prospect creation result:', result);

      if (result.success) {
        // Check if prospect already exists - check both result.message and result.data.message
        const message = result.message || result.data?.message || '';
        const isAlreadyExists = message.toLowerCase().includes('already exists') || 
                                message.toLowerCase().includes('prospect already exists');
        
        console.log('Message:', message, 'Is Already Exists:', isAlreadyExists);
        
        if (isAlreadyExists) {
          // Show duplicate message and keep modal open
          setAlreadyExistsMessage('This prospect already exists in the system for this organization. The existing prospect will be used.');
          // Don't auto-close - let user manually close
          // Keep button disabled until user closes message
        } else {
          // New prospect created successfully
        if (onSubmit) {
          onSubmit(result.data);
        }
        onClose();
          // Refresh page to show new prospect (like Vue3 does)
          window.location.reload();
        }
      } else {
        console.error('Failed to create prospect', result.message);
        alert('Failed to create prospect: ' + (result.message || 'Unknown error'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Error creating prospect: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <BaseModal
        title="Add New Prospect"
        subtitle="Create a new prospect in the system"
        maxWidth="2xl"
        onClose={onClose}
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-6">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>Create Prospect</span>
            </button>
          </div>
        }
      >
        <div className="p-3 sm:p-6">
          {/* Already Exists Message */}
          {alreadyExistsMessage && (
            <div className="mb-4 bg-yellow-900/30 border border-yellow-600 text-yellow-400 px-4 py-3 rounded-lg flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Prospect Already Exists</p>
                <p className="text-sm mt-1">{alreadyExistsMessage}</p>
                <p className="text-xs mt-2 text-yellow-300">Click the X button to close this message.</p>
              </div>
              <button
                onClick={() => {
                  setAlreadyExistsMessage(null);
                  if (onSubmit && result.data) {
                    onSubmit(result.data);
                  }
                  onClose();
                }}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Company
              </h3>

              {!selectedCompany ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={companySearchQuery}
                    onChange={(e) => {
                      setCompanySearchQuery(e.target.value);
                      // Only show dropdown if 15+ characters (including spaces)
                      if (e.target.value.trim().length >= 15) {
                      setShowCompanyDropdown(true);
                      } else {
                        setShowCompanyDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      // Only show dropdown if 15+ characters (including spaces)
                      if (companySearchQuery.trim().length >= 15) {
                        setShowCompanyDropdown(true);
                      }
                    }}
                    type="text"
                    placeholder="Search or create company (min 15 characters)..."
                    className="w-full pl-12 pr-4 py-2 sm:py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    Type at least 15 characters (including spaces) to search or create
                    {companySearchQuery.trim().length > 0 && companySearchQuery.trim().length < 15 && (
                      <span className="text-yellow-400 ml-1">
                        ({15 - companySearchQuery.trim().length} more required)
                      </span>
                    )}
                  </p>

                  {showCompanyDropdown && companySearchQuery.trim().length >= 15 && (companySearchQuery || filteredCompanies.length > 0) && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-h-48 sm:max-h-60 overflow-y-auto">
                      {companySearchQuery && companySearchQuery.trim().length >= 15 && !exactMatchFound && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateCompanyModal(true);
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 text-green-400 font-medium flex items-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Create: "{companySearchQuery}"
                        </button>
                      )}

                      {filteredCompanies.map((company) => (
                        <button
                          key={company.id || company.name}
                          type="button"
                          onClick={() => selectCompany(company)}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium group-hover:text-blue-400 transition-colors text-sm truncate">
                                {company.organization_name || company.company_name}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 flex-wrap">
                                {company.zip_code && (
                                  <span className="px-1.5 py-0.5 bg-gray-700 rounded">{company.zip_code}</span>
                                )}
                                {company.territory_name && (
                                  <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                                    {company.territory_name}
                                  </span>
                                )}
                                {(company.city || company.state) && (
                                  <span className="truncate">
                                    {company.city}
                                    {company.state ? `, ${company.state}` : ''}
                                  </span>
                                )}
                                {company.has_contacts && (
                                  <span className="px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">
                                    {company.contacts?.length || 0} contact{company.contacts?.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {company.has_territory && (
                                  <span className="px-1.5 py-0.5 bg-purple-900/30 text-purple-400 rounded">
                                    Territory
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white flex-shrink-0 ml-2" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-3 sm:p-4 flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 bg-blue-900/30 rounded-lg text-blue-400 flex-shrink-0">
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-white truncate">
                        {selectedCompany.company_name || selectedCompany.organization_name}
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 mt-1 flex-wrap">
                        {selectedCompany.industry && (
                          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-700 rounded text-xs">
                            {selectedCompany.industry}
                          </span>
                        )}
                        {(selectedCompany.city || selectedCompany.state) && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {selectedCompany.city}
                              {selectedCompany.state ? `, ${selectedCompany.state}` : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearCompany}
                    className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    title="Change Company"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>

            <div
              className={`bg-gray-700/30 rounded-lg p-3 sm:p-4 ${
                !selectedCompany ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <span>Contact</span>
                <span className="text-xs sm:text-sm font-normal text-gray-500">(Optional)</span>
              </h3>

              {!selectedContact ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={contactSearchQuery}
                    onChange={(e) => {
                      setContactSearchQuery(e.target.value);
                      setShowContactDropdown(true);
                    }}
                    onFocus={() => setShowContactDropdown(true)}
                    type="text"
                    placeholder="Search or create contact..."
                    className="w-full pl-12 pr-4 py-2 sm:py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedCompany}
                  />

                  {showContactDropdown && (contactSearchQuery || filteredContacts.length > 0) && (
                    <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-h-48 sm:max-h-60 overflow-y-auto">
                      {contactSearchQuery && !exactContactMatchFound && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateContactModal(true);
                            setShowContactDropdown(false);
                          }}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 text-green-400 font-medium flex items-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Create: "{contactSearchQuery}"
                        </button>
                      )}

                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id || contact.name}
                          type="button"
                          onClick={() => selectContact(contact)}
                          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium group-hover:text-blue-400 transition-colors text-sm truncate">
                                {contact.full_name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {contact.designation || 'No Title'}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white flex-shrink-0 ml-2" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-3 sm:p-4 flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 bg-purple-900/30 rounded-lg text-purple-400 flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-white truncate">
                        {selectedContact.full_name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        {selectedContact.designation || 'No Title'}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs text-gray-400 flex-wrap">
                        {getPrimaryPhone(selectedContact) && (
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{getPrimaryPhone(selectedContact)}</span>
                          </span>
                        )}
                        {getPrimaryEmail(selectedContact) && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{getPrimaryEmail(selectedContact)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={clearContact}
                    className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    title="Change Contact"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>

            <div
              className={`bg-gray-700/30 rounded-lg p-3 sm:p-4 ${
                !selectedCompany ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Map className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                Territory
              </h3>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Assigned Territory <span className="text-red-400">*</span>
                </label>
                <CustomDropdown
                  value={selectedTerritory}
                  options={territoryOptions}
                  onChange={setSelectedTerritory}
                  buttonClass="bg-gray-700 border-gray-600 text-white"
                  showColorDot={false}
                  showCheckmark={true}
                  searchable={true}
                  disabled={!selectedCompany}
                />
                <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                  {autoTerritory ? (
                    <>
                      Auto: <span className="text-blue-400">{autoTerritory}</span>
                    </>
                  ) : (
                    'Prospect visible in this territory'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>

      {showCreateCompanyModal && (
        <CompanyModal
          mode="create"
          initialData={{ organization_name: companySearchQuery }}
          onClose={() => setShowCreateCompanyModal(false)}
          onSave={handleCompanyCreated}
        />
      )}

      {showCreateContactModal && (
        <ContactModal
          show={showCreateContactModal}
          mode="add"
          organizationId={selectedCompany?.id || selectedCompany?.name}
          initialData={{ full_name: contactSearchQuery }}
          onClose={() => setShowCreateContactModal(false)}
          onSave={handleContactCreated}
        />
      )}
    </>
  );
}

