'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CallState {
  isCallActive: boolean;
  showOutcomeModal: boolean;
  currentCall: {
    prospectId: string;
    prospectName: string;
    companyName?: string;
    phoneNumber: string;
    callLogId?: string;
    startedAt: number;
  } | null;
}

interface CallContextType {
  callState: CallState;
  startCall: (prospect: any, callLogId?: string) => void;
  endCall: () => void;
  closeModal: () => void;
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
        // Use contact/lead name as primary display name, fall back to company
        prospectName: prospect.lead_name || prospect.company_name || 'Unknown',
        companyName: prospect.company_name || undefined,
        phoneNumber,
        callLogId,
        startedAt: Date.now(),
      },
    });
  };

  // Called when user clicks end call button – show modal but keep call active
  const endCall = () => {
    setCallState((prev) => ({
      ...prev,
      isCallActive: true, // Keep call active
      showOutcomeModal: !!prev.currentCall,
    }));
  };

  // Called when X button is clicked – close modal but keep call active
  const closeModal = () => {
    setCallState((prev) => ({
      ...prev,
      showOutcomeModal: false,
    }));
  };

  // Called when Save/Discard is clicked – end call and close modal
  const clearCall = () => {
    setCallState({
      isCallActive: false,
      showOutcomeModal: false,
      currentCall: null,
    });
  };

  return (
    <CallContext.Provider value={{ callState, startCall, endCall, closeModal, clearCall }}>
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

