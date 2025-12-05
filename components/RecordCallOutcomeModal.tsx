'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Phone, Voicemail, Clock, UserX, Ban, ChevronDown } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { showToast } from './Toast';

const OUTCOMES = [
  { key: 'Connected', label: 'Connected', icon: CheckCircle, color: '#10b981' },
  { key: 'No Answer', label: 'No Answer', icon: Phone, color: '#eab308' },
  { key: 'Voicemail', label: 'Voicemail', icon: Voicemail, color: '#06b6d4' },
  { key: 'Busy', label: 'Busy', icon: Clock, color: '#f97316' },
  { key: 'Wrong Number', label: 'Wrong Number', icon: UserX, color: '#ef4444' },
  { key: 'Do Not Disturb', label: 'Do Not Disturb', icon: Ban, color: '#a855f7' },
];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function RecordCallOutcomeModal() {
  const { callState, closeModal, clearCall } = useCall();
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [notes, setNotes] = useState('');
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
    if (isOpen) {
      setSelectedOutcome('');
      setNotes('');
    }
  }, [isOpen]);

  const canSave = selectedOutcome && notes.trim();

  const handleMinimize = () => {
    closeModal();
  };

  const handleDiscard = () => {
    clearCall();
  };

  const handleSave = async () => {
    if (!callState.currentCall || !canSave || saving) return;

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
      
      // Dispatch event to refresh ProspectDetails
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tallac:call-log-created'));
      }
      
      clearCall();
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && error.message) || 'Unable to save call outcome';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addQuickNote = (tag: string) => {
    setNotes(notes + (notes ? ' ' : '') + `[${tag}]`);
  };

  if (!isOpen || !callState.currentCall) return null;

  const { prospectName } = callState.currentCall;

  return (
    <>
      {/* Inject critical CSS with highest specificity */}
      <style dangerouslySetInnerHTML={{__html: `
        .call-modal-overlay-xyz123 {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: rgba(0, 0, 0, 0.8) !important;
          backdrop-filter: blur(4px) !important;
          padding: 16px !important;
        }
        .call-modal-content-xyz123 {
          background-color: #1f2937 !important;
          border-radius: 12px !important;
          border: 1px solid #374151 !important;
          max-width: 672px !important;
          width: 100% !important;
          max-height: 90vh !important;
          overflow-y: auto !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          position: relative !important;
          z-index: 10000 !important;
        }
      `}} />
      
      <div className="call-modal-overlay-xyz123">
        <div className="call-modal-content-xyz123"
        >
        {/* Header */}
        <div 
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #374151'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p 
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#9ca3af',
                  marginBottom: '4px'
                }}
              >
                RECORD CALL OUTCOME
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
                  {prospectName}
                </p>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                  • {formatDuration(elapsed)}
                </span>
              </div>
            </div>
            <button
              onClick={handleMinimize}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
              title="Minimize"
            >
              <ChevronDown style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Outcome */}
          <div style={{ marginBottom: '20px' }}>
            <p 
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#9ca3af',
                marginBottom: '12px'
              }}
            >
              OUTCOME
            </p>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}
            >
              {OUTCOMES.map((o) => {
                const isSelected = selectedOutcome === o.key;
                const Icon = o.icon;
                
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setSelectedOutcome(o.key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '16px 12px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid #3b82f6` : '2px solid #374151',
                      backgroundColor: '#111827',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#1f2937';
                        e.currentTarget.style.borderColor = '#4b5563';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#111827';
                        e.currentTarget.style.borderColor = '#374151';
                      }
                    }}
                  >
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: o.color
                      }}
                    >
                      <Icon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Notes */}
          <div style={{ marginBottom: '20px' }}>
            <p 
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#9ca3af',
                marginBottom: '8px'
              }}
            >
              CALL NOTES <span style={{ color: '#ef4444' }}>*</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter call notes..."
              style={{
                width: '100%',
                height: '128px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #374151',
                backgroundColor: '#111827',
                color: '#e5e7eb',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'Inter, sans-serif',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#374151';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Quick Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Gatekeeper Blocked', 'Sent Pricing', 'Asked for Email', 'Not Interested', 'Callback Requested'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addQuickNote(tag)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#9ca3af',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #374151'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
            <button
              type="button"
              onClick={handleMinimize}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              Minimize
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              Discard
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: canSave && !saving ? '#7c3aed' : '#374151',
              color: canSave && !saving ? '#ffffff' : '#6b7280',
              fontSize: '14px',
              fontWeight: 600,
              cursor: canSave && !saving ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
              opacity: canSave && !saving ? 1 : 0.5
            }}
            onMouseOver={(e) => {
              if (canSave && !saving) {
                e.currentTarget.style.backgroundColor = '#6d28d9';
              }
            }}
            onMouseOut={(e) => {
              if (canSave && !saving) {
                e.currentTarget.style.backgroundColor = '#7c3aed';
              }
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
