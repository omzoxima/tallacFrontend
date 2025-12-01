'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CallState {
  isCallActive: boolean;
  showOutcomeModal: boolean;
  currentCall: {
    prospectId: string;
    prospectName: string;
    phoneNumber: string;
    callLogId?: string;
    startedAt: number;
  } | null;
}

interface CallContextType {
  callState: CallState;
  startCall: (prospect: any, callLogId?: string) => void;
  endCall: () => void;
  clearCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    showOutcomeModal: false,
    currentCall: null,
  });

  const startCall = (prospect: any, callLogId?: string) => {
    const phoneNumber = prospect.primary_phone || prospect.phone || prospect.primary_mobile || '';
    setCallState({
      isCallActive: true,
      showOutcomeModal: false,
      currentCall: {
        prospectId: prospect.name || prospect.id,
        prospectName: prospect.company_name || prospect.lead_name || 'Unknown',
        phoneNumber,
        callLogId,
        startedAt: Date.now(),
      },
    });
  };

  // Called when user hangs up – keep call info for outcome modal
  const endCall = () => {
    setCallState((prev) => ({
      ...prev,
      isCallActive: false,
      showOutcomeModal: !!prev.currentCall,
    }));
  };

  // Called after outcome is saved / discarded
  const clearCall = () => {
    setCallState({
      isCallActive: false,
      showOutcomeModal: false,
      currentCall: null,
    });
  };

  return (
    <CallContext.Provider value={{ callState, startCall, endCall, clearCall }}>
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

