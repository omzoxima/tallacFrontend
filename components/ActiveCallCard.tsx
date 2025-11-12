'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

interface ActiveCallCardProps {
  prospectId: string;
  prospectName?: string;
  phoneNumber?: string;
  onHangUp?: () => void;
}

export default function ActiveCallCard({
  prospectId,
  prospectName,
  phoneNumber,
  onHangUp,
}: ActiveCallCardProps) {
  const { callState, endCall } = useCall();
  const [duration, setDuration] = useState(0);
  const [startTime] = useState(Date.now());

  const isActive = callState.isCallActive && callState.currentCall?.prospectId === prospectId;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    endCall();
    if (onHangUp) onHangUp();
  };

  if (!isActive) return null;

  const contactName = callState.currentCall?.prospectName || prospectName || 'Unknown Contact';
  const phone = callState.currentCall?.phoneNumber || phoneNumber || '';

  return (
    <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 border-2 border-green-500/50 rounded-lg p-4 mb-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
              <Phone className="w-5 h-5 text-white animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm truncate mb-0.5">
              {contactName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-green-300">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{phone}</span>
            </div>
            <p className="text-green-200/80 text-xs mt-0.5">
              Active call in progress...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-white font-mono font-bold text-lg leading-tight">
              {formatDuration(duration)}
            </div>
            <div className="text-green-300 text-xs">Duration</div>
          </div>
          <button
            onClick={handleHangUp}
            className="group relative p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

