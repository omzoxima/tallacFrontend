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
  const [activities, setActivities] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [showManageLinksModal, setShowManageLinksModal] = useState(false);
  const [newLinkType, setNewLinkType] = useState('Website');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [socialProfiles, setSocialProfiles] = useState<any[]>([]);

  // Load organization details for profile tab
  useEffect(() => {
    const loadOrganization = async () => {
      if (!prospect?.organization_id) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        const response = await fetch(`${apiUrl}/api/organizations/${prospect.organization_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          const data = result.data || result;
          console.log('🏢 Organization data loaded:', data);
          setOrganizationData(data);
          setSocialProfiles(data.social_profiles || []);
        }
      } catch (error) {
        console.error('Failed to load organization:', error);
      }
    };
    
    loadOrganization();
  }, [prospect?.organization_id]);

  // Load activities and call logs for prospect
  useEffect(() => {
    const loadActivitiesAndCallLogs = async () => {
      if (!prospect?.id && !prospect?.name) return;
      
      try {
        setLoadingActivities(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        const prospectId = prospect.name || prospect.id;
        
        // Fetch activities timeline
        const response = await fetch(
          `${apiUrl}/api/activities/timeline?reference_doctype=Tallac Lead&reference_docname=${prospectId}&activity_types=${JSON.stringify(['activity', 'call_log', 'note'])}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Timeline API Response for', prospectId, ':', data);
          
          // Separate activities and call logs
          const acts = data.filter((item: any) => item.timeline_type === 'activity');
          const calls = data.filter((item: any) => item.timeline_type === 'call_log');
          
          console.log('📅 Scheduled Activities:', acts.length, acts);
          console.log('📞 Call Logs:', calls.length, calls);
          console.log('🔍 Sample item:', data[0]);
          
          setActivities(acts);
          setCallLogs(calls);
        } else {
          console.error('Timeline API error:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };
    
    loadActivitiesAndCallLogs();
    
    // Listen for activity/call log creation events
    const handleActivityCreated = () => {
      console.log('🔔 Activity created event received - refreshing...');
      loadActivitiesAndCallLogs();
    };
    
    console.log('👂 Setting up event listeners for prospect:', prospect?.name || prospect?.id);
    window.addEventListener('tallac:activity-created', handleActivityCreated);
    window.addEventListener('tallac:call-log-created', handleActivityCreated);
    
    return () => {
      window.removeEventListener('tallac:activity-created', handleActivityCreated);
      window.removeEventListener('tallac:call-log-created', handleActivityCreated);
    };
  }, [prospect?.id, prospect?.name]);

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

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
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
    { id: 'profile', label: 'Profile' },
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

  const saveActivity = async () => {
    // Refresh activities after saving
    await refreshActivities();
    closeActivityModal();
  };

  const refreshActivities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      const prospectId = prospect.id || prospect.name;
      const response = await fetch(
        `${apiUrl}/api/activities/timeline?reference_doctype=Tallac Lead&reference_docname=${prospectId}&activity_types=${JSON.stringify(['activity', 'call_log', 'note'])}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const acts = data.filter((item: any) => item.timeline_type === 'activity');
        const calls = data.filter((item: any) => item.timeline_type === 'call_log');
        setActivities(acts);
        setCallLogs(calls);
      }
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    }
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

  const saveStatus = async () => {
    if (!selectedStatus || !prospect?.id) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      const response = await fetch(`${apiUrl}/api/leads/${prospect.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: selectedStatus }),
      });
      
      if (response.ok) {
        showToast(`Status updated to ${selectedStatus}`, 'success');
    closeStatusModal();
        
        // Refresh the page or emit update event
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error updating status', 'error');
    }
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

  const markActivityDone = async (activityId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      // For now, just refresh the data - activity completion API can be added later
      showToast('Activity marked as done', 'success');
      
      // Refresh activities
      const prospectId = prospect.id || prospect.name;
      const refreshResponse = await fetch(
        `${apiUrl}/api/activities/timeline?reference_doctype=Tallac Lead&reference_docname=${prospectId}&activity_types=${JSON.stringify(['activity', 'call_log', 'note'])}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const acts = data.filter((item: any) => item.timeline_type === 'activity');
        const calls = data.filter((item: any) => item.timeline_type === 'call_log');
        setActivities(acts);
        setCallLogs(calls);
      }
    } catch (error) {
      console.error('Error marking activity as done:', error);
      showToast('Error marking activity as done', 'error');
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
                <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span className="relative z-10 hidden sm:inline">Schedule</span>
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
          <div className={paddingClass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Scheduled Activities Section - Simple Cards (NO Timeline) */}
            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <svg 
                  className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Scheduled
              </h3>
              
              {loadingActivities ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="bg-gray-700/30 rounded-md p-4 text-center">
                  <p className="text-gray-500 text-xs">No scheduled activities</p>
                </div>
              ) : (
              <div className="space-y-2">
                  {activities.map((activity) => {
                    const getBorderColor = (priority: string) => {
                      if (priority === 'High') return 'border-red-500';
                      if (priority === 'Medium') return 'border-yellow-500';
                      return 'border-blue-500';
                    };
                    
                    const formatDateTime = (date: string, time?: string) => {
                      const d = new Date(date);
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                      
                      let dateStr = '';
                      if (d.toDateString() === today.toDateString()) {
                        dateStr = 'Today';
                      } else if (d.toDateString() === tomorrow.toDateString()) {
                        dateStr = 'Tomorrow';
                      } else if (d < today) {
                        const textColor = d < today ? 'text-red-400' : 'text-gray-400';
                        return <p className={`${textColor} text-xs`}>Overdue: {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>;
                      } else {
                        dateStr = d.toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
                      }
                      
                      if (time && !dateStr.includes(':')) {
                        dateStr += ` ${time}`;
                      }
                      
                      return dateStr;
                    };
                    
                    return (
                      <div key={activity.id} className={`bg-gray-700/50 rounded-md p-3 border-l-[3px] ${getBorderColor(activity.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm">{activity.activity_type || 'Task'}</h4>
                            <p className="text-gray-400 text-xs">
                              {formatDateTime(activity.scheduled_date, activity.scheduled_time)}
                            </p>
                            {activity.assigned_to_name && (
                              <p className="text-gray-400 text-xs">{getInitials(activity.assigned_to_name)}</p>
                            )}
                    </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markActivityDone(activity.id);
                            }}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex-shrink-0"
                          >
                      Done
                    </button>
                  </div>
                </div>
                    );
                  })}
              </div>
              )}
            </div>

            {/* Recent Activity (Call Logs) Section - Timeline Format */}
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
                
                {loadingActivities ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '2px solid #4b5563', 
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    </div>
                ) : callLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Activity style={{ width: '48px', height: '48px', color: '#6b7280', margin: '0 auto 8px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>No recent activity</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>Activities will appear here as they&apos;re created</p>
                        </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {callLogs.slice(0, 5).map((log, index) => {
                      const getActivityBgColor = (outcome: string) => {
                        const colors: Record<string, string> = {
                          'Interested': '#22c55e',
                          'Connected': '#22c55e',
                          'Callback Requested': '#06b6d4',
                          'Not Interested': '#ef4444',
                          'No Answer': '#eab308',
                          'Voicemail': '#06b6d4',
                          'Wrong Number': '#f97316',
                        };
                        return colors[outcome] || '#6b7280';
                      };
                      
                      const getBadgeColor = (outcome: string) => {
                        return getActivityBgColor(outcome);
                      };
                      
                      const formatTimeAgo = (dateStr: string) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMins / 60);
                        const diffDays = Math.floor(diffHours / 24);
                        
                        if (diffMins < 1) return 'Just now';
                        if (diffMins < 60) return `${diffMins}m ago`;
                        if (diffHours < 24) return `${diffHours}h ago`;
                        if (diffDays < 7) return `${diffDays}d ago`;
                        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
                        return date.toLocaleDateString();
                      };
                      
                      const formatDuration = (seconds: number) => {
                        if (!seconds) return '0s';
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        if (mins > 0) return `${mins}m ${secs}s`;
                        return `${secs}s`;
                      };
                      
                      const outcome = log.call_outcome || log.outcome || 'Call';
                      const userName = log.handled_by_name || log.user_name || 'User';
                      const callNotes = log.call_notes || log.notes || '';
                      const duration = log.call_duration || log.duration_seconds || 0;
                      
                      return (
                        <div key={log.id || index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          {/* Timeline Icon & Connector */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                            {/* Activity Icon */}
                            <div 
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: getActivityBgColor(outcome),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                              }}
                            >
                              <Phone style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                            </div>
                            {/* Connecting Line */}
                            {index < callLogs.slice(0, 5).length - 1 && (
                              <div 
                                style={{
                                  width: '2px',
                                  backgroundColor: '#374151',
                                  flexGrow: 1,
                                  minHeight: '20px',
                                  marginTop: '4px'
                                }}
                              ></div>
                            )}
                          </div>

                          {/* Activity Card */}
                          <div style={{ flex: 1, minWidth: 0, paddingBottom: '8px' }}>
                            <div 
                              style={{
                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                borderRadius: '6px',
                                padding: '12px',
                                border: '1px solid rgba(75, 85, 99, 0.5)',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.7)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.5)'}
                            >
                              {/* Header */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span 
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: getBadgeColor(outcome),
                                    color: '#ffffff'
                                  }}
                                >
                                  Call Log
                                </span>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                  {formatTimeAgo(log.created_at || log.call_date)}
                                </span>
                              </div>

                              {/* Subject/Title */}
                              <h4 style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                                Call - {outcome}
                              </h4>

                              {/* Description */}
                              {callNotes && (
                                <p 
                                  style={{
                                    color: '#d1d5db',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {callNotes}
                                </p>
                              )}

                              {/* Metadata */}
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
                                {/* User Avatar/Initials */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <div 
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: '#4b5563',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      fontWeight: 500,
                                      color: '#ffffff'
                                    }}
                                  >
                                    {getInitials(userName)}
                      </div>
                                  <span>{userName.split('@')[0].replace(/[._]/g, ' ')}</span>
                    </div>

                                {/* Call Duration */}
                                {duration > 0 && (
                                  <>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <Clock style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                    <span>{formatDuration(duration)}</span>
                                  </>
                                )}

                                {/* Call Outcome */}
                                {outcome && (
                                  <>
                                    <span style={{ margin: '0 8px' }}>•</span>
                                    <span>{outcome}</span>
                                  </>
                                )}
                  </div>
                </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}
              </div>
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
            {/* Company Overview Section */}
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

            {/* Social Profiles Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${textSizeClass} font-semibold text-white flex items-center`}>
                  <Share2 className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                  Social Profiles
                </h3>
                <button 
                  onClick={() => setShowManageLinksModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Manage
                </button>
              </div>
              <div className="bg-gray-700/50 rounded-md p-3">
                {socialProfiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {socialProfiles.map((profile, index) => (
                      <a 
                        key={index}
                        href={profile.profile_url?.startsWith('http') ? profile.profile_url : `https://${profile.profile_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all duration-200 flex items-center gap-2 bg-gray-800/50"
                        title={profile.platform}
                      >
                        {profile.platform === 'Website' && <Globe className="w-4 h-4" />}
                        {profile.platform === 'LinkedIn' && <Linkedin className="w-4 h-4" />}
                        {profile.platform === 'Facebook' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        {profile.platform === 'Twitter' && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        )}
                        {!['Website', 'LinkedIn', 'Facebook', 'Twitter'].includes(profile.platform) && (
                          <Globe className="w-4 h-4" />
                        )}
                        <span className="text-xs">{profile.platform}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs italic text-center py-2">
                    No social profiles added
                  </div>
                )}
              </div>
            </div>

            {/* Key Details Section */}
            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <Info className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Key Details
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Industry:</span>
                    <span className="text-gray-300 text-xs">{prospect.industry || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Employee Size:</span>
                    <span className="text-gray-300 text-xs">{organizationData?.employee_size || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Revenue:</span>
                    <span className="text-gray-300 text-xs">{organizationData?.revenue || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Companies Section */}
            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <Network className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Related Companies
              </h3>
              <div className="space-y-2">
                <div className="bg-gray-700/30 rounded-md p-4 text-center">
                  <p className="text-gray-400 text-xs italic">No related companies</p>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div>
              <h3 className={`${textSizeClass} font-semibold text-white mb-3 flex items-center`}>
                <Settings className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Metadata
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Created By:</span>
                    <span className="text-gray-300 text-xs">{prospect.lead_owner || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Created:</span>
                    <span className="text-gray-300 text-xs">
                      {prospect.created_at ? new Date(prospect.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Updated By:</span>
                    <span className="text-gray-300 text-xs">{prospect.modified_by || prospect.lead_owner || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Updated:</span>
                    <span className="text-gray-300 text-xs">
                      {prospect.updated_at ? new Date(prospect.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
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

      {/* Manage Social Links Modal */}
      {showManageLinksModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowManageLinksModal(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Manage Links
              </h3>
              <button onClick={() => setShowManageLinksModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Add New Link */}
              <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
                <h4 className="text-sm font-medium text-white mb-3">Add New Link</h4>
                
                {/* Quick Add Icons */}
                <div className="flex gap-3 mb-4">
                  {['Website', 'LinkedIn', 'Twitter', 'Facebook'].map((platform) => (
                    <button 
                      key={platform}
                      onClick={() => setNewLinkType(platform)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        newLinkType === platform 
                          ? 'bg-blue-600 text-white shadow-lg scale-110' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                      }`}
                      title={platform}
                    >
                      {platform === 'Website' && <Globe className="w-5 h-5" />}
                      {platform === 'LinkedIn' && <Linkedin className="w-5 h-5" />}
                      {platform === 'Twitter' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {platform === 'Facebook' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* URL Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      value={newLinkUrl} 
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      type="text" 
                      placeholder={`e.g., https://example.com`}
                      className="w-full pl-3 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (newLinkUrl.trim()) {
                        setSocialProfiles([...socialProfiles, { platform: newLinkType, profile_url: newLinkUrl }]);
                        setNewLinkUrl('');
                        showToast('Link added (save company to persist)', 'success');
                      }
                    }}
                    disabled={!newLinkUrl.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected: <span className="text-blue-400 font-medium">{newLinkType}</span>
                </p>
              </div>

              {/* Existing Links */}
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Existing Links</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {socialProfiles.map((profile, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg border border-gray-600/30"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {profile.platform === 'Website' && <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        {profile.platform === 'LinkedIn' && <Linkedin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        {!['Website', 'LinkedIn'].includes(profile.platform) && <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium">{profile.platform}</p>
                          <p className="text-xs text-gray-400 truncate">{profile.profile_url}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSocialProfiles(socialProfiles.filter((_, i) => i !== index));
                          showToast('Link removed (save company to persist)', 'info');
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {socialProfiles.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No links added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    onClick={async () => {
                      setSelectedStatus(status);
                      
                      // Save status immediately with the selected value
                      if (!prospect?.id) {
                        console.error('No prospect ID found');
                        showToast('Cannot update status: prospect ID missing', 'error');
                        return;
                      }
                      
                      try {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                        const token = localStorage.getItem('token');
                        
                        if (!token) {
                          console.error('No token found');
                          return;
                        }
                        
                        const url = `${apiUrl}/api/leads/${prospect.id}/status`;
                        console.log('🔄 Updating status:', { prospect_id: prospect.id, new_status: status, url });
                        
                        const response = await fetch(url, {
                          method: 'PATCH',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ status }),
                        });
                        
                        console.log('📡 Status update response:', response.status);
                        
                        if (response.ok) {
                          const result = await response.json();
                          console.log('✅ Status updated successfully:', result);
                          showToast(`Status updated to ${status}`, 'success');
                          closeStatusModal();
                          
                          // Refresh the page
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        } else {
                          const errorText = await response.text();
                          console.error('❌ Status update failed:', errorText);
                          showToast('Failed to update status', 'error');
                        }
                      } catch (error) {
                        console.error('❌ Error updating status:', error);
                        showToast('Error updating status', 'error');
                      }
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

