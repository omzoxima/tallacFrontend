'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  ClipboardList,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  UserPlus,
  Clock,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // KPIs Data
  const [kpis, setKpis] = useState({
    totalProspects: 0,
    totalActivities: 0,
    conversionRate: 0,
    activeUsers: 0,
  });

  // Pipeline Data
  const [pipeline, setPipeline] = useState({
    new: 0,
    contacted: 0,
    interested: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  });

  // Activity Breakdown
  const [activityBreakdown, setActivityBreakdown] = useState({
    queue: 0,
    scheduled: 0,
    completedToday: 0,
  });

  // Performance Metrics
  const [performance, setPerformance] = useState({
    callsMade: 0,
    callsChange: 0,
    emailsSent: 0,
    emailsChange: 0,
    appointments: 0,
    appointmentsChange: 0,
    dealsClosed: 0,
    dealsChange: 0,
  });

  // Weekly Performance
  const [weeklyPerformance, setWeeklyPerformance] = useState({
    newProspects: 0,
    totalActivities: 0,
    responseRate: 0,
    revenue: 0,
  });

  const pipelineTotal = useMemo(() => {
    return Object.values(pipeline).reduce((sum, val) => sum + (val || 0), 0);
  }, [pipeline]);

  const pipelinePercentage = (status: keyof typeof pipeline) => {
    if (pipelineTotal === 0) return 0;
    return Math.round((pipeline[status] / pipelineTotal) * 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await api.getDashboardAnalytics();

      if (result.success && result.data) {
        const data = result.data;

        // Set KPIs
        setKpis({
          totalProspects: data.totalProspects || 0,
          totalActivities: data.totalActivities || 0,
          conversionRate: data.conversionRate || 0,
          activeUsers: data.activeUsers || 0,
        });

        // Set Pipeline
        setPipeline({
          new: data.pipeline?.new || 0,
          contacted: data.pipeline?.contacted || 0,
          interested: data.pipeline?.interested || 0,
          proposal: data.pipeline?.proposal || 0,
          won: data.pipeline?.won || 0,
          lost: data.pipeline?.lost || 0,
        });

        // Set Activity Breakdown
        setActivityBreakdown({
          queue: data.activityBreakdown?.queue || 0,
          scheduled: data.activityBreakdown?.scheduled || 0,
          completedToday: data.activityBreakdown?.completedToday || 0,
        });

        // Set Performance
        setPerformance({
          callsMade: data.performance?.callsMade || 0,
          callsChange: data.performance?.callsChange || 0,
          emailsSent: data.performance?.emailsSent || 0,
          emailsChange: data.performance?.emailsChange || 0,
          appointments: data.performance?.appointments || 0,
          appointmentsChange: data.performance?.appointmentsChange || 0,
          dealsClosed: data.performance?.dealsClosed || 0,
          dealsChange: data.performance?.dealsChange || 0,
        });

        // Set Weekly Performance
        setWeeklyPerformance({
          newProspects: data.weeklyPerformance?.newProspects || 0,
          totalActivities: data.weeklyPerformance?.totalActivities || 0,
          responseRate: data.weeklyPerformance?.responseRate || 0,
          revenue: data.weeklyPerformance?.revenue || 0,
        });
      } else {
        // Fallback to default values if API fails
        setKpis({ totalProspects: 0, totalActivities: 0, conversionRate: 0, activeUsers: 0 });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setKpis({ totalProspects: 0, totalActivities: 0, conversionRate: 0, activeUsers: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout bg-gray-900 text-gray-300 flex flex-col min-h-screen">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* 1. Overview KPIs */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Business Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Prospects */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Total Prospects</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-white">{kpis.totalProspects || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Active in pipeline</div>
              </div>

              {/* Total Activities */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Total Activities</span>
                  <ClipboardList className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-white">{kpis.totalActivities || 0}</div>
                <div className="text-xs text-gray-500 mt-1">All time activities</div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Conversion Rate</span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-white">{kpis.conversionRate || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">Prospects to Won</div>
              </div>

              {/* Active Users */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-yellow-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Active Users</span>
                  <UserCheck className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-white">{kpis.activeUsers || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Team members</div>
              </div>
            </div>
          </div>

          {/* 2. Pipeline Overview */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Pipeline Overview</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* New */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">New</div>
                  <div className="text-2xl font-bold text-blue-400">{pipeline.new || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipelinePercentage('new')}%</div>
                </div>

                {/* Contacted */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Contacted</div>
                  <div className="text-2xl font-bold text-purple-400">{pipeline.contacted || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipelinePercentage('contacted')}%</div>
                </div>

                {/* Interested */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Interested</div>
                  <div className="text-2xl font-bold text-yellow-400">{pipeline.interested || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipelinePercentage('interested')}%</div>
                </div>

                {/* Proposal */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Proposal</div>
                  <div className="text-2xl font-bold text-orange-400">{pipeline.proposal || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipelinePercentage('proposal')}%</div>
                </div>

                {/* Won */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Won</div>
                  <div className="text-2xl font-bold text-green-400">{pipeline.won || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipelinePercentage('won')}%</div>
                </div>

                {/* Lost */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Lost</div>
                  <div className="text-2xl font-bold text-red-400">{pipeline.lost || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">{pipelinePercentage('lost')}%</div>
                </div>
              </div>

              {/* Visual Pipeline Bar */}
              <div className="mt-6 h-3 bg-gray-700 rounded-full overflow-hidden flex">
                {pipelinePercentage('new') > 0 && (
                  <div
                    style={{ width: `${pipelinePercentage('new')}%` }}
                    className="bg-blue-500 transition-all"
                  ></div>
                )}
                {pipelinePercentage('contacted') > 0 && (
                  <div
                    style={{ width: `${pipelinePercentage('contacted')}%` }}
                    className="bg-purple-500 transition-all"
                  ></div>
                )}
                {pipelinePercentage('interested') > 0 && (
                  <div
                    style={{ width: `${pipelinePercentage('interested')}%` }}
                    className="bg-yellow-500 transition-all"
                  ></div>
                )}
                {pipelinePercentage('proposal') > 0 && (
                  <div
                    style={{ width: `${pipelinePercentage('proposal')}%` }}
                    className="bg-orange-500 transition-all"
                  ></div>
                )}
                {pipelinePercentage('won') > 0 && (
                  <div
                    style={{ width: `${pipelinePercentage('won')}%` }}
                    className="bg-green-500 transition-all"
                  ></div>
                )}
                {pipelinePercentage('lost') > 0 && (
                  <div
                    style={{ width: `${pipelinePercentage('lost')}%` }}
                    className="bg-red-500 transition-all"
                  ></div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Activity Breakdown */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Activity Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Queue */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-red-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">In Queue</span>
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activityBreakdown.queue || 0}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{activityBreakdown.queue || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Pending activities</div>
              </div>

              {/* Scheduled */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-yellow-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Scheduled</span>
                  <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activityBreakdown.scheduled || 0}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{activityBreakdown.scheduled || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Upcoming activities</div>
              </div>

              {/* Completed Today */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Completed Today</span>
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activityBreakdown.completedToday || 0}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{activityBreakdown.completedToday || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Activities done</div>
              </div>
            </div>
          </div>

          {/* 4. Performance Metrics (Two columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Today's Performance */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Today's Performance</h3>
              <div className="space-y-4">
                {/* Calls Made */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Calls Made</div>
                      <div className="text-xl font-bold text-white">{performance.callsMade || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400">+{performance.callsChange || 0}%</div>
                </div>

                {/* Emails Sent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Emails Sent</div>
                      <div className="text-xl font-bold text-white">{performance.emailsSent || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400">+{performance.emailsChange || 0}%</div>
                </div>

                {/* Appointments Set */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Appointments</div>
                      <div className="text-xl font-bold text-white">{performance.appointments || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400">+{performance.appointmentsChange || 0}%</div>
                </div>

                {/* Deals Closed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Deals Closed</div>
                      <div className="text-xl font-bold text-white">{performance.dealsClosed || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400">+{performance.dealsChange || 0}%</div>
                </div>
              </div>
            </div>

            {/* Weekly Performance */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">This Week's Performance</h3>
              <div className="space-y-4">
                {/* New Prospects */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">New Prospects</div>
                      <div className="text-xl font-bold text-white">{weeklyPerformance.newProspects || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Total Activities */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Total Activities</div>
                      <div className="text-xl font-bold text-white">{weeklyPerformance.totalActivities || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Response Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Response Rate</div>
                      <div className="text-xl font-bold text-white">{weeklyPerformance.responseRate || 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Revenue Generated */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Revenue</div>
                      <div className="text-xl font-bold text-white">
                        ${formatNumber(weeklyPerformance.revenue || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigateTo('/prospects')}
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Add Prospect</div>
                  <div className="text-xs text-gray-400">Create new lead</div>
                </div>
              </button>

              <button
                onClick={() => navigateTo('/activities')}
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Log Activity</div>
                  <div className="text-xs text-gray-400">Record interaction</div>
                </div>
              </button>

              <button
                onClick={() => navigateTo('/prospects?filter=queue')}
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">View Queue</div>
                  <div className="text-xs text-gray-400">Pending tasks</div>
                </div>
              </button>

              <button
                onClick={() => navigateTo('/activities?filter=scheduled')}
                className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">View Scheduled</div>
                  <div className="text-xs text-gray-400">Upcoming events</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
