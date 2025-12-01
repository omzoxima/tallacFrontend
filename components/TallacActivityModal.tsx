'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Calendar } from 'lucide-react';
import { showToast } from './Toast';

interface TallacActivityModalProps {
  show: boolean;
  activity?: any;
  leadInfo?: {
    name?: string;
    company_name?: string;
    primary_contact_name?: string;
  };
  onClose: () => void;
  onSave: (activity: any) => void;
}

export default function TallacActivityModal({
  show,
  activity,
  leadInfo,
  onClose,
  onSave,
}: TallacActivityModalProps) {
  const isEdit = !!activity?.name;

  const [formData, setFormData] = useState({
    activity_type: 'Callback',
    status: 'Open',
    priority: 'Medium',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    assigned_to: '',
    description: '',
    company: leadInfo?.company_name || '',
    contact_person: leadInfo?.primary_contact_name || '',
    reference_doctype: 'Tallac Lead',
    reference_docname: leadInfo?.name || '',
  });

  const [users, setUsers] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (show) {
      loadUsers();
      if (activity) {
        setFormData({
          activity_type: activity.activity_type || 'Callback',
          status: activity.status || 'Open',
          priority: activity.priority || 'Medium',
          scheduled_date: activity.scheduled_date || new Date().toISOString().split('T')[0],
          scheduled_time: activity.scheduled_time || '10:00',
          assigned_to: activity.assigned_to || '',
          description: activity.description || '',
          company: activity.company || leadInfo?.company_name || '',
          contact_person: activity.contact_person || leadInfo?.primary_contact_name || '',
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
          assigned_to: '',
          description: '',
          company: leadInfo?.company_name || '',
          contact_person: leadInfo?.primary_contact_name || '',
          reference_doctype: 'Tallac Lead',
          reference_docname: leadInfo?.name || '',
        });
      }
    }
  }, [show, activity, leadInfo]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/users?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers([
          { value: 'Administrator', label: 'Administrator' },
          ...data.map((user: any) => ({
            value: user.email || user.name,
            label: user.full_name || user.email || user.name,
          })),
        ]);
      }
    } catch {
      setUsers([
        { value: 'Administrator', label: 'Administrator' },
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSave = async () => {
    if (!formData.scheduled_date || !formData.scheduled_time || !formData.assigned_to) {
      showToast('Please fill in all required fields: Date, Time, and Assigned To', 'error');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      // Convert assigned_to (email) to assigned_to_id (user ID)
      let assignedToId = null;
      if (formData.assigned_to && formData.assigned_to !== 'Administrator') {
        const usersResponse = await fetch(`${apiUrl}/api/users?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const user = usersData.find((u: any) => u.email === formData.assigned_to || u.name === formData.assigned_to);
          if (user) {
            assignedToId = user.id;
          }
        }
      }

      // Get current user for created_by_id
      const currentUserResponse = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      let createdById = null;
      if (currentUserResponse.ok) {
        const currentUser = await currentUserResponse.json();
        createdById = currentUser.id;
      }

      const activityPayload = {
        activity_type: formData.activity_type,
        status: formData.status,
        priority: formData.priority,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        assigned_to_id: assignedToId,
        created_by_id: createdById,
        description: formData.description,
        reference_doctype: formData.reference_doctype,
        reference_docname: formData.reference_docname,
        title: `${formData.activity_type} - ${formData.company || 'Activity'}`,
      };

      if (isEdit) {
        // Update existing activity
        const response = await fetch(`${apiUrl}/api/activities/${activity.name}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to update activity');
        }
        showToast('Activity updated successfully!', 'success');
      } else {
        // Create new activity
        const response = await fetch(`${apiUrl}/api/activities`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityPayload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create activity');
        }
        showToast('Activity created successfully!', 'success');
      }

      onSave(activityPayload);
      onClose();
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && error.message) || 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    }
  };

  if (!show) return null;

  const activityTypeIcon = formData.activity_type === 'Callback' ? Phone : Calendar;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {activityTypeIcon === Phone ? (
                <Phone className={`w-5 h-5 ${formData.activity_type === 'Callback' ? 'text-cyan-400' : 'text-orange-400'}`} />
              ) : (
                <Calendar className={`w-5 h-5 ${formData.activity_type === 'Callback' ? 'text-cyan-400' : 'text-orange-400'}`} />
              )}
              {isEdit ? 'Edit' : 'Schedule'} Activity
            </h3>
            <p className="text-sm text-gray-400 mt-1">{formData.company || 'No company specified'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-4">
          {/* Activity Type Selection */}
          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Activity Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
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
                  type="button"
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

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Date *</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Time *</label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Assigned To *</label>
            <select
              required
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Notes</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about this task..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
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
    </div>
  );
}
