'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe, Linkedin, X, Clock, User, Users, Phone, Mail, Calendar, MapPin, MoreVertical,
  Edit, Building2, Share2, Info, Trash2, Filter, Settings, FileText, Check, Link as LinkIcon,
  Plus, UserCog, Edit2, CheckSquare, UserCheck, Activity
} from 'lucide-react';
import TallacActivityModal from './TallacActivityModal';
import ContactModal from './ContactModal';
import ActivityTimelineCompact, { ActivityTimelineCompactRef } from './ActivityTimelineCompact';
import AssignRepresentativeModal from './AssignRepresentativeModal';
import { api } from '@/lib/api';
import { useCall } from '@/contexts/CallContext';

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
  const { activeCall, startCall, endCall } = useCall();
  const activityTimelineRef = useRef<ActivityTimelineCompactRef>(null);
  const overviewElementRef = useRef<HTMLParagraphElement>(null);

  // State
  const [activeTab, setActiveTab] = useState<'activity' | 'contacts' | 'profile'>('activity');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showManageLinksModal, setShowManageLinksModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [isOverviewTruncated, setIsOverviewTruncated] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [contactMenuOpen, setContactMenuOpen] = useState<Record<string, boolean>>({});
  const [contactModalMode, setContactModalMode] = useState<'add' | 'edit'>('add');
  const [editingContact, setEditingContact] = useState<any>(null);
  const [newLinkType, setNewLinkType] = useState('Website');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [scheduledActivities, setScheduledActivities] = useState<any[]>([]);
  const [detailedProspect, setDetailedProspect] = useState<any>(null);

  const linkTypes = ['Website', 'LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'YouTube', 'Other'];

  // Computed display prospect
  const displayProspect = useMemo(() => {
    const base = detailedProspect ? {
      ...prospect,
      ...detailedProspect.prospect,
      organization: detailedProspect.organization,
      contacts: detailedProspect.contacts,
      primary_contact_details: detailedProspect.primary_contact,
      // Ensure company_name is available
      company_name: detailedProspect.prospect?.company_name || 
                    detailedProspect.organization?.organization_name || 
                    prospect.company_name || 
                    prospect.organization_name,
    } : prospect;

    let primary = null;
    if (base.primary_contact_details) {
      primary = base.primary_contact_details;
    } else if (base.lead_name) {
      primary = {
        full_name: base.lead_name,
        designation: base.title,
        mobile_no: base.phone || base.primary_phone,
        email_id: base.email_id || base.primary_email,
      };
    } else if (base.lead_first_name) {
      primary = {
        full_name: `${base.lead_first_name} ${base.lead_last_name || ''}`.trim(),
        designation: base.title,
        mobile_no: base.phone,
        email_id: base.email_id,
      };
    }

    return {
      ...base,
      primaryContact: primary,
      // Ensure company_name is always available
      company_name: base.company_name || base.organization_name || 'No Company',
    };
  }, [prospect, detailedProspect]);

  // Fetch prospect details (silently in background, like Vue3)
  const fetchDetails = useCallback(async () => {
    if (!prospect?.id && !prospect?.name) return;

    // Don't show loading state - Vue3 doesn't show it either
    // Just fetch in background and update when ready
    try {
      const result = await api.getProspectDetails(prospect.id || prospect.name);
      if (result.success && result.data) {
        setDetailedProspect(result.data);
      }
    } catch (error) {
      console.error('Error fetching prospect details:', error);
    }
  }, [prospect]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Fetch scheduled activities
  const fetchScheduledActivities = useCallback(async () => {
    if (!prospect?.id && !prospect?.name) return;

    try {
      const result = await api.getScheduledActivities(prospect.id || prospect.name);
      if (result.success && result.data) {
        setScheduledActivities(result.data);
      }
    } catch (error) {
      console.error('Error fetching scheduled activities:', error);
    }
  }, [prospect]);

  useEffect(() => {
    fetchScheduledActivities();
  }, [fetchScheduledActivities]);

  // Check if call is active
  const isCallActive = useMemo(() => activeCall !== null, [activeCall]);

  // Helper functions
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
    if (detailedProspect?.contacts !== undefined) {
      return 1 + detailedProspect.contacts.length;
    }
    let count = 1;
    if (prospect.contact_path && prospect.contact_path.length > 0) {
      count += prospect.contact_path.length;
    }
    return count;
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
      new: 'border-blue-600',
      contacted: 'border-purple-600',
      interested: 'border-yellow-600',
      proposal: 'border-orange-600',
      won: 'border-green-600',
      lost: 'border-red-600',
      qualified: 'border-teal-600',
    };
    return classes[status?.toLowerCase() || ''] || 'border-gray-600';
  };

  const getPrimaryPhone = (contact: any) => {
    if (!contact) return '';
    if (contact.mobile_no) return contact.mobile_no;
    if (Array.isArray(contact.phone_nos) && contact.phone_nos.length) {
      const primary = contact.phone_nos.find((p: any) => p.is_primary_phone);
      if (primary && primary.phone) return primary.phone;
      return contact.phone_nos[0].phone;
    }
    return '';
  };

  const formatScheduledDate = (date?: string, time?: string) => {
    if (!date) return '';
    const dt = new Date(`${date} ${time || '00:00'}`);
    return dt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (date?: string, time?: string) => {
    if (!date) return false;
    const dt = new Date(`${date} ${time || '23:59'}`);
    return dt < new Date();
  };

  const getCompanyOverview = () => {
    if (detailedProspect?.organization?.overview) {
      return detailedProspect.organization.overview;
    }
    return 'No company overview available.';
  };

  const ensureAbsoluteUrl = (url: string) => {
    if (!url) return '#';
    if (url.match(/^https?:\/\//)) return url;
    return `https://${url}`;
  };

  // Modal handlers
  const openActivityModal = () => {
    setSelectedActivity(null);
    setShowActivityModal(true);
  };

  const closeActivityModal = () => {
    setShowActivityModal(false);
    setSelectedActivity(null);
  };

  const handleActivitySaved = async (activityData: any) => {
    try {
      const payload = {
        prospect: prospect.id || prospect.name,
        activity_type: activityData.activity_type,
        scheduled_date: activityData.scheduled_date,
        scheduled_time: activityData.scheduled_time,
        assigned_to: activityData.assigned_to,
        contact_name: activityData.contact_name || '',
        description: activityData.description,
        subject: activityData.contact_name
          ? `${activityData.activity_type} - ${activityData.contact_name}`
          : `${activityData.activity_type} - ${prospect.company_name}`,
      };

      let result;
      if (activityData.id || activityData.name) {
        result = await api.updateActivity(activityData.id || activityData.name, payload);
      } else {
        result = await api.createScheduledActivity(payload);
      }

      if (result.success) {
        if (activityTimelineRef.current) {
          activityTimelineRef.current.refresh();
        }
        fetchScheduledActivities();
        closeActivityModal();
      } else {
        alert('Failed to save activity: ' + (result.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error in handleActivitySaved:', error);
      alert('Error saving activity: ' + error.message);
    }
  };

  const handleActivityCancelled = async (activityData: any) => {
    if (!activityData.id && !activityData.name) return;

    try {
      const result = await api.updateActivity(activityData.id || activityData.name, {
        status: 'Cancelled',
      });

      if (result.success) {
        fetchScheduledActivities();
        if (activityTimelineRef.current) {
          activityTimelineRef.current.refresh();
        }
      } else {
        alert('Failed to cancel activity');
      }
    } catch (error) {
      console.error('Error canceling activity:', error);
      alert('Error canceling activity');
    }
  };

  const editActivity = (activity: any) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const markActivityDone = async (activity: any) => {
    try {
      const result = await api.updateActivity(activity.id || activity.name, {
        status: 'Completed',
      });

      if (result.success) {
        fetchScheduledActivities();
        if (activityTimelineRef.current) {
          activityTimelineRef.current.refresh();
        }
      } else {
        alert('Failed to complete activity');
      }
    } catch (error) {
      console.error('Error completing activity:', error);
      alert('Error completing activity');
    }
  };

  const initiateActivityCall = async (activity: any) => {
    let phoneNumber = '';
    let contactName = 'Unknown';
    let contactId = 'primary';

    if (activity.contact_name) {
      contactName = activity.contact_name;
      const contact = detailedProspect?.contacts?.find(
        (c: any) => c.full_name === activity.contact_name || c.id === activity.contact || c.name === activity.contact
      );

      if (contact) {
        phoneNumber = getPrimaryPhone(contact);
        contactId = contact.id || contact.name || 'primary';
      }
    }

    if (!phoneNumber) {
      const primary = detailedProspect?.primary_contact || detailedProspect?.primaryContact;
      if (primary) {
        phoneNumber = getPrimaryPhone(primary);
        contactName = primary.full_name;
        contactId = 'primary';
      }
    }

    if (!phoneNumber) {
      phoneNumber = prospect.primary_phone || prospect.phone || '';
      contactName = prospect.lead_name || prospect.company_name || '';
    }

    if (!phoneNumber) {
      alert('No phone number available to call.');
      return;
    }

    initiateCall(phoneNumber, contactName, contactId, null, activity.id || activity.name);
  };

  const initiateCall = (phoneNumber: string, contactName: string, contactId: string, callLogId?: string, linkedActivityId?: string | null) => {
    if (!phoneNumber) {
      alert('No phone number available for this contact');
      return;
    }

    startCall({
      id: prospect.id || prospect.name,
      primary_contact: contactName,
      company_name: prospect.company_name,
      primary_phone: phoneNumber,
      phone: phoneNumber,
      linkedActivityId: linkedActivityId || null,
    }, callLogId);
  };

  const openCallLogModal = async () => {
    const contact = displayProspect.primaryContact;
    const phoneNumber = getPrimaryPhone(contact) || prospect.primary_phone || prospect.phone || '';
    const contactName = contact?.full_name || prospect.lead_name || 'Primary Contact';

    let callLogId = null;
    try {
      const logData = {
        status: 'In Progress',
        start_time: new Date().toISOString(),
        subject: `Call to ${contactName}`,
        description: `Calling ${contactName} (${phoneNumber})...`,
      };

      const result = await api.createCallLog(prospect.id || prospect.name, logData);
      if (result.success && result.data) {
        callLogId = result.data.id || result.data.name;
      }
    } catch (err) {
      console.error('Failed to create initial call log:', err);
    }

    initiateCall(phoneNumber, contactName, 'primary', callLogId || undefined);
  };

  // Note modal handlers
  const openNoteModal = () => {
    setNoteText('');
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setNoteText('');
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;

    try {
      const noteData = {
        prospect: prospect.id || prospect.name,
        description: noteText,
        subject: 'Note',
      };

      const result = await api.createNoteActivity(noteData);

      if (result.success) {
        closeNoteModal();
        if (activityTimelineRef.current) {
          activityTimelineRef.current.refresh();
        }
      } else {
        alert('Failed to save note');
      }
    } catch (error: any) {
      console.error('Error saving note:', error);
      alert('Error saving note: ' + error.message);
    }
  };

  // Status modal handlers
  const openStatusModal = () => {
    setSelectedStatus(prospect.status || 'New');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedStatus('');
  };

  const saveStatus = async () => {
    try {
      const result = await api.updateProspect(prospect.id || prospect.name, {
        status: selectedStatus,
      });

      if (result.success) {
        closeStatusModal();
        fetchDetails();
      } else {
        alert('Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  // Assign modal handlers
  const openAssignModal = () => {
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
  };

  const assignToRep = async (repName: string) => {
    try {
      const newOwner = repName === 'Administrator' ? null : repName;
      const result = await api.updateProspect(prospect.id || prospect.name, {
        assigned_to: newOwner,
      });

      if (result.success) {
        fetchDetails();
        closeAssignModal();
        if (onAssign) {
          onAssign({ ...prospect, assigned_to: newOwner });
        }
      } else {
        alert('Failed to assign user: ' + result.message);
      }
    } catch (error: any) {
      console.error('Error assigning user:', error);
      alert('An error occurred while assigning user');
    }
  };

  // Contact modal handlers
  const openAddContactModal = () => {
    setContactModalMode('add');
    setEditingContact(null);
    setShowContactModal(true);
  };

  const openEditContactModal = (contactId: string, contactData: any) => {
    setContactModalMode('edit');
    setEditingContact(contactData);
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setEditingContact(null);
  };

  const saveContact = async (contactData: any) => {
    try {
      const contactId = editingContact?.id || editingContact?.name;
      
      if (!contactId) {
        alert('Contact ID not found. Cannot update contact.');
        return;
      }

      const result = await api.updateContact(contactId, contactData);

      if (result.success) {
        await fetchDetails();
        closeContactModal();
        // Refresh activity timeline if available
        if (activityTimelineRef.current) {
          activityTimelineRef.current.refresh();
        }
      } else {
        alert('Failed to update contact: ' + (result.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error saving contact:', error);
      alert('An error occurred while saving the contact: ' + (error.message || 'Unknown error'));
    }
  };

  const markAsPrimary = async (contactId: string) => {
    if (!detailedProspect?.organization?.id && !detailedProspect?.organization?.name) return;

    try {
      const result = await api.setOrganizationPrimaryContact(
        detailedProspect.organization.id || detailedProspect.organization.name,
        contactId
      );

      if (result.success) {
        fetchDetails();
      } else {
        alert('Failed to mark contact as primary. Please try again.');
      }
    } catch (error) {
      console.error('Error marking contact as primary:', error);
      alert('An error occurred while marking the contact as primary.');
    }
  };

  const deleteContact = (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      console.log('Deleting contact:', contactId);
      // TODO: Implement contact deletion API call
      alert(`Contact deleted: ${contactId}`);
    }
  };


  // Manage links handlers
  const openManageLinksModal = () => {
    setShowManageLinksModal(true);
    setNewLinkType('Website');
    setNewLinkUrl('');
  };

  const closeManageLinksModal = () => {
    setShowManageLinksModal(false);
  };

  const selectPlatform = (platform: string) => {
    setNewLinkType(platform);
  };

  const getPlaceholder = (type: string) => {
    const placeholders: Record<string, string> = {
      Website: 'https://example.com',
      LinkedIn: 'https://linkedin.com/in/username',
      Twitter: 'https://twitter.com/username',
      Facebook: 'https://facebook.com/username',
      Instagram: 'https://instagram.com/username',
    };
    return placeholders[type] || 'https://...';
  };

  const detectPlatform = () => {
    const url = newLinkUrl.toLowerCase();
    if (url.includes('linkedin.com')) setNewLinkType('LinkedIn');
    else if (url.includes('twitter.com') || url.includes('x.com')) setNewLinkType('Twitter');
    else if (url.includes('facebook.com')) setNewLinkType('Facebook');
    else if (url.includes('instagram.com')) setNewLinkType('Instagram');
  };

  const addLink = async () => {
    if (!newLinkUrl) return;
    if (!detailedProspect?.organization?.id && !detailedProspect?.organization?.name) return;

    try {
      const result = await api.manageOrganizationLinks(
        detailedProspect.organization.id || detailedProspect.organization.name,
        'add',
        {
          platform: newLinkType,
          profile_url: newLinkUrl,
        }
      );

      if (result.success) {
        setNewLinkUrl('');
        fetchDetails();
      } else {
        alert(result.message || 'Failed to add link');
      }
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const removeLink = async (link: any) => {
    if (!confirm('Are you sure you want to remove this link?')) return;
    if (!detailedProspect?.organization?.id && !detailedProspect?.organization?.name) return;

    try {
      const result = await api.manageOrganizationLinks(
        detailedProspect.organization.id || detailedProspect.organization.name,
        'remove',
        {
          platform: link.platform,
          profile_url: link.link || link.profile_url,
        }
      );

      if (result.success) {
        fetchDetails();
      } else {
        alert(result.message || 'Failed to remove link');
      }
    } catch (error) {
      console.error('Error removing link:', error);
    }
  };

  // Other handlers
  const copyProspectLink = async () => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/prospects?openProspect=${prospect.id || prospect.name}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
        setShowOptionsMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const viewAllActivities = () => {
    router.push(`/activities?prospect=${prospect.id || prospect.name}`);
  };

  const viewContactCallLogs = (contactName: string) => {
    router.push(`/activities?company=${prospect.company_name}&contact=${contactName}`);
  };

  const toggleContactMenu = (contactId: string) => {
    setContactMenuOpen((prev) => ({
      ...prev,
      [contactId]: !prev[contactId],
    }));
  };

  // Check overview truncation
  const checkOverviewTruncation = () => {
    if (overviewElementRef.current) {
      setIsOverviewTruncated(
        overviewElementRef.current.scrollHeight > overviewElementRef.current.clientHeight
      );
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      setTimeout(() => {
        checkOverviewTruncation();
      }, 100);
    }
  }, [activeTab]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        setContactMenuOpen({});
        if (!target.closest('.relative')) {
          setShowOptionsMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Listen for activity updates
  useEffect(() => {
    const handleActivityCreated = () => {
      fetchScheduledActivities();
      if (activityTimelineRef.current) {
        activityTimelineRef.current.refresh();
      }
    };

    window.addEventListener('tallac:activity-created', handleActivityCreated);
    return () => window.removeEventListener('tallac:activity-created', handleActivityCreated);
  }, [fetchScheduledActivities]);

  if (!prospect) return null;

  const tabs = [
    { id: 'activity' as const, label: 'Activity' },
    { id: 'contacts' as const, label: 'Contacts', count: getContactCount() },
    { id: 'profile' as const, label: 'Company Profile' },
  ];

  const containerClass = mode === 'split' ? 'h-fit sticky top-4' : '';
  const bodyClass = 'overflow-y-auto';

  const leadInfo = useMemo(() => {
    const allContacts: any[] = [];

    if (displayProspect.primaryContact) {
      allContacts.push({
        ...displayProspect.primaryContact,
        is_primary: true,
      });
    }

    if (displayProspect.contacts) {
      allContacts.push(...displayProspect.contacts);
    }

    return {
      name: prospect.id || prospect.name || '',
      company_name: prospect.company_name || '',
      primary_contact: prospect.lead_name || '',
      phone: prospect.primary_phone || '',
      email: prospect.primary_email || '',
      territory: prospect.territory || '',
      contacts: allContacts,
    };
  }, [displayProspect, prospect]);

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-lg border-2 flex flex-col ${
        mode === 'popup' ? 'h-[90vh] min-h-[600px]' : 'min-h-screen'
      } ${getCardBorderClass(prospect.status)} ${containerClass}`}
    >
      {/* Prospect Header */}
      <div className={`border-b border-gray-700 flex-shrink-0 ${mode === 'split' ? 'p-4' : 'p-6'}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h1 className={`${mode === 'split' ? 'text-lg' : 'text-2xl'} font-bold text-white mb-1 truncate`}>
              {displayProspect.company_name || prospect.company_name || prospect.organization_name || 'No Company'}
            </h1>
            <p className={`${mode === 'split' ? 'text-sm' : 'text-base'} text-gray-400`}>
              {formatLocation(prospect.city, prospect.state)}
            </p>
            <p className={`${mode === 'split' ? 'text-sm' : 'text-base'} text-gray-400`}>
              {prospect.territory} {prospect.territory && prospect.industry ? '•' : ''} {prospect.industry}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showOptionsMenu && (
                  <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[1001] overflow-hidden">
                    <button
                      onClick={() => {
                        openAssignModal();
                        setShowOptionsMenu(false);
                      }}
                      className="sm:hidden w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                    >
                      <UserCog className="w-4 h-4" />
                      <span>Assign</span>
                    </button>
                    <hr className="sm:hidden border-gray-700" />
                    <button
                      onClick={copyProspectLink}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                      <span>{linkCopied ? 'Link copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                )}
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  title={mode === 'popup' ? 'Close' : 'Close details'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(prospect.status)}`}>
              {getStatusLabel(prospect.status)}
            </span>
          </div>
        </div>

        {/* Contact Info and Action Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start space-x-2">
            <User className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <p className={`${mode === 'split' ? 'text-base' : 'text-lg'} font-semibold text-white truncate`}>
                {displayProspect.primaryContact?.full_name || 'No Contact'}
              </p>
              <p className={`${mode === 'split' ? 'text-sm' : 'text-base'} text-gray-400 truncate`}>
                {displayProspect.primaryContact?.designation || 'Contact'}
              </p>
            </div>
          </div>

          {/* Primary Action Bar */}
          <div className="bg-gray-900/50 rounded-lg p-1 backdrop-blur-sm border border-gray-700/50">
            <div className={`grid gap-1 ${mode === 'split' ? 'grid-cols-3' : 'grid-cols-5 sm:grid-cols-6'}`}>
              <button
                onClick={openCallLogModal}
                disabled={isCallActive}
                className={`group relative flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium rounded-md transition-all duration-200 border ${
                  isCallActive
                    ? 'bg-gray-700/50 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-transparent hover:bg-green-600/20 text-gray-300 hover:text-green-400 border-transparent hover:border-green-600/30 hover:scale-105 active:scale-95'
                }`}
              >
                <Phone className={`relative z-10 ${mode === 'split' ? 'w-5 h-5' : 'w-5 h-5 sm:w-3.5 sm:h-3.5'}`} />
                <span className="relative z-10 hidden sm:inline">Call</span>
              </button>
              <button
                onClick={openActivityModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-blue-600/30"
              >
                <Calendar className={`w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10`} />
                <span className="relative z-10 hidden sm:inline">Schedule</span>
              </button>
              <button
                onClick={openNoteModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-purple-600/20 text-gray-300 hover:text-purple-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-purple-600/30"
              >
                <FileText className={`w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10`} />
                <span className="relative z-10 hidden sm:inline">Note</span>
              </button>
              <button
                onClick={openStatusModal}
                className="group relative flex items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-yellow-600/20 text-gray-300 hover:text-yellow-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-yellow-600/30"
              >
                <Settings className={`w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10`} />
                <span className="relative z-10 hidden sm:inline">Status</span>
              </button>
              {/* Assign Button (Hidden on Mobile) */}
              <button
                onClick={openAssignModal}
                className="hidden sm:flex group relative items-center justify-center gap-1.5 px-2 py-2.5 bg-transparent hover:bg-orange-600/20 text-gray-300 hover:text-orange-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-orange-600/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/5 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
                <UserCog className={`w-5 h-5 sm:w-3.5 sm:h-3.5 relative z-10`} />
                <span className="relative z-10 hidden sm:inline">Assign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
        <nav className="flex" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-3 text-xs font-medium border-b-2 transition-colors text-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white bg-gray-700'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content (Tabbed Interface) */}
      <div className={`bg-gray-800 flex-1 min-h-0 overflow-y-auto ${bodyClass}`}>
        {/* Tab 1: Activity */}
        {activeTab === 'activity' && (
          <div className={`${mode === 'split' ? 'p-4' : 'p-6'} space-y-4`}>
            {/* Scheduled Activities Section */}
            <div>
              <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white mb-3 flex items-center`}>
                <Calendar className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Scheduled
              </h3>
              <div className="space-y-2">
                {scheduledActivities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-700/30 rounded-md border border-gray-700 border-dashed">
                    <p className="text-xs">No upcoming activities</p>
                  </div>
                ) : (
                  scheduledActivities.map((activity) => (
                    <div
                      key={activity.id || activity.name}
                      className="bg-gray-700/50 rounded-md p-3 border-l-4 transition-all hover:bg-gray-700 border-gray-500"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {activity.priority === 'High' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                HIGH
                              </span>
                            )}
                            <h4 className="text-white font-medium text-sm truncate">
                              {activity.activity_type}
                              {activity.contact_name ? ` - ${activity.contact_name}` : ''}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatScheduledDate(activity.scheduled_date, activity.scheduled_time)}
                            </span>
                            {isOverdue(activity.scheduled_date, activity.scheduled_time) && (
                              <span className="text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded">
                                Overdue
                              </span>
                            )}
                          </div>
                          {activity.assigned_to && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <User className="w-3 h-3" />
                              {activity.assigned_to}
                            </div>
                          )}
                          {activity.description && (
                            <p className="text-xs text-gray-400 mt-2 italic truncate">{activity.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {activity.activity_type === 'Callback' ? (
                            <button
                              onClick={() => initiateActivityCall(activity)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Call
                            </button>
                          ) : (
                            <button
                              onClick={() => markActivityDone(activity)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Done
                            </button>
                          )}

                          <button
                            onClick={() => editActivity(activity)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                            title="Edit Activity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Timeline Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white flex items-center`}>
                  <Activity className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                  Recent Activity
                </h3>
                <button
                  onClick={viewAllActivities}
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                    mode === 'split' ? 'text-xs' : 'text-sm'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>View All</span>
                </button>
              </div>
              <ActivityTimelineCompact
                ref={activityTimelineRef}
                prospectId={prospect.id || prospect.name}
                onViewAll={viewAllActivities}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Contacts */}
        {activeTab === 'contacts' && (
          <div className={`${mode === 'split' ? 'p-4' : 'p-6'} space-y-4`}>
            <div className="flex justify-between items-center">
              <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white flex items-center`}>
                <Users className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Contacts ({getContactCount()})
              </h3>
              <button
                onClick={openAddContactModal}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-md transition-all border border-blue-600/30 hover:border-blue-600/50"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                <span>Add Contact</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Primary Contact */}
              {displayProspect.primaryContact && (
                <div className="bg-gray-700/50 rounded-md p-3 border-l-4 border-green-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={`${
                        mode === 'split' ? 'w-10 h-10' : 'w-12 h-12'
                      } rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0`}
                    >
                      <span className={mode === 'split' ? 'text-xs' : 'text-sm'}>
                        {getInitials(displayProspect.primaryContact?.full_name)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-white font-medium text-sm truncate">
                          {displayProspect.primaryContact?.full_name || 'No Name'}
                        </h4>
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getStatusBadgeClass(prospect.status)}`}>
                          {getStatusLabel(prospect.status)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mb-1">{displayProspect.primaryContact?.designation}</p>
                      {displayProspect.primaryContact?.preferred_call_time && (
                        <p className="text-gray-400 text-xs mb-2 italic">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {displayProspect.primaryContact.preferred_call_time}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button
                        onClick={() =>
                          initiateCall(
                            getPrimaryPhone(displayProspect.primaryContact),
                            displayProspect.primaryContact.full_name,
                            'primary'
                          )
                        }
                        disabled={isCallActive}
                        className={`p-2 rounded-md transition-colors ${
                          isCallActive
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                        title={isCallActive ? 'Call in progress' : 'Call'}
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => toggleContactMenu('primary')}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {contactMenuOpen['primary'] && (
                          <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[1002] overflow-hidden">
                            <button
                              onClick={() => {
                                openEditContactModal('primary', displayProspect.primaryContact);
                                toggleContactMenu('primary');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (onEmail) onEmail(prospect);
                                toggleContactMenu('primary');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email</span>
                            </button>
                            <button
                              onClick={() => {
                                viewContactCallLogs(displayProspect.primaryContact?.full_name || '');
                                toggleContactMenu('primary');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                            >
                              <Filter className="w-3.5 h-3.5" />
                              <span>Call Log</span>
                            </button>
                            <hr className="border-gray-700" />
                            <button
                              onClick={() => {
                                deleteContact('primary');
                                toggleContactMenu('primary');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                    {/* Phone Numbers */}
                    {displayProspect.primaryContact?.phone_nos && displayProspect.primaryContact.phone_nos.length > 0 ? (
                      <div className="space-y-1">
                        {displayProspect.primaryContact.phone_nos.map((phone: any, pIndex: number) => (
                          <div
                            key={pIndex}
                            onClick={() =>
                              initiateCall(phone.phone, displayProspect.primaryContact.full_name, 'primary')
                            }
                            className="flex items-center gap-2 text-gray-300 hover:text-white group/phone cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 flex-shrink-0 group-hover/phone:text-green-400 transition-colors" />
                            <span className="text-xs group-hover/phone:underline decoration-green-400/50">{phone.phone}</span>
                            {phone.is_primary_phone && (
                              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : displayProspect.primaryContact?.mobile_no ? (
                      <div
                        onClick={() =>
                          initiateCall(
                            displayProspect.primaryContact.mobile_no,
                            displayProspect.primaryContact.full_name,
                            'primary'
                          )
                        }
                        className="flex items-center gap-2 text-gray-300 hover:text-white group/phone cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0 group-hover/phone:text-green-400 transition-colors" />
                        <span className="text-xs group-hover/phone:underline decoration-green-400/50">
                          {displayProspect.primaryContact.mobile_no}
                        </span>
                      </div>
                    ) : null}

                    {/* Emails */}
                    {displayProspect.primaryContact?.email_ids && displayProspect.primaryContact.email_ids.length > 0 ? (
                      <div className="space-y-1">
                        {displayProspect.primaryContact.email_ids.map((email: any, eIndex: number) => (
                          <div
                            key={eIndex}
                            onClick={() => {
                              if (onEmail) onEmail({ ...prospect, email: email.email_id });
                            }}
                            className="flex items-center gap-2 text-gray-300 hover:text-white group/email cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 flex-shrink-0 group-hover/email:text-blue-400 transition-colors" />
                            <span className="text-xs truncate group-hover/email:underline decoration-blue-400/50">
                              {email.email_id}
                            </span>
                            {email.is_primary && (
                              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : displayProspect.primaryContact?.email_id ? (
                      <div
                        onClick={() => {
                          if (onEmail) onEmail({ ...prospect, email: displayProspect.primaryContact.email_id });
                        }}
                        className="flex items-center gap-2 text-gray-300 hover:text-white group/email cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 group-hover/email:text-blue-400 transition-colors" />
                        <span className="text-xs truncate group-hover/email:underline decoration-blue-400/50">
                          {displayProspect.primaryContact.email_id}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Additional Contacts */}
              {!displayProspect.primaryContact && (!displayProspect.contacts || displayProspect.contacts.length === 0) && (
                <div className="text-center py-8 text-gray-500 bg-gray-700/30 rounded-lg border border-gray-700 border-dashed">
                  <p>No contacts found</p>
                  <button onClick={openAddContactModal} className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium">
                    + Add Contact
                  </button>
                </div>
              )}

              {displayProspect.contacts?.map((contact: any) => (
                <div key={contact.id || contact.name} className="bg-gray-700/50 rounded-md p-3 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 bg-gray-600">
                      {getInitials(contact.full_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-white font-medium text-sm truncate">{contact.full_name}</h4>
                      </div>
                      <p className="text-gray-300 text-xs mb-1">{contact.designation || 'Contact'}</p>
                      {contact.preferred_call_time && (
                        <p className="text-gray-400 text-xs mb-2 italic">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {contact.preferred_call_time}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button
                        onClick={() => initiateCall(getPrimaryPhone(contact), contact.full_name, contact.id || contact.name)}
                        disabled={isCallActive}
                        className={`p-2 rounded-md transition-colors ${
                          isCallActive
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                        title={isCallActive ? 'Call in progress' : 'Call'}
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => toggleContactMenu(contact.id || contact.name)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {contactMenuOpen[contact.id || contact.name] && (
                          <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[1002] overflow-hidden">
                            <button
                              onClick={() => {
                                openEditContactModal(contact.id || contact.name, contact);
                                toggleContactMenu(contact.id || contact.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => toggleContactMenu(contact.id || contact.name)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email</span>
                            </button>
                            <button
                              onClick={() => {
                                viewContactCallLogs(contact.full_name);
                                toggleContactMenu(contact.id || contact.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                            >
                              <Filter className="w-3.5 h-3.5" />
                              <span>Call Log</span>
                            </button>
                            <hr className="border-gray-700" />
                            <button
                              onClick={() => {
                                markAsPrimary(contact.id || contact.name);
                                toggleContactMenu(contact.id || contact.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition-colors text-left"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span>Mark as Primary</span>
                            </button>
                            <hr className="border-gray-700" />
                            <button
                              onClick={() => {
                                deleteContact(contact.id || contact.name);
                                toggleContactMenu(contact.id || contact.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                    {/* Phone Numbers */}
                    {contact.phone_nos && contact.phone_nos.length > 0 ? (
                      <div className="space-y-1">
                        {contact.phone_nos.map((phone: any, pIndex: number) => (
                          <div
                            key={pIndex}
                            onClick={() => initiateCall(phone.phone, contact.full_name, contact.id || contact.name)}
                            className="flex items-center gap-2 text-gray-300 hover:text-white group/phone cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 flex-shrink-0 group-hover/phone:text-green-400 transition-colors" />
                            <span className="text-xs group-hover/phone:underline decoration-green-400/50">{phone.phone}</span>
                            {phone.is_primary_phone && (
                              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : contact.mobile_no ? (
                      <div
                        onClick={() => initiateCall(contact.mobile_no, contact.full_name, contact.id || contact.name)}
                        className="flex items-center gap-2 text-gray-300 hover:text-white group/phone cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0 group-hover/phone:text-green-400 transition-colors" />
                        <span className="text-xs group-hover/phone:underline decoration-green-400/50">{contact.mobile_no}</span>
                      </div>
                    ) : null}

                    {/* Emails */}
                    {contact.email_ids && contact.email_ids.length > 0 ? (
                      <div className="space-y-1">
                        {contact.email_ids.map((email: any, eIndex: number) => (
                          <div
                            key={eIndex}
                            onClick={() => {
                              if (onEmail) onEmail({ ...prospect, email: email.email_id });
                            }}
                            className="flex items-center gap-2 text-gray-300 hover:text-white group/email cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 flex-shrink-0 group-hover/email:text-blue-400 transition-colors" />
                            <span className="text-xs truncate group-hover/email:underline decoration-blue-400/50">
                              {email.email_id}
                            </span>
                            {email.is_primary && (
                              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : contact.email_id ? (
                      <div
                        onClick={() => {
                          if (onEmail) onEmail({ ...prospect, email: contact.email_id });
                        }}
                        className="flex items-center gap-2 text-gray-300 hover:text-white group/email cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 group-hover/email:text-blue-400 transition-colors" />
                        <span className="text-xs truncate group-hover/email:underline decoration-blue-400/50">
                          {contact.email_id}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Company Profile */}
        {activeTab === 'profile' && (
          <div className={`${mode === 'split' ? 'p-4' : 'p-6'} space-y-4`}>
            {/* Company Overview Section */}
            <div>
              <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white mb-3 flex items-center`}>
                <Building2 className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Overview
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <p
                  ref={overviewElementRef}
                  className={`text-gray-300 leading-relaxed text-xs ${showFullOverview ? '' : 'line-clamp-4'}`}
                >
                  {getCompanyOverview()}
                </p>
                {isOverviewTruncated && !showFullOverview && (
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
                <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white flex items-center`}>
                  <Share2 className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                  Social Profiles
                </h3>
                <button onClick={openManageLinksModal} className="text-xs text-blue-400 hover:text-blue-300">
                  Manage
                </button>
              </div>
              <div className="bg-gray-700/50 rounded-md p-3">
                {displayProspect.organization?.social_profiles?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {displayProspect.organization.social_profiles.map((profile: any, index: number) => (
                      <a
                        key={index}
                        href={ensureAbsoluteUrl(profile.profile_url || profile.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all duration-200 flex items-center gap-2 bg-gray-800/50"
                        title={profile.platform}
                      >
                        {profile.platform === 'Website' ? (
                          <Globe className="w-4 h-4" />
                        ) : profile.platform === 'LinkedIn' ? (
                          <Linkedin className="w-4 h-4" />
                        ) : (
                          <LinkIcon className="w-4 h-4" />
                        )}
                        <span className="text-xs">{profile.platform}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs italic text-center py-2">No social profiles added</div>
                )}
              </div>
            </div>

            {/* Key Details Section */}
            <div>
              <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white mb-3 flex items-center`}>
                <Info className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Key Details
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Industry:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.organization?.industry || prospect.industry || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Employee Size:</span>
                    <span className="text-gray-300 text-xs">{displayProspect.organization?.employee_size || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Revenue:</span>
                    <span className="text-gray-300 text-xs">{displayProspect.organization?.revenue || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div>
              <h3 className={`${mode === 'split' ? 'text-sm' : 'text-base'} font-semibold text-white mb-3 flex items-center`}>
                <Settings className={`${mode === 'split' ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
                Metadata
              </h3>
              <div className="bg-gray-700/50 rounded-md p-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Assigned to:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.assigned_to_name || displayProspect.assigned_to || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Assigned On:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.assigned_on ? new Date(displayProspect.assigned_on).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Created by:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.owner_name || displayProspect.owner || 'System'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Created on:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.creation ? new Date(displayProspect.creation).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Updated by:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.modified_by_name || displayProspect.modified_by || 'System'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Updated on:</span>
                    <span className="text-gray-300 text-xs">
                      {displayProspect.modified ? new Date(displayProspect.modified).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Modals */}
      {/* Activity Modal */}
      <TallacActivityModal
        show={showActivityModal}
        activity={selectedActivity}
        leadInfo={leadInfo}
        onClose={closeActivityModal}
        onSave={handleActivitySaved}
        onCancel={handleActivityCancelled}
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
                {(['New', 'Contacted', 'Interested', 'Proposal', 'Won', 'Lost'] as const).map((status) => {
                  const statusClassMap: Record<string, string> = {
                    new: 'status-btn-blue',
                    contacted: 'status-btn-purple',
                    interested: 'status-btn-yellow',
                    proposal: 'status-btn-orange',
                    won: 'status-btn-green',
                    lost: 'status-btn-red',
                  };
                  const statusClass = statusClassMap[status.toLowerCase()] || 'status-btn-blue';
                  const isCurrent = prospect.status?.toLowerCase() === status.toLowerCase();
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        saveStatus();
                      }}
                      className={`status-btn ${statusClass} ${isCurrent ? 'status-current' : ''}`}
                    >
                      <span className="relative z-10">{status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={closeStatusModal} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Assign Modal */}
      {showAssignModal && (
        <AssignRepresentativeModal
          show={showAssignModal}
          prospect={prospect}
          onClose={closeAssignModal}
          onAssign={assignToRep}
        />
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          show={showContactModal}
          mode={contactModalMode}
          organizationId={prospect.organization || detailedProspect?.organization?.id || detailedProspect?.organization?.name}
          contactData={editingContact}
          onClose={closeContactModal}
          onSave={saveContact}
        />
      )}

      {/* Manage Links Modal */}
      {showManageLinksModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeManageLinksModal}
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
              <button onClick={closeManageLinksModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Add New Link */}
              <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
                <h4 className="text-sm font-medium text-white mb-3">Add New Link</h4>

                {/* Quick Add Icons */}
                <div className="flex gap-3 mb-4">
                  {['Website', 'LinkedIn', 'Twitter', 'Facebook', 'Instagram'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => selectPlatform(platform)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        newLinkType === platform
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                      }`}
                      title={platform}
                    >
                      {platform === 'Website' ? (
                        <Globe className="w-5 h-5" />
                      ) : platform === 'LinkedIn' ? (
                        <Linkedin className="w-5 h-5" />
                      ) : (
                        <LinkIcon className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Smart Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      value={newLinkUrl}
                      onChange={(e) => {
                        setNewLinkUrl(e.target.value);
                        detectPlatform();
                      }}
                      type="text"
                      placeholder={getPlaceholder(newLinkType)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    onClick={addLink}
                    disabled={!newLinkUrl}
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
                  {displayProspect.organization?.social_profiles?.length ? (
                    displayProspect.organization.social_profiles.map((profile: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg border border-gray-600/30"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {profile.platform === 'Website' ? (
                            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          ) : profile.platform === 'LinkedIn' ? (
                            <Linkedin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium">{profile.platform}</p>
                            <p className="text-xs text-gray-400 truncate">{profile.profile_url || profile.link}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeLink(profile)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">No links added yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

