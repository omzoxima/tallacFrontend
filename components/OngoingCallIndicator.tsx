'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { api } from '@/lib/api';
import CallDispositionModal from './CallDispositionModal';

interface OngoingCallIndicatorProps {
  onClick?: () => void;
  onHangup?: () => void;
}

export default function OngoingCallIndicator({ onClick, onHangup }: OngoingCallIndicatorProps) {
  const { activeCall, getFormattedDuration, endCall } = useCall();
  const [formattedDuration, setFormattedDuration] = useState('00:00');
  const [showDispositionModal, setShowDispositionModal] = useState(false);

  useEffect(() => {
    if (!activeCall) return;

    const timer = setInterval(() => {
      setFormattedDuration(getFormattedDuration());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall, getFormattedDuration]);

  const openDispositionModal = () => {
    setShowDispositionModal(true);
  };

  const closeDispositionModal = () => {
    setShowDispositionModal(false);
  };

  const minimizeDispositionModal = () => {
    setShowDispositionModal(false);
  };

  const handleCallSave = async (result: any) => {
    console.log('Saving call log:', result);

    const logData = {
      outcome: result.outcome,
      notes: result.notes,
      duration: result.duration,
      next_step: result.nextStep,
      new_status: result.newStatus,
    };

    try {
      if (activeCall?.prospectId) {
        await api.createCallLog(activeCall.prospectId, logData);
      }

      // Mark linked activity as completed if it exists
      if (activeCall?.linkedActivityId) {
        try {
          await api.updateActivity(activeCall.linkedActivityId, { status: 'Completed' });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tallac:activity-updated', {
              detail: { activity: activeCall.linkedActivityId, status: 'Completed' }
            }));
            window.dispatchEvent(new Event('tallac:activity-created'));
          }
        } catch (err) {
          console.error('Failed to mark linked activity as completed:', err);
        }
      }

      if (onHangup) onHangup();
      endCall();
      closeDispositionModal();
    } catch (error: any) {
      console.error('Failed to save call log:', error);
      alert('Failed to save call log. Please try again.');
    }
  };

  if (!activeCall) return null;

  return (
    <>
      <div className="ongoing-call-indicator flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg transition-all duration-200 shadow-lg animate-pulse-subtle z-[10000]">
        <div
          onClick={onClick}
          className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 overflow-hidden"
        >
          <div className="relative flex-shrink-0">
            <Phone className="w-4 h-4 animate-wiggle" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold leading-tight truncate">{activeCall.prospectName}</span>
            <span className="text-[10px] opacity-90 leading-tight truncate">{activeCall.companyName}</span>
          </div>
        </div>

        <div className="relative ml-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDispositionModal();
            }}
            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 backdrop-blur-sm rounded-md transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 border border-red-500/50"
            title="Log Call"
          >
            <PhoneOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[10px] font-semibold font-mono w-[35px] text-center">{formattedDuration}</span>
          </button>
        </div>
      </div>

      <CallDispositionModal
        show={showDispositionModal}
        contactName={activeCall.prospectName || 'Unknown Contact'}
        duration={formattedDuration}
        phoneNumber={activeCall.phone}
        prospectId={activeCall.prospectId}
        onClose={closeDispositionModal}
        onMinimize={minimizeDispositionModal}
        onSave={handleCallSave}
      />

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

