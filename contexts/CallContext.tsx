'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveCall {
  prospectId: string;
  prospectName: string;
  companyName: string;
  phone: string;
  startTime: Date;
  callLogId?: string;
  linkedActivityId?: string | null;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  startCall: (prospect: any, callLogId?: string) => void;
  endCall: () => void;
  getCallDuration: () => number;
  getFormattedDuration: () => string;
  isProspectOnCall: (prospectId: string) => boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const startCall = (prospect: any, callLogId?: string) => {
    setActiveCall({
      prospectId: prospect.id || prospect.name,
      prospectName: prospect.primary_contact || prospect.lead_name || 'Unknown',
      companyName: prospect.company_name || prospect.organization_name || 'Unknown',
      phone: prospect.primary_phone || prospect.phone || '',
      startTime: new Date(),
      callLogId,
      linkedActivityId: prospect.linkedActivityId || null,
    });
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const getCallDuration = (): number => {
    if (!activeCall) return 0;
    return Math.floor((new Date().getTime() - activeCall.startTime.getTime()) / 1000);
  };

  const getFormattedDuration = (): string => {
    const duration = getCallDuration();
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isProspectOnCall = (prospectId: string): boolean => {
    return activeCall?.prospectId === prospectId;
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        startCall,
        endCall,
        getCallDuration,
        getFormattedDuration,
        isProspectOnCall,
      }}
    >
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

