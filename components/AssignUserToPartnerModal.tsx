'use client';

import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import CustomDropdown from './CustomDropdown';
import { User, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface AssignUserToPartnerModalProps {
  partnerId: string;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function AssignUserToPartnerModal({
  partnerId,
  onClose,
  onSuccess,
}: AssignUserToPartnerModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'Territory Admin',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await api.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const roleOptions = [
    { value: 'Territory Admin', label: 'Territory Admin', color: '#f59e0b' },
    { value: 'Territory Manager', label: 'Territory Manager', color: '#8b5cf6' },
    { value: 'Business Coach', label: 'Business Coach', color: '#10b981' },
    { value: 'Tallac User', label: 'Sales User', color: '#3b82f6' },
  ];

  const userOptions = users.map((user) => ({
    label: `${user.full_name} (${user.email})`,
    value: user.email,
    user: user,
  }));

  const handleSubmit = async () => {
    if (!formData.email) {
      setErrorMessage('Please select a user');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const selectedUser = users.find((u) => u.email === formData.email);

    try {
      const result = await api.createTeamMember(partnerId, {
        email: formData.email,
        user_role: formData.role,
        first_name: selectedUser?.first_name || '',
        last_name: selectedUser?.last_name || '',
        mobile: selectedUser?.mobile_no || '',
      });
      if (result.success) {
        onSuccess(result.data);
      } else {
        setErrorMessage(result.message || 'Failed to assign user');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to assign user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 p-6">
      <button
        onClick={onClose}
        type="button"
        className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        type="button"
        className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Assigning...
          </>
        ) : (
          'Assign User'
        )}
      </button>
    </div>
  );

  return (
    <BaseModal
      title="Assign User to Partner"
      subtitle="Select an existing user to add to this partner's team"
      maxWidth="lg"
      onClose={onClose}
      footer={footer}
    >
      <div className="p-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select User <span className="text-red-400">*</span>
            </label>
            <CustomDropdown
              value={formData.email}
              options={userOptions}
              onChange={(val) => setFormData({ ...formData, email: val })}
              buttonClass="bg-gray-700 border-gray-600 text-gray-200"
              searchable={true}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role <span className="text-red-400">*</span>
            </label>
            <CustomDropdown
              value={formData.role}
              options={roleOptions}
              onChange={(val) => setFormData({ ...formData, role: val })}
              buttonClass="bg-gray-700 border-gray-600 text-gray-200"
              showColorDot={true}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error assigning user</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
}

