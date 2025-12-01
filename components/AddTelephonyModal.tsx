'use client';

import { useState } from 'react';
import { X, Phone, Info } from 'lucide-react';
import { showToast } from './Toast';

interface AddTelephonyModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTelephonyModal({ user, onClose, onSuccess }: AddTelephonyModalProps) {
  const [formData, setFormData] = useState({
    phone_number: '',
    line_type: '',
    carrier: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone_number.trim() || !formData.line_type.trim()) {
      setError('Phone number and line type are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      const payload = {
        telephony: {
          phone_number: formData.phone_number.trim(),
          line_type: formData.line_type.trim(),
          carrier: formData.carrier.trim() || null
        }
      };

      const response = await fetch(`${apiUrl}/api/users/${user.id || user.name}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add telephony line');
      }

      showToast('Telephony line added successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center px-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Add Telephony Line</p>
            <h2 className="text-xl font-semibold text-white">Add line for {user.full_name || user.name || user.email}</h2>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-gray-800"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Telephony Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-400" />
              Telephony Line Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  className="w-full bg-gray-900/60 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-2 placeholder-gray-500"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1.5">Line Type *</label>
                <select
                  value={formData.line_type}
                  onChange={(e) => handleChange('line_type', e.target.value)}
                  className="w-full bg-gray-900/60 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-3 py-2"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Mobile">Mobile</option>
                  <option value="VoIP">VoIP</option>
                  <option value="Landline">Landline</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1.5">Carrier/Provider</label>
              <input
                type="text"
                value={formData.carrier}
                onChange={(e) => handleChange('carrier', e.target.value)}
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-green-500 focus:border-green-500 placeholder-gray-500"
                placeholder="e.g., Twilio, AT&T, Verizon"
              />
            </div>
            <div className="mt-2 p-3 bg-gray-900/60 rounded-lg border border-gray-700/60">
              <p className="text-xs text-gray-300 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400" />
                <span>This will create a new telephony line and assign it to the user. The user can have multiple telephony lines.</span>
              </p>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Adding...' : 'Add Line'}
          </button>
        </div>
      </div>
    </div>
  );
}

