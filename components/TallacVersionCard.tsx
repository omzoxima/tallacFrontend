'use client';

import React from 'react';
import { Clock, User, Edit3, ArrowRight } from 'lucide-react';

interface TallacVersionCardProps {
  activity: any;
}

export default function TallacVersionCard({ activity }: TallacVersionCardProps) {
  const parsedChanges = React.useMemo(() => {
    if (!activity.changes || !activity.changes.changed) {
      return [];
    }

    return activity.changes.changed.map((change: any[]) => ({
      field: change[0],
      oldValue: change[1],
      newValue: change[2],
    }));
  }, [activity.changes]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="version-card bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="card-header p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center gap-4 flex-wrap">
        <div className="header-content flex items-center gap-3">
          <User className="w-8 h-8 p-1.5 bg-gray-700 rounded-full text-gray-400 flex-shrink-0" />
          <div>
            <span className="user-name font-semibold text-white mr-1.5">{activity.owner}</span>
            <span className="action-text text-sm text-gray-400">made changes</span>
          </div>
        </div>
        <span className="version-date flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
          <Clock className="w-4 h-4 flex-shrink-0" />
          {formatDate(activity.creation || activity.date_time)}
        </span>
      </div>

      <div className="card-body p-4">
        {parsedChanges.length > 0 ? (
          <div className="changes-list flex flex-col gap-4">
            {parsedChanges.map((change: any, index: number) => (
              <div key={index} className="change-item flex flex-col gap-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
                <div className="change-field flex items-center gap-2 text-sm text-gray-300">
                  <Edit3 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <strong className="text-white font-semibold">{change.field}</strong>
                </div>
                <div className="change-values flex items-center gap-3 flex-wrap ml-6">
                  {change.oldValue && (
                    <div className="old-value flex flex-col gap-1">
                      <span className="value-label text-xs text-gray-500 uppercase tracking-wide font-semibold">From:</span>
                      <span className="value text-sm text-gray-300 px-3 py-1.5 bg-gray-700 rounded-lg">{change.oldValue}</span>
                    </div>
                  )}
                  {change.oldValue && change.newValue && (
                    <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                  {change.newValue && (
                    <div className="new-value flex flex-col gap-1">
                      <span className="value-label text-xs text-gray-500 uppercase tracking-wide font-semibold">To:</span>
                      <span className="value text-sm text-green-400 px-3 py-1.5 bg-green-900/10 rounded-lg">{change.newValue}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-changes p-4 text-center text-sm text-gray-400 bg-gray-900 rounded-lg">
            <span>Changes recorded</span>
          </div>
        )}
      </div>
    </div>
  );
}

