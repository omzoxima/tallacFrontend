'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

interface RescheduleModalProps {
  callback: any;
  onClose: () => void;
  onReschedule: (callbackName: string, newDate: string, newTime: string, reason: string) => void;
}

export default function RescheduleModal({ callback, onClose, onReschedule }: RescheduleModalProps) {
  const [show, setShow] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setShow(true);
    setNewDate(callback.callback_date || '');
    setNewTime(callback.preferred_time || callback.callback_time || '');
  }, [callback]);

  const minDate = new Date().toISOString().split('T')[0];

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleReschedule = () => {
    onReschedule(callback.name || callback.id, newDate, newTime, reason);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reschedule Callback</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{callback.company_name}</h3>
            <p className="text-gray-600 text-sm">{callback.city}, {callback.state}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Current Schedule:</div>
            <div className="text-base font-semibold text-gray-900">
              {formatDate(callback.callback_date)}
              {callback.preferred_time && ` at ${formatTime(callback.preferred_time)}`}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="new-date" className="block text-sm font-semibold text-gray-700 mb-2">
                New Callback Date
              </label>
              <input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={minDate}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="new-time" className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred Time
              </label>
              <input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Rescheduling (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Customer requested different time..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100 font-sans resize-y"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 p-6 bg-gray-50 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-gray-300 rounded-lg text-base font-semibold text-gray-700 bg-white cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!newDate}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-600 rounded-lg text-base font-semibold text-white cursor-pointer transition-all hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
          >
            <Calendar className="w-5 h-5" />
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

