'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff, X } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

export default function ActiveCallCard() {
  const { callState, endCall, closeModal } = useCall();
  const [duration, setDuration] = useState(0);

  const isActive = callState.isCallActive && !!callState.currentCall;
  const showModal = callState.showOutcomeModal;

  // Timer for call duration
  useEffect(() => {
    if (!isActive || !callState.currentCall) return;

    const start = callState.currentCall.startedAt || Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, callState.currentCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  const contactName = callState.currentCall?.prospectName || 'Unknown Contact';
  const companyName = callState.currentCall?.companyName || '';

  const handleEndCall = () => {
    endCall(); // Opens modal, keeps call active
  };

  const handleCloseModal = () => {
    closeModal(); // Only closes modal, keeps call active
  };

  return (
    <div className="hidden md:flex items-center">
      <div 
        className="active-call-tile flex items-center gap-2 rounded-full px-3 py-2 shadow-lg border-[2px] max-w-[380px]"
      >
        {/* Phone icon */}
        <Phone className="w-4 h-4 flex-shrink-0" />

        {/* Contact and Company name */}
        <div className="flex flex-col justify-center min-w-0 flex-1 mr-1">
          <span className="text-sm font-bold truncate leading-tight block max-w-full" title={contactName}>
            {contactName}
          </span>
          {companyName && (
            <span className="text-xs truncate font-medium leading-tight opacity-90 block max-w-full" title={companyName}>
              {companyName}
            </span>
          )}
        </div>

        {/* End Call button OR Close Modal button */}
        {showModal ? (
          // Show X button when modal is open - only closes modal, keeps call active
          <button
            onClick={handleCloseModal}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:opacity-80 flex-shrink-0"
            style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          // Show End Call button with timer when modal is not open
        <button
            onClick={handleEndCall}
            className="active-call-btn-red flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs transition-all shadow-md hover:shadow-lg flex-shrink-0 border-[2px]"
          title="End Call"
        >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{formatDuration(duration)}</span>
        </button>
        )}
      </div>
    </div>
  );
}
