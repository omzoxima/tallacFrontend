'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CallState {
  isCallActive: boolean;
  currentCall: {
    prospectId: string;
    prospectName: string;
    phoneNumber: string;
    callLogId: string;
  } | null;
}

interface CallContextType {
  callState: CallState;
  startCall: (prospect: any, callLogId: string) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    currentCall: null,
  });

  const startCall = (prospect: any, callLogId: string) => {
    setCallState({
      isCallActive: true,
      currentCall: {
        prospectId: prospect.name || prospect.id,
        prospectName: prospect.company_name || prospect.lead_name || 'Unknown',
        phoneNumber: prospect.primary_phone || prospect.phone || '',
        callLogId,
      },
    });
  };

  const endCall = () => {
    setCallState({
      isCallActive: false,
      currentCall: null,
    });
  };

  return (
    <CallContext.Provider value={{ callState, startCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}

