'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

export default function ActiveCallCard() {
  const { callState, endCall } = useCall();
  const [duration, setDuration] = useState(0);

  const isActive = callState.isCallActive && !!callState.currentCall;

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

  const handleHangUp = () => {
    endCall();
  };

  if (!isActive) return null;

  const contactName = callState.currentCall?.prospectName || 'Unknown Contact';
  const phone = callState.currentCall?.phoneNumber || '';

  // Compact pill to sit on the right side of the header (after navigation)
  return (
    <div className="hidden md:flex items-center">
      <div className="flex items-center rounded-full bg-emerald-700 text-white shadow-md pl-4 pr-1 py-1">
        {/* Left: phone icon + name + phone */}
        <div className="flex items-center gap-2 pr-3">
          <Phone className="w-4 h-4" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold truncate max-w-xs">{contactName}</span>
            <span className="text-xs opacity-80 truncate max-w-xs">
              {phone || 'Active call in progress...'}
            </span>
          </div>
        </div>
        {/* Right: red duration pill with hangup icon */}
        <button
          onClick={handleHangUp}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold px-3 py-1.5 rounded-full transition-colors"
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{formatDuration(duration)}</span>
        </button>
      </div>
    </div>
  );
}

