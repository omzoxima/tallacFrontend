'use client';

import React from 'react';
import Tooltip from './Tooltip';

interface Prospect {
  id?: string;
  name?: string;
  company_name?: string;
  organization_name?: string;
  city?: string;
  state?: string;
  industry?: string;
  lead_name?: string;
  title?: string;
  status?: string;
  queue_status?: string;
  queue_message?: string;
  contact_path?: Array<{ name: string; status: string }>;
}

interface ProspectCardProps {
  prospect: Prospect;
  showCheckbox?: boolean;
  isSelected?: boolean;
  isActive?: boolean;
  onClick?: (prospect: Prospect) => void;
  onToggleSelection?: (prospectId: string) => void;
  onLogCall?: (prospect: Prospect) => void;
  onScheduleActivity?: (prospect: Prospect) => void;
  onChangeStatus?: (prospect: Prospect) => void;
}

export default function ProspectCard({
  prospect,
  showCheckbox = false,
  isSelected = false,
  isActive = false,
  onClick,
  onToggleSelection,
  onLogCall,
  onScheduleActivity,
  onChangeStatus,
}: ProspectCardProps) {
  const status = (prospect.status || 'new').toLowerCase();

  const borderClass = {
    proposal: 'border-transparent hover:border-orange-500',
    contacted: 'border-transparent hover:border-blue-500',
    interested: 'border-transparent hover:border-yellow-500',
    lost: 'border-red-600 opacity-70',
    won: 'border-transparent hover:border-green-500',
    new: 'border-transparent hover:border-blue-500'
  }[status] || 'border-transparent hover:border-blue-500';

  const statusBadgeClass = {
    proposal: 'bg-orange-600/20 text-orange-300',
    contacted: 'bg-purple-600/20 text-purple-300',
    interested: 'bg-yellow-600/20 text-yellow-300',
    lost: 'bg-red-700/20 text-red-300',
    won: 'bg-green-600/20 text-green-300',
    new: 'bg-blue-600/20 text-blue-300'
  }[status] || 'bg-gray-600/20 text-gray-300';

  const statusLabel = {
    proposal: 'Proposal',
    contacted: 'Contacted',
    interested: 'Interested',
    lost: 'Lost',
    won: 'Won',
    new: 'New'
  }[status] || 'New';

  const queueStatusClass = {
    overdue: 'text-red-400',
    today: 'text-orange-400',
    scheduled: 'text-indigo-300'
  }[prospect.queue_status || ''] || 'text-gray-400';

  const getQueueMessage = (queueStatus?: string) => {
    const messageMap: Record<string, string> = {
      overdue: 'Overdue: Action required',
      today: 'Due Today: Action required',
      scheduled: 'Scheduled task'
    };
    return messageMap[queueStatus || ''] || '';
  };

  const getContactPathClass = (contactStatus?: string) => {
    const statusMap: Record<string, string> = {
      proposal: 'bg-orange-600 text-white',
      contacted: 'bg-blue-600 text-white',
      interested: 'bg-yellow-600 text-white',
      lost: 'bg-red-600 text-white',
      won: 'bg-green-600 text-white',
      new: 'bg-gray-500 text-white'
    };
    return statusMap[(contactStatus || 'new').toLowerCase()] || 'bg-gray-500 text-white';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(/[\s@.]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={() => onClick?.(prospect)}
      className={`bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 relative cursor-pointer ${borderClass} ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${isActive && !isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection?.(prospect.name || prospect.id || '')}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 h-5 w-5 rounded bg-gray-900/50 border-gray-500 text-blue-500 focus:ring-blue-600 z-10 cursor-pointer"
        />
      )}

      <div className="p-4">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-bold text-white truncate pr-2">
            {prospect.company_name || prospect.organization_name || 'No Company'}
          </h4>
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadgeClass}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          {(prospect.city || prospect.state) && (
            <p className="flex items-center">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span className="ml-1.5">
                {prospect.city}{prospect.state ? `, ${prospect.state}` : ''}
              </span>
            </p>
          )}
          {prospect.industry && (
            <p className="flex items-center">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <span className="ml-1.5">{prospect.industry}</span>
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 border-b border-gray-700 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <div className="ml-1.5">
              <p className="text-base font-medium text-white">{prospect.lead_name || 'No Contact'}</p>
              <p className="text-sm text-gray-400">{prospect.title || 'Contact'}</p>
            </div>
          </div>
          {prospect.contact_path && prospect.contact_path.length > 0 && (
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="h-5"></div>
              <div className="flex items-center justify-end -space-x-2">
                {prospect.contact_path.slice(0, 3).map((contact, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold ${getContactPathClass(contact.status)}`}
                    title={`${contact.name} - ${contact.status}`}
                  >
                    {getInitials(contact.name)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {prospect.queue_status && prospect.queue_status !== 'none' && (
          <p className={`text-sm flex items-center ${queueStatusClass}`}>
            {prospect.queue_status === 'scheduled' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
              </svg>
            )}
            <span className="ml-1.5 font-medium">
              {prospect.queue_message || getQueueMessage(prospect.queue_status)}
            </span>
          </p>
        )}
      </div>

      <div className="p-2 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50 mt-auto">
        <div className="grid grid-cols-3 gap-1">
          <Tooltip text="Log Call">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogCall?.(prospect);
              }}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2 bg-transparent hover:bg-green-600/20 text-gray-300 hover:text-green-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-green-600/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 via-green-600/5 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span className="relative z-10 hidden sm:inline">Call</span>
            </button>
          </Tooltip>
          <Tooltip text="Schedule Activity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScheduleActivity?.(prospect);
              }}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2 bg-transparent hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-blue-600/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span className="relative z-10 hidden sm:inline">Schedule</span>
            </button>
          </Tooltip>
          <Tooltip text="Change Status">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus?.(prospect);
              }}
              className="group relative flex items-center justify-center gap-1.5 px-2 py-2 bg-transparent hover:bg-yellow-600/20 text-gray-300 hover:text-yellow-400 text-xs font-medium rounded-md transition-all duration-200 border border-transparent hover:border-yellow-600/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 via-yellow-600/5 to-yellow-600/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span className="relative z-10 hidden sm:inline">Status</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

