'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

export default function ActiveCallCard() {
  const { callState, endCall } = useCall();
  const [duration, setDuration] = useState(0);

  const isActive = callState.isCallActive && !!callState.currentCall;

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
  const phone = callState.currentCall?.phoneNumber || '';

  const subtitle = companyName || phone || 'Active call in progress...';

  const handleHangUp = () => {
    endCall();
  };

  // Simple pill: full green background, white text, red end-call button
  return (
    <div className="hidden md:flex items-center">
      <div className="flex items-center gap-3 rounded-full bg-emerald-700 text-white shadow-md pl-4 pr-2 py-2 min-w-[340px]">
        {/* Left: phone icon */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-emerald-400/70">
          <Phone className="w-4 h-4 text-white" />
        </div>

        {/* Middle: name + company */}
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-sm font-semibold truncate">{contactName}</span>
          <span className="text-xs opacity-90 truncate">{subtitle}</span>
        </div>

        {/* Right: red duration pill with hangup icon */}
        <button
          onClick={handleHangUp}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold px-4 py-1.5 rounded-full transition-colors"
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{formatDuration(duration)}</span>
        </button>
      </div>
    </div>
  );
}

