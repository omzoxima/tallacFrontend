'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import ViewToggle from '@/components/ViewToggle';
import { useUser } from '@/contexts/UserContext';
import { canAccess } from '@/utils/permissions';

interface Territory {
  id: string;
  territory_name: string;
  doing_business_as?: string;
  status: string;
  territory_owner?: string;
  mobile?: string;
  address?: string;
  territory_manager_email?: string;
  email?: string;
  map_address?: string;
  owners?: Array<{ id?: string; owner_name: string; owner_email?: string; owner_phone?: string }>;
  zip_codes?: Array<{ id?: string; zip_code: string; city?: string; state?: string }>;
}

export default function LocationPage() {
  const { user } = useUser();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const [formData, setFormData] = useState({
    territory_name: '',
    doing_business_as: '',
    status: 'Active',
    territory_owner: '',
    mobile: '',
    address: '',
    territory_manager_email: '',
    email: '',
    map_address: '',
    owners: [] as Array<{ owner_name: string; owner_email: string; owner_phone: string }>,
    zip_codes: [] as Array<{ zip_code: string; city: string; state: string }>,
  });

  useEffect(() => {
    if (user && canAccess(user.role, 'canViewTerritories')) {
      loadTerritories();
    }
  }, [user, search, filterStatus]);

  const loadTerritories = async () => {
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

      const response = await fetch(`${apiUrl}/api/territories?${params}`, {
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
        throw new Error(errorData.error || `Failed to load territories: ${response.status}`);
      }
      
      const data = await response.json();
      setTerritories(data);
    } catch (error: any) {
      console.error('Error loading territories:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      const url = editingTerritory 
        ? `${apiUrl}/api/territories/${editingTerritory.id}`
        : `${apiUrl}/api/territories`;
      
      const method = editingTerritory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save territory');
      }

      setShowForm(false);
      setEditingTerritory(null);
      resetForm();
      loadTerritories();
    } catch (error: any) {
      alert(error.message || 'Error saving territory');
    }
  };

  const resetForm = () => {
    setFormData({
      territory_name: '',
      doing_business_as: '',
      status: 'Active',
      territory_owner: '',
      mobile: '',
      address: '',
      territory_manager_email: '',
      email: '',
      map_address: '',
      owners: [],
      zip_codes: [],
    });
  };

  const handleEdit = (territory: Territory) => {
    setEditingTerritory(territory);
    setFormData({
      territory_name: territory.territory_name,
      doing_business_as: territory.doing_business_as || '',
      status: territory.status,
      territory_owner: territory.territory_owner || '',
      mobile: territory.mobile || '',
      address: territory.address || '',
      territory_manager_email: territory.territory_manager_email || '',
      email: territory.email || '',
      map_address: territory.map_address || '',
      owners: (territory.owners || []).map(owner => ({
        owner_name: owner.owner_name || '',
        owner_email: owner.owner_email || '',
        owner_phone: owner.owner_phone || '',
      })),
      zip_codes: (territory.zip_codes || []).map(zip => ({
        zip_code: zip.zip_code || '',
        city: zip.city || '',
        state: zip.state || '',
      })),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this territory?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/territories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete territory');
      loadTerritories();
    } catch (error: any) {
      alert(error.message || 'Error deleting territory');
    }
  };

  const addOwner = () => {
    setFormData({
      ...formData,
      owners: [...formData.owners, { owner_name: '', owner_email: '', owner_phone: '' }],
    });
  };

  const removeOwner = (index: number) => {
    setFormData({
      ...formData,
      owners: formData.owners.filter((_, i) => i !== index),
    });
  };

  const updateOwner = (index: number, field: string, value: string) => {
    const newOwners = [...formData.owners];
    newOwners[index] = { ...newOwners[index], [field]: value };
    setFormData({ ...formData, owners: newOwners });
  };

  const addZipCode = () => {
    setFormData({
      ...formData,
      zip_codes: [...formData.zip_codes, { zip_code: '', city: '', state: '' }],
    });
  };

  const removeZipCode = (index: number) => {
    setFormData({
      ...formData,
      zip_codes: formData.zip_codes.filter((_, i) => i !== index),
    });
  };

  const updateZipCode = (index: number, field: string, value: string) => {
    const newZipCodes = [...formData.zip_codes];
    newZipCodes[index] = { ...newZipCodes[index], [field]: value };
    setFormData({ ...formData, zip_codes: newZipCodes });
  };

  if (!user || !canAccess(user.role, 'canViewTerritories')) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  const canManage = canAccess(user.role, 'canManageTerritories');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            {canManage && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingTerritory(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
              >
                Add Location
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search territories..."
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
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingTerritory ? 'Edit Location' : 'Add Location'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Territory Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.territory_name}
                      onChange={(e) => setFormData({ ...formData, territory_name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Doing Business As</label>
                    <input
                      type="text"
                      value={formData.doing_business_as}
                      onChange={(e) => setFormData({ ...formData, doing_business_as: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Territory Owner</label>
                    <input
                      type="text"
                      value={formData.territory_owner}
                      onChange={(e) => setFormData({ ...formData, territory_owner: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mobile</label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Territory Manager Email</label>
                    <input
                      type="email"
                      value={formData.territory_manager_email}
                      onChange={(e) => setFormData({ ...formData, territory_manager_email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Map Address</label>
                    <input
                      type="text"
                      value={formData.map_address}
                      onChange={(e) => setFormData({ ...formData, map_address: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Owners</label>
                    <button type="button" onClick={addOwner} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                      Add Owner
                    </button>
                  </div>
                  {formData.owners.map((owner, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Owner Name"
                        value={owner.owner_name}
                        onChange={(e) => updateOwner(index, 'owner_name', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={owner.owner_email}
                        onChange={(e) => updateOwner(index, 'owner_email', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={owner.owner_phone}
                        onChange={(e) => updateOwner(index, 'owner_phone', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                      <button type="button" onClick={() => removeOwner(index)} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Zip Codes</label>
                    <button type="button" onClick={addZipCode} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                      Add Zip Code
                    </button>
                  </div>
                  {formData.zip_codes.map((zipCode, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Zip Code *"
                        required
                        value={zipCode.zip_code}
                        onChange={(e) => updateZipCode(index, 'zip_code', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={zipCode.city}
                        onChange={(e) => updateZipCode(index, 'city', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={zipCode.state}
                        onChange={(e) => updateZipCode(index, 'state', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                      <button type="button" onClick={() => removeZipCode(index)} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setEditingTerritory(null); resetForm(); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
                    {editingTerritory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-400">Loading locations...</p>
          </div>
        ) : territories.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400">No locations found</p>
          </div>
        ) : view === 'list' ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Territory Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">DBA</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Owner</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Owners</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Zip Codes</th>
                    {canManage && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {territories.map((territory) => (
                    <tr key={territory.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{territory.territory_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{territory.doing_business_as || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${territory.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {territory.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{territory.territory_owner || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{territory.owners?.length || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{territory.zip_codes?.length || 0}</td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(territory)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(territory.id)}
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
            {territories.map((territory) => (
              <div key={territory.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{territory.territory_name}</h3>
                    {territory.doing_business_as && (
                      <p className="text-sm text-gray-400">{territory.doing_business_as}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${territory.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {territory.status}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {territory.territory_owner && (
                    <div>
                      <span className="text-xs text-gray-500">Owner</span>
                      <p className="text-sm text-gray-300">{territory.territory_owner}</p>
                    </div>
                  )}
                  {territory.mobile && (
                    <div>
                      <span className="text-xs text-gray-500">Mobile</span>
                      <p className="text-sm text-gray-300">{territory.mobile}</p>
                    </div>
                  )}
                  {territory.email && (
                    <div>
                      <span className="text-xs text-gray-500">Email</span>
                      <p className="text-sm text-gray-300">{territory.email}</p>
                    </div>
                  )}
                  <div className="flex gap-4 pt-2">
                    <div>
                      <span className="text-xs text-gray-500">Owners</span>
                      <p className="text-sm text-white font-medium">{territory.owners?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Zip Codes</span>
                      <p className="text-sm text-white font-medium">{territory.zip_codes?.length || 0}</p>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleEdit(territory)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(territory.id)}
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
      </main>
      <MobileBottomNav />
    </div>
  );
}

