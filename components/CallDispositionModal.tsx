'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Voicemail, UserX, Ban, Clock, ChevronDown, CheckCircle2 } from 'lucide-react';

interface CallDispositionModalProps {
  show: boolean;
  contactName: string;
  duration: string;
  phoneNumber?: string;
  prospectId?: string;
  onClose: () => void;
  onMinimize: () => void;
  onSave: (result: any) => void;
}

interface Outcome {
  id: string;
  label: string;
  icon: any;
  colorBg: string;
  colorText: string;
  template: string;
}

const outcomes: Outcome[] = [
  {
    id: 'connected',
    label: 'Connected',
    icon: CheckCircle2,
    colorBg: 'bg-green-500',
    colorText: 'text-white',
    template: ''
  },
  {
    id: 'no_answer',
    label: 'No Answer',
    icon: Phone,
    colorBg: 'bg-yellow-500',
    colorText: 'text-white',
    template: 'No answer, will try again later.'
  },
  {
    id: 'voicemail',
    label: 'Voicemail',
    icon: Voicemail,
    colorBg: 'bg-cyan-500',
    colorText: 'text-white',
    template: 'Left voicemail regarding...'
  },
  {
    id: 'busy',
    label: 'Busy',
    icon: Clock,
    colorBg: 'bg-orange-500',
    colorText: 'text-white',
    template: 'Line busy.'
  },
  {
    id: 'wrong_number',
    label: 'Wrong Number',
    icon: UserX,
    colorBg: 'bg-red-500',
    colorText: 'text-white',
    template: 'Wrong number.'
  },
  {
    id: 'dnd',
    label: 'Do Not Disturb',
    icon: Ban,
    colorBg: 'bg-purple-500',
    colorText: 'text-white',
    template: 'Asked not to call again.'
  }
];

const smartTags = [
  'Gatekeeper Blocked', 'Sent Pricing', 'Asked for Email', 'Not Interested', 'Callback Requested'
];

export default function CallDispositionModal({
  show,
  contactName,
  duration,
  phoneNumber,
  prospectId,
  onClose,
  onMinimize,
  onSave
}: CallDispositionModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (show && !selectedOutcome) {
      setSelectedOutcome(outcomes[0]); // Default to Connected
    }
  }, [show, selectedOutcome]);

  const selectOutcome = (outcome: Outcome) => {
    setSelectedOutcome(outcome);
    if (!notes || outcomes.some(o => o.template === notes)) {
      setNotes(outcome.template);
    }
  };

  const addTag = (tag: string) => {
    const prefix = notes ? notes + ' ' : '';
    setNotes(prefix + `[${tag}]`);
  };

  const handleSave = () => {
    if (!selectedOutcome) return;
    if (selectedOutcome.id === 'connected' && !notes.trim()) return;

    const result = {
      outcome: selectedOutcome.id,
      notes: notes,
      duration: duration,
      nextStep: null,
      newStatus: null
    };

    onSave(result);
  };

  const isValid = selectedOutcome && (selectedOutcome.id !== 'connected' || notes.trim());

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm transition-opacity" onClick={onMinimize}></div>

      <div className="relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-lg flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 bg-gray-800/50">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              Record Call Outcome
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-gray-400">
              <span className="font-medium text-gray-300">{contactName}</span>
              <span>•</span>
              <span className="font-mono">{duration}</span>
            </div>
          </div>
          <button onClick={onMinimize} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Outcome</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {outcomes.map((outcome) => {
                const Icon = outcome.icon;
                return (
                  <button
                    key={outcome.id}
                    onClick={() => selectOutcome(outcome)}
                    className={`relative p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 group ${
                      selectedOutcome?.id === outcome.id
                        ? 'bg-gray-700/50 border-blue-500 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-gray-800'
                        : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${outcome.colorBg}`}>
                      <Icon className={`w-4 h-4 ${outcome.colorText}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-300">{outcome.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                Call Notes {selectedOutcome?.id === 'connected' && <span className="text-red-400">*</span>}
              </label>
            </div>

            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Enter call notes..."
              ></textarea>
            </div>

            <div className="flex flex-wrap gap-2">
              {smartTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-full text-xs text-gray-300 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onMinimize}
            className="text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition-colors"
          >
            Minimize
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-gray-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white shadow-lg transition-all flex items-center gap-1.5 sm:gap-2 ${
                isValid
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transform hover:scale-105'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">End Call & Save</span>
              <span className="xs:hidden">Save</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 1);
        }
      `}</style>
    </div>
  );
}

