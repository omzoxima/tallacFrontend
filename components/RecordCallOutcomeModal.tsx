'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Phone, PhoneOff, Voicemail, Ban, AlertCircle } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { showToast } from './Toast';

const OUTCOMES = [
  { key: 'Connected', label: 'Connected' },
  { key: 'No Answer', label: 'No Answer' },
  { key: 'Voicemail', label: 'Voicemail' },
  { key: 'Busy', label: 'Busy' },
  { key: 'Wrong Number', label: 'Wrong Number' },
  { key: 'Do Not Disturb', label: 'Do Not Disturb' },
];

const QUICK_TAGS = [
  'Gatekeeper Blocked',
  'Sent Pricing',
  'Asked for Email',
  'Not Interested',
  'Callback Requested',
];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function RecordCallOutcomeModal() {
  const { callState, clearCall } = useCall();
  const [selectedOutcome, setSelectedOutcome] = useState<string>('Connected');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const isOpen = callState.showOutcomeModal && !!callState.currentCall;

  useEffect(() => {
    if (!isOpen || !callState.currentCall) return;

    const start = callState.currentCall.startedAt || Date.now();
    const initialElapsed = Math.floor((Date.now() - start) / 1000);
    setElapsed(initialElapsed >= 0 ? initialElapsed : 0);

    const interval = setInterval(() => {
      const val = Math.floor((Date.now() - start) / 1000);
      setElapsed(val >= 0 ? val : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, callState.currentCall]);

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setSelectedOutcome('Connected');
      setNotes('');
      setTags([]);
    }
  }, [isOpen]);

  const canSave = useMemo(() => {
    return !!selectedOutcome && notes.trim().length > 0;
  }, [selectedOutcome, notes]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleClose = () => {
    clearCall();
  };

  const handleDiscard = () => {
    clearCall();
  };

  const handleSave = async () => {
    if (!callState.currentCall) return;
    if (!canSave || saving) return;

    try {
      setSaving(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const payload = {
        lead_id: callState.currentCall.prospectId,
        prospect_name: callState.currentCall.prospectName,
        phone_number: callState.currentCall.phoneNumber,
        outcome: selectedOutcome,
        notes: notes.trim(),
        tags,
        duration_seconds: elapsed,
      };

      const response = await fetch(`${apiUrl}/api/call-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save call outcome');
      }

      showToast('Call outcome recorded successfully', 'success');
      clearCall();
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && error.message) || 'Unable to save call outcome';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !callState.currentCall) return null;

  const { prospectName } = callState.currentCall;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full mt-6 mb-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">RECORD CALL OUTCOME</p>
            <p className="text-sm sm:text-base font-medium text-white mt-1 truncate">{prospectName}</p>
            <p className="text-xs text-gray-400 mt-0.5">• {formatDuration(elapsed)}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5 space-y-6">
          {/* Outcome */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-3 tracking-wide">OUTCOME</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {OUTCOMES.map((o) => {
                const isSelected = selectedOutcome === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setSelectedOutcome(o.key)}
                    className={`flex flex-col justify-center items-center gap-2 rounded-xl px-4 py-4 border transition-all duration-150 ${
                      isSelected
                        ? 'bg-gray-800 border-blue-500 ring-2 ring-blue-400'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-900/60 text-white">
                      {o.key === 'Connected' && <Phone className="w-4 h-4" />}
                      {o.key === 'No Answer' && <PhoneOff className="w-4 h-4" />}
                      {o.key === 'Voicemail' && <Voicemail className="w-4 h-4" />}
                      {o.key === 'Busy' && <AlertCircle className="w-4 h-4" />}
                      {o.key === 'Wrong Number' && <AlertCircle className="w-4 h-4" />}
                      {o.key === 'Do Not Disturb' && <Ban className="w-4 h-4" />}
                    </span>
                    <span className="text-sm font-medium text-gray-100">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-2 tracking-wide">
              CALL NOTES <span className="text-red-500">*</span>
            </p>
            <textarea
              className="w-full min-h-[140px] bg-gray-900/70 border border-blue-500 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              placeholder="Enter call notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-gray-100 text-gray-900 border-gray-400'
                      : 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800 bg-gray-900 rounded-b-2xl">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <button
              type="button"
              onClick={handleClose}
              className="hover:text-white"
            >
              Minimize
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="hover:text-red-400"
            >
              Discard
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              canSave && !saving
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PhoneOff className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}


