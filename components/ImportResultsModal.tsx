'use client';

import React, { useMemo } from 'react';

interface ImportResultsModalProps {
  show: boolean;
  results: {
    file_name?: string;
    total_rows?: number;
    companies?: {
      created?: number;
      already_exists?: number;
      updated?: number;
      failed?: number;
    };
    prospects?: {
      created?: number;
      already_exists?: number;
      failed?: number;
    };
    contacts?: {
      created?: number;
      updated?: number;
      skipped?: number;
      failed?: number;
    };
    failed_records?: Array<{
      row_num?: number;
      company_name?: string;
      error_reason?: string;
      row_data?: Record<string, any>;
    }>;
  };
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ImportResultsModal({
  show,
  results,
  onClose,
  onRefresh,
}: ImportResultsModalProps) {
  const hasFailures = useMemo(() => {
    return (
      (results.companies?.failed || 0) +
      (results.prospects?.failed || 0) +
      (results.contacts?.failed || 0) > 0
    );
  }, [results]);

  const totalFailures = useMemo(() => {
    return (
      (results.companies?.failed || 0) +
      (results.prospects?.failed || 0) +
      (results.contacts?.failed || 0)
    );
  }, [results]);

  const downloadErrorLog = () => {
    if (!results.failed_records || results.failed_records.length === 0) {
      return;
    }

    const firstRecord = results.failed_records[0];
    const originalColumns = firstRecord.row_data ? Object.keys(firstRecord.row_data) : [];
    
    const headers = ['Row', 'Company Name', 'Error_Reason', ...originalColumns];
    
    const csvRows = results.failed_records.map(record => {
      const row = [
        record.row_num,
        `"${(record.company_name || '').replace(/"/g, '""')}"`,
        `"${(record.error_reason || '').replace(/"/g, '""')}"`
      ];
      
      originalColumns.forEach(col => {
        const value = record.row_data?.[col] || '';
        row.push(`"${String(value).replace(/"/g, '""')}"`);
      });
      
      return row.join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.setAttribute('href', url);
    link.setAttribute('download', `import_errors_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDone = () => {
    if (onRefresh) {
      onRefresh();
    }
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-blue-500/20">
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 px-6 py-4 border-b border-green-500/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-900/50 border border-green-500/30">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2" id="modal-title">
                  ✅ Import Complete
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Source File: <span className="text-blue-400 font-mono">{results.file_name || 'Unknown'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-400">Total Rows Processed</p>
                  <p className="text-2xl font-bold text-white">{results.total_rows || 0}</p>
                </div>
              </div>
            </div>

            {hasFailures && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-red-400 font-semibold">⚠️ Some records failed to import</h4>
                  <p className="text-sm text-red-300 mt-1">
                    {totalFailures} record(s) encountered errors. Download the error log for details.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-300">Companies</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-green-400">+</span> Created
                    </span>
                    <span className="text-green-400 font-semibold">{results.companies?.created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-blue-400">~</span> Updated
                    </span>
                    <span className="text-blue-400 font-semibold">{results.companies?.updated || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-gray-400">=</span> Already Exists
                    </span>
                    <span className="text-gray-400 font-semibold">{results.companies?.already_exists || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-red-400">!</span> Failed
                    </span>
                    <span className="text-red-400 font-semibold">{results.companies?.failed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-300">Prospects</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-green-400">+</span> Created
                    </span>
                    <span className="text-green-400 font-semibold">{results.prospects?.created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-gray-400">=</span> Already Exists
                    </span>
                    <span className="text-gray-400 font-semibold">{results.prospects?.already_exists || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-red-400">!</span> Failed
                    </span>
                    <span className="text-red-400 font-semibold">{results.prospects?.failed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-4 border border-gray-700/50 hover:border-green-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-300">Contacts</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-green-400">+</span> Created
                    </span>
                    <span className="text-green-400 font-semibold">{results.contacts?.created || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-blue-400">~</span> Updated
                    </span>
                    <span className="text-blue-400 font-semibold">{results.contacts?.updated || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-gray-400">=</span> Skipped
                    </span>
                    <span className="text-gray-400 font-semibold">{results.contacts?.skipped || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-red-400">!</span> Failed
                    </span>
                    <span className="text-red-400 font-semibold">{results.contacts?.failed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {hasFailures && (
              <button
                type="button"
                onClick={downloadErrorLog}
                className="inline-flex items-center justify-center px-4 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-400 bg-red-900/30 hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Error Log
              </button>
            )}
            <button
              type="button"
              onClick={handleDone}
              className="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

