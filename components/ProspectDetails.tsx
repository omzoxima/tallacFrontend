'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Clock,
  User,
  Users,
  Phone,
  Mail,
  Plus,
  FileText,
  UserCog,
  Settings,
  Building2,
  Info,
  Network,
  Share2,
  Globe,
  Linkedin,
  Activity,
} from 'lucide-react';
import TallacActivityModal from './TallacActivityModal';
import ContactModal from './ContactModal';
import EditCompanyModal from './EditCompanyModal';
import { useCall } from '@/contexts/CallContext';
import { showToast } from './Toast';

interface ProspectDetailsProps {
  prospect: any;
  mode?: 'popup' | 'split';
  showCloseButton?: boolean;
  showActivityHistory?: boolean;
  onClose?: () => void;
  onCall?: (prospect: any) => void;
  onEmail?: (prospect: any) => void;
  onAssign?: (prospect: any) => void;
}

export default function ProspectDetails({
  prospect,
  mode = 'popup',
  showCloseButton = true,
  showActivityHistory = true,
  onClose,
  onCall,
  onEmail,
  onAssign,
}: ProspectDetailsProps) {
  const router = useRouter();
  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState('activity');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [expandedContacts, setExpandedContacts] = useState<Record<string, boolean>>({});
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<'add' | 'edit'>('add');
  const [editingContact, setEditingContact] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No token found');
          setUsers([]);
          setLoadingUsers(false);
          return;
        }
        
        const response = await fetch(`${apiUrl}/api/users?status=active&limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Users API error:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error details:', errorData);
          setUsers([]);
          return;
        }
        
        const data = await response.json();
        console.log('Users API response:', data);
        
        // Handle different response formats
        let usersList = [];
        if (Array.isArray(data)) {
          usersList = data;
        } else if (data.users && Array.isArray(data.users)) {
          usersList = data.users;
        } else if (data.data && Array.isArray(data.data)) {
          usersList = data.data;
        }
        
        setUsers(usersList);
        console.log('Loaded users:', usersList.length);
      } catch (error) {
        console.error('Failed to load users:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    if (showAssignModal) {
      loadUsers();
    }
  }, [showAssignModal]);

  const filteredUsers = repSearchQuery
    ? users.filter(
        (user) =>
          (user.full_name || '').toLowerCase().includes(repSearchQuery.toLowerCase()) ||
          (user.email || '').toLowerCase().includes(repSearchQuery.toLowerCase()) ||
          (user.first_name || '').toLowerCase().includes(repSearchQuery.toLowerCase()) ||
          (user.last_name || '').toLowerCase().includes(repSearchQuery.toLowerCase())
      )
    : users;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLocation = (city?: string, state?: string) => {
    if (!city && !state) return 'Unknown Location';
    if (city && state) return `${city}, ${state}`;
    return city || state || 'Unknown Location';
  };

  const getContactCount = () => {
    // Primary contact always counts as 1
    let count = 1;
    // Only count contacts in contact_path that are NOT the primary contact
    if (prospect?.contact_path && prospect.contact_path.length > 0) {
      const primaryContactId = prospect.primary_contact_id;
      const additionalContacts = prospect.contact_path.filter((contact: any) => 
        contact.id !== primaryContactId
      );
      count += additionalContacts.length;
    }
    return count;
  };

  // Get additional contacts (excluding primary contact)
  const getAdditionalContacts = () => {
    if (!prospect?.contact_path || prospect.contact_path.length === 0) {
      return [];
    }
    const primaryContactId = prospect.primary_contact_id;
    return prospect.contact_path.filter((contact: any) => 
      contact.id !== primaryContactId
    );
  };

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'contacts', label: 'Contacts', count: getContactCount() },
    { id: 'profile', label: 'Company Profile' },
  ];

  const toggleContactExpansion = (contactId: string) => {
    setExpandedContacts((prev) => ({
      ...prev,
      [contactId]: !prev[contactId],
    }));
  };

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      new: 'New',
      contacted: 'Contacted',
      interested: 'Interested',
      proposal: 'Proposal',
      won: 'Won',
      lost: 'Lost',
      qualified: 'Qualified',
    };
    return labels[status?.toLowerCase() || ''] || status || 'Unknown';
  };

  const getStatusBadgeClass = (status?: string) => {
    const classes: Record<string, string> = {
      new: 'bg-blue-600 text-white',
      contacted: 'bg-purple-600 text-white',
      interested: 'bg-yellow-600 text-white',
      proposal: 'bg-orange-600 text-white',
      won: 'bg-green-600 text-white',
      lost: 'bg-red-600 text-white',
      qualified: 'bg-teal-600 text-white',
    };
    return classes[status?.toLowerCase() || ''] || 'bg-gray-600 text-white';
  };

  const getCardBorderClass = (status?: string) => {
    const classes: Record<string, string> = {
      new: 'border-blue-500',
      contacted: 'border-purple-500',
      interested: 'border-yellow-500',
      proposal: 'border-orange-500',
      won: 'border-green-500',
      lost: 'border-red-500',
      qualified: 'border-teal-500',
    };
    return classes[status?.toLowerCase() || ''] || 'border-gray-600';
  };

  const getCompanyOverview = () => {
    const industry = prospect?.industry || 'Business';
    const location = formatLocation(prospect?.city, prospect?.state);
    return `${prospect?.company_name || 'This company'} is a ${industry.toLowerCase()} company based in ${location}. They have shown interest in our services and represent a potential opportunity for business growth. The company has been identified as a qualified prospect and is currently in the ${getStatusLabel(prospect?.status).toLowerCase()} stage of our sales pipeline.`;
  };

  const openCallLogModal = () => {
    const callLogId = `TCALL-${Date.now()}`;
    startCall(prospect, callLogId);
  };

  const handleHangUp = () => {
    // Call ended, can open call log modal here
  };

  const openActivityModal = () => {
    setSelectedActivity(null);
    setShowActivityModal(true);
  };

  const closeActivityModal = () => {
    setShowActivityModal(false);
    setSelectedActivity(null);
  };

  const saveActivity = () => {
    closeActivityModal();
  };

  const openNoteModal = () => {
    setNoteText('');
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setNoteText('');
  };

  const saveNote = () => {
    closeNoteModal();
  };

  const openStatusModal = () => {
    setSelectedStatus(prospect?.status || 'New');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedStatus('');
  };

  const saveStatus = () => {
    closeStatusModal();
  };

  const openEditModal = () => {
    setShowEditCompanyModal(true);
  };

  const closeEditModal = () => {
    setShowEditCompanyModal(false);
  };

  const handleSaveCompany = async (companyData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      // Find partner ID from prospect
      const partnerId = prospect.organization_id || prospect.organization;
      
      if (!partnerId) {
        alert('Company/Partner ID not found');
        return;
      }

      const response = await fetch(`${apiUrl}/api/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_name: companyData.company_name,
          industry: companyData.industry,
          website: companyData.website,
          phone: companyData.main_phone,
          address: companyData.street_address,
          city: companyData.city,
          state: companyData.state,
          zip_code: companyData.zip_code,
          employee_size: companyData.employee_count,
          revenue: companyData.annual_revenue,
          overview: companyData.overview,
          social_profiles: companyData.social_profiles,
        }),
      });
      
      if (response.ok) {
        // Refresh page to show updated data
        window.location.reload();
        setShowEditCompanyModal(false);
      } else {
        alert('Failed to update company');
      }
    } catch {
      alert('Failed to save company');
    }
  };

  const handleSaveContact = async (contactData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (contactModalMode === 'add') {
        // Create new contact
        const response = await fetch(`${apiUrl}/api/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...contactData,
            lead_id: prospect.name,
          }),
        });
        
        if (response.ok) {
          // Refresh prospect details
          if (onClose) {
            // Trigger refresh by closing and reopening or calling a refresh callback
            window.location.reload(); // Temporary - should use proper state management
          }
          setShowContactModal(false);
        } else {
          alert('Failed to create contact');
        }
      } else {
        // Update existing contact
        const response = await fetch(`${apiUrl}/api/contacts/${editingContact?.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        });
        
        if (response.ok) {
          // Refresh prospect details
          window.location.reload(); // Temporary - should use proper state management
          setShowContactModal(false);
        } else {
          alert('Failed to update contact');
        }
      }
    } catch {
      alert('Failed to save contact');
    }
  };

  const openAssignModal = () => {
    setRepSearchQuery('');
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setRepSearchQuery('');
  };

  const assignToRep = async (userId: string | null) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const leadId = prospect.name || prospect.id;
      
      if (!leadId) {
        showToast('Prospect ID not found', 'error');
        return;
      }

      const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to_id: userId || null,
        }),
      });

      if (response.ok) {
        showToast(userId ? 'User assigned successfully' : 'User unassigned successfully', 'success');
        closeAssignModal();
        // Refresh prospect details
        if (onClose) {
          window.location.reload();
        }
      } else {
        const error = await response.json().catch(() => ({}));
        showToast(error.error || 'Failed to assign user', 'error');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      showToast('Failed to assign user', 'error');
    }
  };

  const viewAllActivities = () => {
    const companyName = prospect?.company_name;
    if (companyName) {
      router.push(`/activities?company=${encodeURIComponent(companyName)}`);
    } else {
      router.push('/activities');
    }
  };

  if (!prospect) return null;

  const containerClass = mode === 'split' ? 'h-fit sticky top-4' : '';
  const paddingClass = mode === 'split' ? 'p-4' : 'p-6';
  const textSizeClass = mode === 'split' ? 'text-sm' : 'text-base';
  const titleSizeClass = mode === 'split' ? 'text-lg' : 'text-2xl';
  const gridCols = mode === 'split' ? 'grid-cols-3' : 'grid-cols-6';

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-lg border-2 flex flex-col ${
        mode === 'popup' ? 'h-full max-h-[90vh] overflow-hidden' : 'min-h-screen'
      } ${getCardBorderClass(prospect.status)} ${containerClass}`}
    >
      {/* Header */}
      <div className={`border-b border-gray-700 flex-shrink-0 ${paddingClass}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h1 className={`${titleSizeClass} font-bold text-white mb-1 truncate`}>
              {prospect.company_name || 'Unknown Company'}
            </h1>
            <p className={`${textSizeClass} text-gray-400`}>
              {formatLocation(prospect.city, prospect.state) || 'Unknown Location'}
            </p>
            <p className={`${textSizeClass} text-gray-400`}>
              {prospect.territory || 'Unknown'} • {prospect.industry || 'Unknown'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                title={mode === 'popup' ? 'Close' : 'Close details'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(prospect.status)}`}>
              {getStatusLabel(prospect.status)}
            </span>
          </div>
        </div>

        {/* Active call banner is now rendered globally under AppHeader */}

        <div className="flex flex-col gap-4">
          <div className="flex items-start space-x-2">
            <User className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <p className={`${mode === 'split' ? 'text-base' : 'text-lg'} font-semibold text-white truncate`}>
                {prospect.lead_name || 'Unknown Contact'}
              </p>
              <p className={`${mode === 'split' ? 'text-sm' : 'text-base'} text-gray-400 truncate`}>
                {prospect.title || 'Contact'}
              </p>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-1 backdrop-blur-sm border border-gray-700/50">
            <div className={`grid ${gridCols} gap-1`}>
              <button
                onClick={openCallLogModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-green-600/20 text-gray-300 hover:text-green-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-green-600/30 hover:scale-105 active:scale-95"
              >
                <Phone className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Call</span>
              </button>
              <button
                onClick={openActivityModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-blue-600/30"
              >
                <Plus className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Task</span>
              </button>
              <button
                onClick={openNoteModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-purple-600/20 text-gray-300 hover:text-purple-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-purple-600/30"
              >
                <FileText className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Note</span>
              </button>
              <button
                onClick={openStatusModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-yellow-600/20 text-gray-300 hover:text-yellow-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-yellow-600/30"
              >
                <Settings className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Status</span>
              </button>
              <button
                onClick={openAssignModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-orange-600/20 text-gray-300 hover:text-orange-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-orange-600/30"
              >
                <UserCog className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Assign</span>
              </button>
              <button
                onClick={openEditModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-cyan-600/20 text-gray-300 hover:text-cyan-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-cyan-600/30"
              >
                <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                <span className="relative z-10 hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
        <nav className="flex space-x-0" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors text-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white bg-gray-700'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
              {tab.count && (
                <span className="ml-1 text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={`bg-gray-800 flex-1 min-h-0 ${mode === 'popup' ? 'overflow-y-auto' : 'overflow-y-auto'}`}>
        {activeTab === 'activity' && (
          <div className={`${paddingClass} space-y-4`}>
            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <Clock className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Tasks
              </h3>
              <div className="space-y-2">
                <div className="bg-gray-700/50 rounded-md p-3 border-l-[3px] border-yellow-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm">Callback</h4>
                      <p className="text-gray-400 text-xs">Tomorrow 2:00 PM</p>
                      <p className="text-gray-400 text-xs">{getInitials(prospect.lead_owner || 'Calvin M.')}</p>
                    </div>
                    <button className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex-shrink-0">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showActivityHistory && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${textSizeClass} font-semibold text-white flex items-center`}>
                    <Activity className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                    Recent Activity
                  </h3>
                  <button
                    onClick={viewAllActivities}
                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${textSizeClass}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span>View All</span>
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-md p-3 transition-colors border border-gray-600/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold text-sm">Call Log</h4>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-600 text-white">Call</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-1.5">
                          Yesterday 3:30 PM • {getInitials(prospect.lead_owner || 'Calvin M.')}
                        </p>
                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                          Discussed pricing and timeline. Customer interested in moving forward with the proposal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className={`${paddingClass} space-y-4`}>
            <div className="flex justify-between items-center">
              <h3 className={`${textSizeClass} font-semibold text-white flex items-center`}>
                <Users className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Contacts ({getContactCount()})
              </h3>
              <button 
                onClick={() => {
                  setContactModalMode('add');
                  setEditingContact(null);
                  setShowContactModal(true);
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-md transition-all border border-blue-600/30 hover:border-blue-600/50"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                <span>Add Contact</span>
              </button>
            </div>
            <div className="space-y-3">
              <div
                onClick={() => toggleContactExpansion('primary')}
                className="bg-gray-700/50 hover:bg-gray-700 rounded-md p-3 border-l-[3px] border-green-500 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`${mode === 'split' ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      <span className={mode === 'split' ? 'text-xs' : 'text-sm'}>{getInitials(prospect.lead_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-medium text-sm truncate">{prospect.lead_name || 'Unknown'}</h4>
                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full flex-shrink-0">Primary</span>
                      </div>
                      <p className="text-gray-300 text-xs">{prospect.title || 'Contact'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCall) onCall(prospect);
                        // Trigger OS dialer (FaceTime/Dialpad/Mobile) via tel: link
                        const phone = prospect.phone || prospect.primary_phone || prospect.primary_mobile || '';
                        if (phone && typeof window !== 'undefined') {
                          window.location.href = `tel:${phone}`;
                        }
                        // Also update global call banner
                        startCall(prospect, '');
                      }}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEmail) onEmail(prospect);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                      title="Email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedContacts['primary'] && (
                  <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-sm">{prospect.phone || prospect.primary_phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-sm truncate">{prospect.email_id || prospect.primary_email || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Contacts from Contact Path (excluding primary) */}
            {getAdditionalContacts().length > 0 && (
              <div className="space-y-3 mt-4">
                {getAdditionalContacts().map((contact: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => toggleContactExpansion(`contact-${index}`)}
                    className="bg-gray-700/50 hover:bg-gray-700 rounded-md p-3 border-l-[3px] border-blue-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`${mode === 'split' ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
                          <span className={mode === 'split' ? 'text-xs' : 'text-sm'}>{getInitials(contact.name)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{contact.name || 'Unknown'}</h4>
                          <p className="text-gray-300 text-xs">{contact.status || 'Contact'}</p>
                        </div>
                      </div>
                    </div>
                    {expandedContacts[`contact-${index}`] && (
                      <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                        <p className="text-gray-400 text-xs">Sequence: {contact.sequence || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {getAdditionalContacts().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">No additional contacts</p>
                <button
                  onClick={() => {
                    setContactModalMode('add');
                    setEditingContact(null);
                    setShowContactModal(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  + Add Contact
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className={`${paddingClass} space-y-4`}>
            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <Building2 className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Overview
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <p className={`text-gray-300 leading-relaxed text-xs ${showFullOverview ? '' : 'line-clamp-4'}`}>
                  {getCompanyOverview()}
                </p>
                {!showFullOverview && (
                  <button
                    onClick={() => setShowFullOverview(true)}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    See More
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                )}
                {showFullOverview && (
                  <button
                    onClick={() => setShowFullOverview(false)}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    See Less
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <Info className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Key Details
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Industry:</span>
                    <span className="text-gray-300 text-xs">{prospect.industry || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Territory:</span>
                    <span className="text-gray-300 text-xs">{prospect.territory || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <ContactModal
        show={showContactModal}
        mode={contactModalMode}
        contactData={editingContact}
        organizationId={prospect.organization_id || prospect.organization}
        onClose={() => setShowContactModal(false)}
        onSave={handleSaveContact}
      />

      <EditCompanyModal
        show={showEditCompanyModal}
        companyData={prospect}
        onClose={closeEditModal}
        onSave={handleSaveCompany}
      />

      {/* Modals */}
      <TallacActivityModal
        show={showActivityModal}
        activity={selectedActivity}
        leadInfo={{
          name: prospect.name || prospect.id,
          company_name: prospect.company_name,
          primary_contact_name: prospect.lead_name,
        }}
        onClose={closeActivityModal}
        onSave={saveActivity}
      />

      {/* Note Modal */}
      {showNoteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeNoteModal}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Add Note
                </h3>
                <p className="text-sm text-gray-400 mt-1">{prospect.company_name}</p>
              </div>
              <button onClick={closeNoteModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Note Content</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your note here..."
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={closeNoteModal} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeStatusModal}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Change Status
              </h3>
              <button onClick={closeStatusModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">Select new status for {prospect.company_name}</p>
              <div className="grid grid-cols-2 gap-3">
                {['New', 'Contacted', 'Interested', 'Proposal', 'Won', 'Lost'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      saveStatus();
                    }}
                    className={`p-4 rounded-lg font-medium transition-colors ${
                      prospect.status?.toLowerCase() === status.toLowerCase()
                        ? 'ring-2 ring-white/40 scale-102'
                        : ''
                    } ${
                      status === 'New'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : status === 'Contacted'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : status === 'Interested'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : status === 'Proposal'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : status === 'Won'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeAssignModal}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  Assign
                </h3>
                <p className="text-sm text-gray-400 mt-1">Assign a Representative for {prospect.company_name}</p>
              </div>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Search Team Members</label>
                <input
                  type="text"
                  value={repSearchQuery}
                  onChange={(e) => setRepSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Type to search users..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {loadingUsers ? (
                  <div className="text-center py-4 text-gray-400">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    {repSearchQuery ? 'No users found' : 'No users available'}
                  </div>
                ) : (
                  <>
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => assignToRep(user.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(user.full_name || user.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user.full_name || user.email}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                            {user.role && (
                              <p className="text-xs text-gray-500">{user.role}</p>
                            )}
                          </div>
                        </div>
                        {prospect.assigned_to_id === user.id && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Assigned</span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => assignToRep(null)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors text-left border-t border-gray-700 pt-3 mt-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                        <X className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-400 italic">Unassign</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

