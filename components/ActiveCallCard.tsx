'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import CallDispositionModal from './CallDispositionModal';
import { api } from '@/lib/api';

interface ActiveCallCardProps {
  prospectId: string;
  prospectName?: string;
  phoneNumber?: string;
  onHangup?: () => void;
  onCallStatus?: (status: any) => void;
}

export default function ActiveCallCard({
  prospectId,
  prospectName = '',
  phoneNumber = '',
  onHangup,
  onCallStatus,
}: ActiveCallCardProps) {
  const { activeCall, isProspectOnCall, getFormattedDuration, endCall } = useCall();
  const [formattedDuration, setFormattedDuration] = useState('00:00');
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = isProspectOnCall(prospectId);

  const contactName = activeCall?.prospectName || prospectName || 'Unknown Contact';

  useEffect(() => {
    if (isActive) {
      const updateDuration = () => {
        setFormattedDuration(getFormattedDuration());
      };
      updateDuration();
      timerRef.current = setInterval(updateDuration, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, getFormattedDuration]);

  const openDispositionModal = () => {
    setShowDispositionModal(true);
  };

  const closeDispositionModal = () => {
    setShowDispositionModal(false);
  };

  const handleCallSave = async (result: any) => {
    try {
      const logData = {
        prospect_id: prospectId,
        outcome: result.outcome,
        notes: result.notes,
        duration: activeCall ? Math.floor((new Date().getTime() - activeCall.startTime.getTime()) / 1000) : 0,
        next_step: result.nextStep,
        new_status: result.newStatus,
      };

      await api.createCallLog(prospectId, logData);

      if (onCallStatus) {
        onCallStatus({
          status: result.outcome,
          duration: logData.duration,
          notes: result.notes,
        });
      }

      endCall();

      if (onHangup) {
        onHangup();
      }

      closeDispositionModal();
    } catch (error) {
      console.error('Failed to save call log:', error);
      alert('Failed to save call log. Please try again.');
    }
  };

  if (!isActive) return null;

  return (
    <>
      <div className="active-call-card bg-gradient-to-r from-green-900/40 to-green-800/40 border-2 border-green-500/50 rounded-lg p-4 mb-4 shadow-lg backdrop-blur-sm relative z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center animate-pulse-subtle">
                <Phone className="w-5 h-5 text-white animate-wiggle" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm truncate mb-0.5">
                {contactName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-green-300">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{phoneNumber || activeCall?.phone || ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-white font-mono font-bold text-lg leading-tight">
                {formattedDuration}
              </div>
              <div className="text-green-300 text-xs">
                Duration
              </div>
            </div>

            <div className="relative">
              <button
                onClick={openDispositionModal}
                className="group relative px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2 text-white text-sm font-medium"
                title="Log Call"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Log Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CallDispositionModal
        show={showDispositionModal}
        contactName={contactName}
        duration={formattedDuration}
        phoneNumber={phoneNumber || activeCall?.phone || ''}
        prospectId={prospectId}
        onClose={closeDispositionModal}
        onMinimize={closeDispositionModal}
        onSave={handleCallSave}
      />
    </>
  );
}

