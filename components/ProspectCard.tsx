'use client';

import { memo } from 'react';

interface ProspectCardProps {
  prospect: any;
  isSelected: boolean;
  isBulkSelectMode: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClick: () => void;
  getCardBorderClass: (status?: string) => string;
  getStatusBadgeClass: (status?: string) => string;
  getStatusLabel: (status?: string) => string;
  getQueueStatusClass: (queueStatus?: string) => string;
  getContactPathClass: (status: string) => string;
  getInitials: (name: string) => string;
  getProspectGridClass: () => string;
}

const ProspectCard = memo(function ProspectCard({
  prospect,
  isSelected,
  isBulkSelectMode,
  isActive,
  onSelect,
  onClick,
  getCardBorderClass,
  getStatusBadgeClass,
  getStatusLabel,
  getQueueStatusClass,
  getContactPathClass,
  getInitials,
  getProspectGridClass,
}: ProspectCardProps) {
  return (
    <div
      key={prospect.id || prospect.name}
      onClick={onClick}
      className={`bg-gray-800 dark:bg-gray-800 bg-white rounded-lg shadow-lg flex flex-col transition-all duration-200 hover:shadow-xl border-2 cursor-pointer w-full relative ${
        getCardBorderClass(prospect.status)
      } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-700 dark:border-gray-700 border-gray-200'} ${
        isActive ? 'ring-2 ring-green-500 border-green-500' : ''
      }`}
    >
      {isBulkSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(prospect.name || prospect.id);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-4 right-4 h-5 w-5 rounded bg-gray-900/50 border-gray-500 text-blue-500 focus:ring-blue-600 z-20 cursor-pointer"
          style={{ zIndex: 20 }}
        />
      )}

      <div className="p-4">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-bold text-white dark:text-white text-gray-900 truncate pr-2">
            {prospect.company_name || 'No Company'}
          </h4>
          <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(prospect.status)}`}>
            {getStatusLabel(prospect.status)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400 dark:text-gray-400 text-gray-600">
          {prospect.city && (
            <p className="flex items-center">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span className="ml-1.5">
                {prospect.city}
                {prospect.state ? `, ${prospect.state}` : ''}
              </span>
            </p>
          )}
          {prospect.industry && (
            <p className="flex items-center">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1 4h1"></path>
              </svg>
              <span className="ml-1.5">{prospect.industry}</span>
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 border-b border-gray-700 dark:border-gray-700 border-gray-200 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <svg className="w-4 h-4 dark:text-gray-400 text-gray-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <div className="ml-1.5">
              <p className="text-base font-medium text-white dark:text-white text-gray-900">{prospect.lead_name || 'No Contact'}</p>
              <p className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">{prospect.title || 'Contact'}</p>
            </div>
          </div>
          {prospect.contact_path && prospect.contact_path.length > 0 && (
            <div className="flex-shrink-0 text-right space-y-1">
              <div className="h-5"></div>
              <div className="flex items-center justify-end -space-x-2">
                {prospect.contact_path.slice(0, 3).map((contact: any, index: number) => (
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
          <p className={`text-sm flex items-center ${getQueueStatusClass(prospect.queue_status)}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
            </svg>
            <span className="ml-1.5 font-medium">
              {prospect.queue_message || 'Action required'}
            </span>
          </p>
        )}
      </div>
    </div>
  );
});

export default ProspectCard;

