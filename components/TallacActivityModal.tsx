'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Calendar } from 'lucide-react';

interface TallacActivityModalProps {
  show: boolean;
  activity?: any;
  leadInfo?: {
    name?: string;
    company_name?: string;
    primary_contact?: string;
    phone?: string;
    email?: string;
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

  const defaultFormData = () => ({
    activity_type: 'Callback',
    status: 'Open',
    priority: 'Medium',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    assigned_to: 'Administrator',
    description: '',
    company: leadInfo?.company_name || '',
    contact_person: leadInfo?.primary_contact || '',
    reference_doctype: 'Tallac Lead',
    reference_docname: leadInfo?.name || '',
  });

  const [formData, setFormData] = useState(defaultFormData());

  useEffect(() => {
    if (show) {
      if (activity) {
        setFormData({ ...defaultFormData(), ...activity });
      } else {
        setFormData(defaultFormData());
      }
    }
  }, [show, activity, leadInfo]);

  const handleSave = () => {
    if (!formData.scheduled_date || !formData.scheduled_time || !formData.assigned_to) {
      alert('Please fill in all required fields: Date, Time, and Assigned To');
      return;
    }

    onSave({ ...formData });
    onClose();
  };

  if (!show) return null;

  const ActivityIcon = formData.activity_type === 'Callback' ? Phone : Calendar;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ActivityIcon
                className={`w-5 h-5 ${
                  formData.activity_type === 'Callback' ? 'text-cyan-400' : 'text-orange-400'
                }`}
              />
              {isEdit ? 'Edit' : 'Add'} Task
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {formData.company || 'No company specified'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Task Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                    formData.activity_type === 'Callback'
                      ? 'bg-cyan-600 text-white border-2 border-cyan-500'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent hover:border-cyan-500/30'
                  }`}
                  onClick={() => setFormData({ ...formData, activity_type: 'Callback' })}
                >
                  <Phone className="w-4 h-4" />
                  <span>Callback</span>
                </button>
                <button
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                    formData.activity_type === 'Appointment'
                      ? 'bg-orange-600 text-white border-2 border-orange-500'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent hover:border-orange-500/30'
                  }`}
                  onClick={() => setFormData({ ...formData, activity_type: 'Appointment' })}
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
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_time: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="assigned-to" className="text-sm font-medium text-gray-300 mb-2 block">
              Assigned To *
            </label>
            <select
              id="assigned-to"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Administrator">Administrator</option>
              <option value="user1@example.com">John Doe</option>
              <option value="user2@example.com">Jane Smith</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="text-sm font-medium text-gray-300 mb-2 block">
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="Add details about this task..."
            />
          </div>
        </div>

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
            {isEdit ? 'Update' : 'Create'} Task
          </button>
        </div>
      </div>
    </div>
  );
}

