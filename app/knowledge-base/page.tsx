'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import ViewToggle from '@/components/ViewToggle';
import { useUser } from '@/contexts/UserContext';
import { canAccess } from '@/utils/permissions';
import { Download, Trash2, Edit, FileText, Image, FileIcon } from 'lucide-react';

interface KnowledgeBaseFile {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  description?: string;
  uploaded_by_id: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
  is_owner?: boolean; // Whether the current user is the file owner
  assigned_roles?: Array<{ role: string }>;
}

const ROLE_OPTIONS = [
  'Corporate Admin',
  'Business Coach',
  'Territory Admin',
  'Territory Manager',
  'Sales User',
];

export default function KnowledgeBasePage() {
  const { user } = useUser();
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState<KnowledgeBaseFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [uploading, setUploading] = useState(false);

  // Knowledge base: All users can upload
  // File owners and admins can edit/delete their files
  const isAdmin = user ? canAccess(user.role, 'canEditAllLeads') : false;
  const canUpload = true; // All authenticated users can upload
  
  // Helper function to check if user can manage a specific file
  const canManageFile = (file: KnowledgeBaseFile): boolean => {
    if (isAdmin) return true; // Admins can manage all files
    if (file.is_owner) return true; // File owners can manage their files
    return false;
  };

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        return;
      }

      // Always use regular endpoint - it now includes is_owner flag
      const response = await fetch(`${apiUrl}/api/knowledge-base`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load files');
      }
      
      const data = await response.json();
      setFiles(data);
    } catch (error: any) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', description);
      formData.append('roles', JSON.stringify(selectedRoles));

      const response = await fetch(`${apiUrl}/api/knowledge-base/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setDescription('');
      setSelectedRoles([]);
      loadFiles();
    } catch (error: any) {
      alert(error.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleEditRoles = (file: KnowledgeBaseFile) => {
    setEditingFile(file);
    setSelectedRoles(file.assigned_roles?.map(r => r.role) || []);
    setShowEditModal(true);
  };

  const handleUpdateRoles = async () => {
    if (!editingFile) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/knowledge-base/${editingFile.id}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: selectedRoles }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update roles');
      }

      setShowEditModal(false);
      setEditingFile(null);
      setSelectedRoles([]);
      loadFiles();
    } catch (error: any) {
      alert(error.message || 'Error updating roles');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      loadFiles();
    } catch (error: any) {
      alert(error.message || 'Error deleting file');
    }
  };

  const handleDownload = async (file: KnowledgeBaseFile) => {
    try {
      // If file_path is an S3 URL, open it directly
      if (file.file_path && file.file_path.startsWith('https://')) {
        // Create a temporary link to trigger download with original filename
        const a = document.createElement('a');
        a.href = file.file_path;
        a.download = file.original_name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Fallback: use API endpoint (which will redirect to S3)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/knowledge-base/${file.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.redirected) {
        // If redirected to S3, open the redirect URL
        window.open(response.url, '_blank');
      } else if (!response.ok) {
        throw new Error('Failed to download file');
      } else {
        // Fallback: download as blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error: any) {
      alert(error.message || 'Error downloading file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.includes('pdf')) return FileText;
    if (mimeType?.includes('text')) return FileText;
    return FileIcon;
  };

  const filteredFiles = files.filter(file =>
    file.original_name.toLowerCase().includes(search.toLowerCase()) ||
    file.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-900 bg-gray-50 text-white dark:text-white text-gray-900 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 bg-gray-50 text-white dark:text-white text-gray-900">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-3">
            {canUpload && (
              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setSelectedFile(null);
                  setDescription('');
                  setSelectedRoles([]);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
              >
                Upload File
              </button>
            )}
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 dark:bg-gray-800 bg-white border border-gray-700 dark:border-gray-700 border-gray-300 text-white dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 max-w-2xl w-full border border-gray-700 dark:border-gray-700 border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-white dark:text-white text-gray-900">Upload File</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 dark:text-gray-300 text-gray-700">Select File</label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-white dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 dark:text-gray-300 text-gray-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-white border border-gray-600 dark:border-gray-600 border-gray-300 text-white dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="File description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Assign to Roles (leave empty for all roles)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700 p-3 rounded-md">
                    {ROLE_OPTIONS.map(role => (
                      <label key={role} className="flex items-center gap-2 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role]);
                            } else {
                              setSelectedRoles(selectedRoles.filter(r => r !== role));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    If no roles are selected, the file will be visible to all users.
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setDescription('');
                      setSelectedRoles([]);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-white font-medium"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Roles Modal */}
        {showEditModal && editingFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 max-w-2xl w-full border border-gray-700 dark:border-gray-700 border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-white dark:text-white text-gray-900">Edit File Roles</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-300 dark:text-gray-300 text-gray-700 mb-2">File: {editingFile.original_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Assign to Roles (leave empty for all roles)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700 p-3 rounded-md">
                    {ROLE_OPTIONS.map(role => (
                      <label key={role} className="flex items-center gap-2 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles([...selectedRoles, role]);
                            } else {
                              setSelectedRoles(selectedRoles.filter(r => r !== role));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    If no roles are selected, the file will be visible to all users.
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingFile(null);
                      setSelectedRoles([]);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRoles}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
                  >
                    Update Roles
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-400">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 dark:bg-gray-800 bg-white rounded-lg border border-gray-700 dark:border-gray-700 border-gray-200">
            <p className="text-gray-400 dark:text-gray-400 text-gray-600">No files found</p>
          </div>
        ) : view === 'list' ? (
          <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg overflow-hidden border border-gray-700 dark:border-gray-700 border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white dark:text-white text-gray-900">File Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Size</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Uploaded By</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Roles</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Uploaded</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredFiles.map((file) => {
                    const FileIconComponent = getFileIcon(file.mime_type);
                    const canManage = canManageFile(file);
                    return (
                      <tr key={file.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIconComponent className="w-5 h-5 text-blue-400" />
                            <span className="text-sm text-white dark:text-white text-gray-900 font-medium">{file.original_name}</span>
                            {file.is_owner && (
                              <span className="px-2 py-0.5 bg-green-600/20 text-green-300 rounded text-xs">
                                Your file
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                          {file.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                          {formatFileSize(file.file_size)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                          {file.uploaded_by_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                          {file.assigned_roles && file.assigned_roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {file.assigned_roles.map((r, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                                  {r.role}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">All roles</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 dark:text-gray-300 text-gray-700">
                          {new Date(file.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(file)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleEditRoles(file)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                                  title="Edit Roles"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(file.id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const FileIconComponent = getFileIcon(file.mime_type);
              const canManage = canManageFile(file);
              return (
                <div key={file.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <FileIconComponent className="w-8 h-8 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate" title={file.original_name}>
                            {file.original_name}
                          </h3>
                          {file.is_owner && (
                            <span className="px-2 py-0.5 bg-green-600/20 text-green-300 rounded text-xs whitespace-nowrap">
                              Your file
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>
                  </div>
                  {file.description && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{file.description}</p>
                  )}
                  <div className="mb-3">
                    {file.assigned_roles && file.assigned_roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {file.assigned_roles.map((r, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                            {r.role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Visible to all roles</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleEditRoles(file)}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
                          title="Edit Roles"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

