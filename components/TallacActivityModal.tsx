'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Calendar } from 'lucide-react';
import BaseModal from './BaseModal';
import CustomDropdown from './CustomDropdown';
import { api } from '@/lib/api';

interface TallacActivityModalProps {
  show: boolean;
  activity?: any;
  leadInfo?: any;
  onClose: () => void;
  onSave: (activityData: any) => void;
  onCancel?: (activityData: any) => void;
}

export default function TallacActivityModal({
  show,
  activity,
  leadInfo,
  onClose,
  onSave,
  onCancel,
}: TallacActivityModalProps) {
  const isEdit = !!activity?.id || !!activity?.name;
  
  const [formData, setFormData] = useState({
    activity_type: 'Callback',
    status: 'Open',
    priority: 'Medium',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    assigned_to: 'Administrator',
    contact_name: leadInfo?.primary_contact || '',
    description: '',
    company: leadInfo?.company_name || '',
    contact_person: leadInfo?.primary_contact || '',
    reference_doctype: 'Tallac Lead',
    reference_docname: leadInfo?.name || '',
  });

  const [users, setUsers] = useState<any[]>([]);

  const contactOptions = useMemo(() => {
    const contacts = leadInfo?.contacts || [];
    return contacts.map((c: any) => ({
      value: c.full_name,
      label: c.full_name,
      subLabel: c.designation || '',
    }));
  }, [leadInfo]);

  useEffect(() => {
    if (show) {
      fetchUsers();
      if (activity) {
        setFormData({
          activity_type: activity.activity_type || 'Callback',
          status: activity.status || 'Open',
          priority: activity.priority || 'Medium',
          scheduled_date: activity.scheduled_date || new Date().toISOString().split('T')[0],
          scheduled_time: activity.scheduled_time || '10:00',
          assigned_to: activity.assigned_to || 'Administrator',
          contact_name: activity.contact_name || leadInfo?.primary_contact || '',
          description: activity.description || '',
          company: activity.company || leadInfo?.company_name || '',
          contact_person: activity.contact_person || leadInfo?.primary_contact || '',
          reference_doctype: activity.reference_doctype || 'Tallac Lead',
          reference_docname: activity.reference_docname || leadInfo?.name || '',
        });
      } else {
        setFormData({
          activity_type: 'Callback',
          status: 'Open',
          priority: 'Medium',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '10:00',
          assigned_to: 'Administrator',
          contact_name: leadInfo?.primary_contact || '',
          description: '',
          company: leadInfo?.company_name || '',
          contact_person: leadInfo?.primary_contact || '',
          reference_doctype: 'Tallac Lead',
          reference_docname: leadInfo?.name || '',
        });
      }
    }
  }, [show, activity, leadInfo]);

  const fetchUsers = async () => {
    try {
      const territory = leadInfo?.territory;
      const result = await api.getUsersForAssignment(territory);
      if (result.success && result.data) {
        const userOptions = result.data.map((u: any) => ({
          value: u.email || u.name,
          label: u.full_name || u.first_name || u.email,
        }));
        
        if (formData.assigned_to && !userOptions.find((u: any) => u.value === formData.assigned_to)) {
          if (formData.assigned_to === 'Administrator') {
            userOptions.unshift({ value: 'Administrator', label: 'Administrator' });
          }
        }
        
        setUsers(userOptions);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
      setUsers([{ value: 'Administrator', label: 'Administrator' }]);
    }
  };

  const handleSave = () => {
    if (!formData.scheduled_date || !formData.scheduled_time || !formData.assigned_to) {
      alert('Please fill in all required fields: Date, Time, and Assigned To');
      return;
    }

    onSave({ ...formData, name: activity?.name || activity?.id });
    onClose();
  };

  const handleCancelActivity = () => {
    if (onCancel) {
      onCancel({ ...formData, name: activity?.name || activity?.id });
    }
    onClose();
  };

  if (!show) return null;

  return (
    <BaseModal
      title={isEdit ? 'Edit Activity' : 'Schedule Activity'}
      subtitle={formData.company || 'No company specified'}
      maxWidth="lg"
      onClose={onClose}
      footer={
        <div className={`flex items-center p-6 bg-gray-800 border-t border-gray-700 ${isEdit ? 'justify-between' : 'justify-end'}`}>
          {isEdit && (
            <button
              onClick={handleCancelActivity}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium border border-red-600/30 hover:border-red-600/50"
            >
              Cancel Activity
            </button>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                formData.activity_type === 'Callback'
                  ? 'bg-cyan-600 hover:bg-cyan-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isEdit ? 'Update' : 'Schedule'}
            </button>
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        {!isEdit && (
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Activity Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, activity_type: 'Callback' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                  formData.activity_type === 'Callback'
                    ? 'bg-cyan-600 text-white border-2 border-cyan-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent hover:border-cyan-500/30'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Callback</span>
              </button>
              <button
                onClick={() => setFormData({ ...formData, activity_type: 'Appointment' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                  formData.activity_type === 'Appointment'
                    ? 'bg-orange-600 text-white border-2 border-orange-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent hover:border-orange-500/30'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Appointment</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="scheduled-date" className="text-sm font-medium text-gray-300 mb-2 block">
              Date *
            </label>
            <input
              id="scheduled-date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="scheduled-time" className="text-sm font-medium text-gray-300 mb-2 block">
              Time *
            </label>
            <input
              id="scheduled-time"
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Contact Person</label>
          <CustomDropdown
            value={formData.contact_name}
            options={contactOptions}
            onChange={(value) => setFormData({ ...formData, contact_name: value })}
            buttonClass="bg-gray-800 border-gray-700 text-white hover:border-gray-600"
            showColorDot={false}
            showCheckmark={true}
            searchable={true}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Assigned To *</label>
          <CustomDropdown
            value={formData.assigned_to}
            options={users}
            onChange={(value) => setFormData({ ...formData, assigned_to: value })}
            buttonClass="bg-gray-800 border-gray-700 text-white hover:border-gray-600"
            showColorDot={false}
            showCheckmark={true}
            searchable={true}
          />
        </div>

        <div>
          <label htmlFor="notes" className="text-sm font-medium text-gray-300 mb-2 block">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            placeholder="Add details about this task..."
          />
        </div>
      </div>
    </BaseModal>
  );
}

