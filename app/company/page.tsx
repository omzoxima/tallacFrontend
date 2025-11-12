'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import ViewToggle from '@/components/ViewToggle';
import { useUser } from '@/contexts/UserContext';
import { canAccess } from '@/utils/permissions';

interface Company {
  id: string;
  name?: string; // API field
  company_name?: string; // Database field
  doing_business_as?: string;
  industries?: string; // API field (plural)
  industry?: string; // Database field
  status: string;
  territory_owner?: string;
  mobile?: string;
  address?: string;
  territory_manager_email?: string;
  email?: string;
  map_address?: string;
  full_address?: string;
  location_summary?: string;
  zip_code?: string;
  zipcode?: string; // API field
  city?: string;
  state?: string;
  territory_id?: string;
  territory_name?: string;
  truck_count?: number;
  driver_count?: number;
  employee_count?: number;
  employees?: string; // API field
  annual_revenue?: number;
  revenue?: string; // API field
  years_in_business?: number;
  foundation?: string; // API field
  business_type?: string;
  organization_id?: string;
  organization_name?: string;
}

export default function CompanyPage() {
  const { user } = useUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [bulkTerritoryId, setBulkTerritoryId] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTerritory, setFilterTerritory] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  
  // Helper function to get company name (handles both name and company_name)
  const getCompanyName = (company: Company): string => {
    return company.company_name || company.name || 'Unknown Company';
  };
  
  // Helper function to get industry (handles both industry and industries)
  const getIndustry = (company: Company): string => {
    return company.industry || company.industries || '';
  };

  const [formData, setFormData] = useState({
    company_name: '',
    doing_business_as: '',
    industry: '',
    status: 'Active',
    territory_owner: '',
    mobile: '',
    address: '',
    territory_manager_email: '',
    email: '',
    map_address: '',
    full_address: '',
    location_summary: '',
    zip_code: '',
    city: '',
    state: '',
    territory_id: '',
    truck_count: '',
    driver_count: '',
    employee_count: '',
    annual_revenue: '',
    years_in_business: '',
    business_type: '',
    organization_id: '',
  });

  useEffect(() => {
    if (user && canAccess(user.role, 'canViewProspects')) {
      loadCompanies();
      loadTerritories();
    }
  }, [user]);

  // Separate effect for filters to trigger reload
  useEffect(() => {
    if (user && canAccess(user.role, 'canViewProspects')) {
      loadCompanies();
    }
  }, [search, filterStatus, filterTerritory]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterTerritory !== 'all') params.append('territory_id', filterTerritory);

      const response = await fetch(`${apiUrl}/api/companies?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token might be invalid, clear it and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to load companies: ${response.status}`);
      }
      
      const data = await response.json();
      setCompanies(data);
    } catch (error: any) {
      console.error('Error loading companies:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTerritories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/territories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTerritories(data);
      }
    } catch (error) {
      console.error('Error loading territories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        truck_count: formData.truck_count ? parseInt(formData.truck_count) : null,
        driver_count: formData.driver_count ? parseInt(formData.driver_count) : null,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        territory_id: formData.territory_id || null,
        organization_id: formData.organization_id || null,
      };

      const url = editingCompany 
        ? `${apiUrl}/api/companies/${editingCompany.id}`
        : `${apiUrl}/api/companies`;
      
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save company');
      }

      setShowForm(false);
      setEditingCompany(null);
      resetForm();
      loadCompanies();
    } catch (error: any) {
      alert(error.message || 'Error saving company');
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      doing_business_as: '',
      industry: '',
      status: 'Active',
      territory_owner: '',
      mobile: '',
      address: '',
      territory_manager_email: '',
      email: '',
      map_address: '',
      full_address: '',
      location_summary: '',
      zip_code: '',
      city: '',
      state: '',
      territory_id: '',
      truck_count: '',
      driver_count: '',
      employee_count: '',
      annual_revenue: '',
      years_in_business: '',
      business_type: '',
      organization_id: '',
    });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name || company.name || '',
      doing_business_as: company.doing_business_as || '',
      industry: company.industry || company.industries || '',
      status: company.status || 'Active',
      territory_owner: company.territory_owner || '',
      mobile: company.mobile || '',
      address: company.address || '',
      territory_manager_email: company.territory_manager_email || '',
      email: company.email || '',
      map_address: company.map_address || '',
      full_address: company.full_address || '',
      location_summary: company.location_summary || '',
      zip_code: company.zip_code || company.zipcode || '',
      city: company.city || '',
      state: company.state || '',
      territory_id: company.territory_id || '',
      truck_count: company.truck_count?.toString() || '',
      driver_count: company.driver_count?.toString() || '',
      employee_count: company.employee_count?.toString() || '',
      annual_revenue: company.annual_revenue?.toString() || '',
      years_in_business: company.years_in_business?.toString() || company.foundation || '',
      business_type: company.business_type || '',
      organization_id: company.organization_id || '',
    });
    setShowForm(true);
  };

  const handleBulkAssignTerritory = async () => {
    if (!bulkTerritoryId || selectedCompanies.length === 0) {
      alert('Please select companies and a territory');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      // Use bulk update endpoint for better performance
      const response = await fetch(`${apiUrl}/api/companies/bulk/territory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_ids: selectedCompanies,
          territory_id: bulkTerritoryId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign territory');
      }

      const data = await response.json();
      alert(`Successfully assigned territory to ${data.updated_count} companies`);
      setShowBulkAssign(false);
      setSelectedCompanies([]);
      setBulkTerritoryId('');
      loadCompanies();
    } catch (error: any) {
      alert(error.message || 'Error assigning territory');
    }
  };

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/companies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete company');
      loadCompanies();
    } catch (error: any) {
      alert(error.message || 'Error deleting company');
    }
  };

  const canManage = user ? canAccess(user.role, 'canEditAllLeads') : false;
  
  // Debug logging
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('CompanyPage - User:', user);
      console.log('CompanyPage - User Role:', user?.role);
      console.log('CompanyPage - Can Manage:', canManage);
      console.log('CompanyPage - Selected Companies:', selectedCompanies.length);
    }
  }, [user, canManage, selectedCompanies]);

  if (!user || !canAccess(user.role, 'canViewProspects')) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Actions */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-3">
            {canManage && (
              <>
                {selectedCompanies.length > 0 && (
                  <button
                    onClick={() => setShowBulkAssign(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors"
                  >
                    Assign Territory ({selectedCompanies.length})
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingCompany(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
                >
                  Add Company
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search, Filters, and View Toggle in One Row */}
        <div className="mb-6 flex gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={filterTerritory}
            onChange={(e) => setFilterTerritory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Territories</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>{t.territory_name}</option>
            ))}
          </select>
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-white">
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Territory Assignment Section - Prominent at Top */}
                <div className="bg-blue-900/30 border-2 border-blue-600/50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Territory Assignment
                  </h3>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-200">
                      Select Territory <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.territory_id}
                      onChange={(e) => setFormData({ ...formData, territory_id: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border-2 border-blue-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      required
                    >
                      <option value="">Select Territory</option>
                      {territories.map((t) => (
                        <option key={t.id} value={t.id}>{t.territory_name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-2">Assign a territory to this company. You can change this later.</p>
                  </div>
                </div>

                {/* Company Information Section */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-base font-semibold text-gray-300 mb-4">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Doing Business As</label>
                      <input
                        type="text"
                        value={formData.doing_business_as}
                        onChange={(e) => setFormData({ ...formData, doing_business_as: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Industry</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Freight & Logistics Services, Transportation"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Territory Owner</label>
                      <input
                        type="text"
                        value={formData.territory_owner}
                        onChange={(e) => setFormData({ ...formData, territory_owner: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-base font-semibold text-gray-300 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Mobile</label>
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Territory Manager Email</label>
                      <input
                        type="email"
                        value={formData.territory_manager_email}
                        onChange={(e) => setFormData({ ...formData, territory_manager_email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-base font-semibold text-gray-300 mb-4">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Zip Code</label>
                      <input
                        type="text"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Map Address</label>
                      <input
                        type="text"
                        value={formData.map_address}
                        onChange={(e) => setFormData({ ...formData, map_address: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Full Address</label>
                      <textarea
                        value={formData.full_address}
                        onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Location Summary</label>
                      <input
                        type="text"
                        value={formData.location_summary}
                        onChange={(e) => setFormData({ ...formData, location_summary: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Details Section */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-base font-semibold text-gray-300 mb-4">Business Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Truck Count</label>
                      <input
                        type="number"
                        value={formData.truck_count}
                        onChange={(e) => setFormData({ ...formData, truck_count: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Driver Count</label>
                      <input
                        type="number"
                        value={formData.driver_count}
                        onChange={(e) => setFormData({ ...formData, driver_count: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Employee Count</label>
                      <input
                        type="number"
                        value={formData.employee_count}
                        onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Annual Revenue</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.annual_revenue}
                        onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Years in Business</label>
                      <input
                        type="number"
                        value={formData.years_in_business}
                        onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Business Type</label>
                      <select
                        value={formData.business_type}
                        onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="LLC">LLC</option>
                        <option value="Corporation">Corporation</option>
                        <option value="S-Corporation">S-Corporation</option>
                        <option value="Non-Profit">Non-Profit</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-gray-700">
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingCompany(null); resetForm(); }} 
                    className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                  >
                    {editingCompany ? 'Update Company' : 'Create Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-400">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400">No companies found</p>
          </div>
        ) : view === 'list' ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    {canManage && (
                      <th className="px-4 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.length === companies.length && companies.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Company Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Industry</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Territory</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">City</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">State</th>
                    {canManage && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {companies.map((company) => (
                    <tr 
                      key={company.id} 
                      className={`hover:bg-gray-700/50 transition-colors ${selectedCompanies.includes(company.id) ? 'bg-blue-900/20' : ''}`}
                    >
                      {canManage && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCompanies.includes(company.id)}
                            onChange={() => handleSelectCompany(company.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-white font-medium">{getCompanyName(company)}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{getIndustry(company) || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${company.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {company.status || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {company.territory_name || (
                          <span className="text-gray-500 italic">No territory</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{company.city || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{company.state || '-'}</td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(company)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(company.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div 
                key={company.id} 
                className={`bg-gray-800 rounded-lg border p-6 hover:border-blue-500 transition-colors ${
                  selectedCompanies.includes(company.id) 
                    ? 'border-blue-500 bg-blue-900/10' 
                    : 'border-gray-700'
                }`}
              >
                {canManage && (
                  <div className="flex justify-end mb-2">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(company.id)}
                      onChange={() => handleSelectCompany(company.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{getCompanyName(company)}</h3>
                    {company.doing_business_as && (
                      <p className="text-sm text-gray-400">{company.doing_business_as}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${company.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {company.status || 'None'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {getIndustry(company) && (
                    <div>
                      <span className="text-xs text-gray-500">Industry</span>
                      <p className="text-sm text-gray-300">{getIndustry(company)}</p>
                    </div>
                  )}
                  {company.territory_name ? (
                    <div>
                      <span className="text-xs text-gray-500">Territory</span>
                      <p className="text-sm text-gray-300">{company.territory_name}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-gray-500 italic">No territory assigned</span>
                    </div>
                  )}
                  {(company.city || company.state) && (
                    <div>
                      <span className="text-xs text-gray-500">Location</span>
                      <p className="text-sm text-gray-300">
                        {[company.city, company.state].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                  )}
                  {company.territory_owner && (
                    <div>
                      <span className="text-xs text-gray-500">Owner</span>
                      <p className="text-sm text-gray-300">{company.territory_owner}</p>
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleEdit(company)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bulk Territory Assignment Modal */}
        {showBulkAssign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4 text-white">Assign Territory to {selectedCompanies.length} Companies</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Select Territory</label>
                  <select
                    value={bulkTerritoryId}
                    onChange={(e) => setBulkTerritoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Territory</option>
                    {territories.map((t) => (
                      <option key={t.id} value={t.id}>{t.territory_name}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-sm text-gray-300">
                    {selectedCompanies.length} company{selectedCompanies.length !== 1 ? 'ies' : ''} selected
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkAssign(false);
                      setBulkTerritoryId('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAssignTerritory}
                    disabled={!bulkTerritoryId}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors"
                  >
                    Assign Territory
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

