'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Phone, MapPin, Truck, Check,
  ThumbsUp, Clock, ThumbsDown, PhoneOff,
  Voicemail, AlertCircle, Ban, Building2, CheckCircle
} from 'lucide-react';

interface Outcome {
  value: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface CallModalProps {
  lead: any;
  onClose: () => void;
  onComplete: (leadName: string) => void;
}

export default function CallModal({ lead, onClose, onComplete }: CallModalProps) {
  const [show, setShow] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState({
    email: '',
    contactPerson: '',
    bestTimeToCall: '',
  });
  const [followUp, setFollowUp] = useState({
    callbackDate: '',
    preferredTime: '',
  });

  const startTime = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const outcomes: Outcome[] = [
    {
      value: 'Interested',
      label: 'Interested',
      description: 'Ready to proceed',
      icon: ThumbsUp,
      color: 'green',
    },
    {
      value: 'Callback Requested',
      label: 'Callback Requested',
      description: 'Schedule follow-up',
      icon: Clock,
      color: 'blue',
    },
    {
      value: 'Not Interested',
      label: 'Not Interested',
      description: 'Declined offer',
      icon: ThumbsDown,
      color: 'red',
    },
    {
      value: 'No Answer',
      label: 'No Answer',
      description: 'No one picked up',
      icon: PhoneOff,
      color: 'yellow',
    },
    {
      value: 'Left Voicemail',
      label: 'Left Voicemail',
      description: 'Message recorded',
      icon: Voicemail,
      color: 'blue',
    },
    {
      value: 'Wrong Number',
      label: 'Wrong Number',
      description: 'Invalid contact',
      icon: AlertCircle,
      color: 'gray',
    },
    {
      value: 'Do Not Call',
      label: 'Do Not Call',
      description: 'Requested removal',
      icon: Ban,
      color: 'red',
    },
    {
      value: 'No Longer in Business',
      label: 'No Longer in Business',
      description: 'Company closed',
      icon: Building2,
      color: 'gray',
    },
    {
      value: 'Already a Customer',
      label: 'Already a Customer',
      description: 'Existing client',
      icon: CheckCircle,
      color: 'green',
    },
  ];

  const showAdditionalInfo = selectedOutcome === 'Interested' || selectedOutcome === 'Callback Requested';

  const formattedTime = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    setShow(true);
    startTimer();

    return () => {
      stopTimer();
    };
  }, []);

  const startTimer = () => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const selectOutcome = (outcome: string) => {
    setSelectedOutcome(outcome);
  };

  const completeCall = async () => {
    try {
      const callData = {
        lead_name: lead.name,
        outcome: selectedOutcome,
        notes: callNotes,
        duration: elapsedSeconds,
        additional_info: showAdditionalInfo ? additionalInfo : null,
        follow_up: showAdditionalInfo ? followUp : null,
      };

      // TODO: Replace with actual API call
      console.log('Call data:', callData);

      onComplete(lead.name);
      setShow(false);
    } catch (error) {
      console.error('Error logging call:', error);
      alert('Failed to log call. Please try again.');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className={`bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl transition-all ${showAdditionalInfo ? 'max-h-[95vh]' : ''}`}>
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-semibold text-gray-900">Active Call in Progress</h2>
            <div className="text-lg font-bold text-blue-600 font-mono">{formattedTime}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 bg-white border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{lead.company_name}</h3>
          <div className="flex gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{lead.phone_number || 'No phone number'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{lead.city}, {lead.state}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="w-4 h-4 text-gray-500" />
              <span>{lead.truck_count || 0} trucks</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Call Outcome</h4>
          <div className="grid grid-cols-3 gap-4">
            {outcomes.map((outcome) => {
              const Icon = outcome.icon;
              return (
                <button
                  key={outcome.value}
                  onClick={() => selectOutcome(outcome.value)}
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg bg-white cursor-pointer transition-all text-center ${
                    selectedOutcome === outcome.value
                      ? `border-${outcome.color}-500 bg-${outcome.color}-50`
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-8 h-8 text-${outcome.color}-500`} />
                  <div className="w-full">
                    <div className="text-sm font-semibold text-gray-900 mb-1">{outcome.label}</div>
                    <div className="text-xs text-gray-600">{outcome.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-white border-t border-gray-200">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Call Notes</h4>
          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg text-sm font-sans resize-y outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            placeholder="Add notes about this call..."
            rows={4}
          />
        </div>

        {showAdditionalInfo && (
          <div className="border-t-2 border-dashed border-gray-300 animate-slideDown">
            <div className="p-8 bg-gray-50">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Capture Additional Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={additionalInfo.email}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-person" className="text-sm font-semibold text-gray-700">Contact Person</label>
                  <input
                    id="contact-person"
                    type="text"
                    value={additionalInfo.contactPerson}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, contactPerson: e.target.value })}
                    placeholder="John Doe"
                    className="p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <label htmlFor="best-time" className="text-sm font-semibold text-gray-700">Best Time to Call</label>
                  <input
                    id="best-time"
                    type="text"
                    value={additionalInfo.bestTimeToCall}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, bestTimeToCall: e.target.value })}
                    placeholder="e.g., Mornings, Afternoons, 2-4 PM"
                    className="p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-200">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Schedule Follow-up</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="callback-date" className="text-sm font-semibold text-gray-700">Callback Date</label>
                  <input
                    id="callback-date"
                    type="date"
                    value={followUp.callbackDate}
                    onChange={(e) => setFollowUp({ ...followUp, callbackDate: e.target.value })}
                    className="p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="preferred-time" className="text-sm font-semibold text-gray-700">Preferred Time</label>
                  <input
                    id="preferred-time"
                    type="time"
                    value={followUp.preferredTime}
                    onChange={(e) => setFollowUp({ ...followUp, preferredTime: e.target.value })}
                    className="p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 p-6 bg-gray-50 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-gray-300 rounded-lg text-base font-semibold text-gray-700 bg-white cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400"
          >
            Cancel Call
          </button>
          <button
            onClick={completeCall}
            disabled={!selectedOutcome}
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-green-600 rounded-lg text-base font-semibold text-white cursor-pointer transition-all hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
          >
            <Check className="w-5 h-5" />
            Complete Call
          </button>
        </div>
      </div>
    </div>
  );
}

