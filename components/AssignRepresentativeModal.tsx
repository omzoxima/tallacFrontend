'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import BaseModal from './BaseModal';
import CustomDropdown from './CustomDropdown';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface AssignRepresentativeModalProps {
  show: boolean;
  prospect: any;
  onClose: () => void;
  onAssign: (repName: string) => void;
}

export default function AssignRepresentativeModal({
  show,
  prospect,
  onClose,
  onAssign,
}: AssignRepresentativeModalProps) {
  const { user } = useAuth();
  const [assignTerritory, setAssignTerritory] = useState('');
  const [territoryOptions, setTerritoryOptions] = useState<any[]>([]);
  const [loadingTerritories, setLoadingTerritories] = useState(false);
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [salesReps, setSalesReps] = useState<any[]>([]);
  const [repsLoading, setRepsLoading] = useState(false);

  const isAdminOrManager = useMemo(() => {
    if (!user) return false;
    const r = user.tallac_role;
    return ['Administrator', 'System Manager', 'Corporate Admin', 'Business Coach'].includes(r || '') ||
           (user.roles && user.roles.includes('Administrator'));
  }, [user]);

  const filteredSalesReps = useMemo(() => {
    if (!repSearchQuery) return salesReps;
    const query = repSearchQuery.toLowerCase();
    return salesReps.filter(rep =>
      (rep.full_name || '').toLowerCase().includes(query) ||
      (rep.email || '').toLowerCase().includes(query)
    );
  }, [salesReps, repSearchQuery]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const loadAssignmentTerritories = async () => {
    setLoadingTerritories(true);
    try {
      let territories: any[] = [];
      
      if (isAdminOrManager) {
        const result = await api.getTerritories();
        if (result.success && result.data) {
          territories = result.data.map((t: any) => ({
            label: t.territory_name || t.name,
            value: t.name || t.id,
          }));
        }
      } else {
        if (user?.territories) {
          territories = user.territories.map((t: any) => ({
            label: t.territory_name || t.territory,
            value: t.territory || t.name,
          }));
        }
      }
      setTerritoryOptions(territories);
    } catch (e) {
      console.error('Error loading territories:', e);
    } finally {
      setLoadingTerritories(false);
    }
  };

  useEffect(() => {
    if (show) {
      setRepSearchQuery('');
      setSalesReps([]);
      setAssignTerritory(prospect?.territory || '');
      loadAssignmentTerritories();
    }
  }, [show, prospect, isAdminOrManager]);

  useEffect(() => {
    if (!show || !assignTerritory) {
      setSalesReps([]);
      return;
    }
    
    setRepsLoading(true);
    api.getUsersForAssignment(assignTerritory)
      .then((result) => {
        if (result.success && result.data) {
          setSalesReps(result.data);
        } else {
          setSalesReps([]);
        }
      })
      .catch((e) => {
        console.error('Error loading users:', e);
        setSalesReps([]);
      })
      .finally(() => {
        setRepsLoading(false);
      });
  }, [assignTerritory, show]);

  const selectRep = (repName: string) => {
    onAssign(repName);
  };

  if (!show) return null;

  return (
    <BaseModal
      title="Assign Representative"
      subtitle={`Assign a Representative for ${prospect?.company_name || prospect?.organization_name || 'Prospect'}`}
      maxWidth="md"
      onClose={onClose}
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Territory</label>
          <CustomDropdown
            value={assignTerritory}
            options={territoryOptions}
            onChange={setAssignTerritory}
            buttonClass="bg-gray-700 border-gray-600 text-white"
            showColorDot={false}
            showCheckmark={true}
            searchable={true}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Assign To</label>
          <input
            value={repSearchQuery}
            onChange={(e) => setRepSearchQuery(e.target.value)}
            type="search"
            placeholder="Search Team Members..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {repsLoading ? (
            <div className="text-center py-4 text-gray-400">
              <div className="animate-spin h-5 w-5 mx-auto mb-2 border-2 border-gray-600 border-t-orange-500 rounded-full"></div>
              Loading team members...
            </div>
          ) : (
            <>
              {filteredSalesReps.map((rep) => (
                <button
                  key={rep.id || rep.name}
                  onClick={() => selectRep(rep.full_name || rep.name)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                      {getInitials(rep.full_name || rep.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{rep.full_name || rep.name}</p>
                      <p className="text-xs text-gray-400">{rep.email}</p>
                    </div>
                  </div>
                </button>
              ))}
              
              <button
                onClick={() => selectRep('Administrator')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  <X className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-400 italic">Unassign</span>
              </button>
              
              {filteredSalesReps.length === 0 && !repsLoading && (
                <div className="text-center py-4 text-gray-500">
                  No team members found for this territory
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

