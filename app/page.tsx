'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useUser } from '@/contexts/UserContext';
import { showToast } from '@/components/Toast';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [kpis, setKpis] = useState({
    totalProspects: 0,
    totalActivities: 0,
    conversionRate: 0,
    activeUsers: 0,
  });
  const [pipeline, setPipeline] = useState({
    new: 0,
    contacted: 0,
    interested: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  });
  const [activityBreakdown, setActivityBreakdown] = useState({
    queue: 0,
    scheduled: 0,
    completedToday: 0,
  });
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
  const [weeklyPerformance, setWeeklyPerformance] = useState({
    newProspects: 0,
    totalActivities: 0,
    responseRate: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${apiUrl}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      
      setKpis((prev) => data.kpis || prev);
      setPipeline((prev) => data.pipeline || prev);
      setActivityBreakdown((prev) => data.activityBreakdown || prev);
      
      // Use real data from API
      setPerformance((prev) => data.performance || prev);
      setWeeklyPerformance((prev) => data.weeklyPerformance || prev);
    } catch {
      showToast('Failed to load dashboard data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
        }
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
    }
    
    if (userLoading) {
      return;
    }
    
    if (!user || !user.id) {
      router.push('/login');
      return;
    }
    
    loadDashboardData();
  }, [user, userLoading, router, loadDashboardData]);

  const pipelineTotal = Object.values(pipeline).reduce((sum, val) => sum + (val || 0), 0);
  
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


  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 dark:bg-gray-900 bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  // If no user, don't render anything (RouteGuard will redirect)
  if (!user || !user.id) {
    return null;
  }

  if (loading) {
    return (
      <div className="app-layout bg-gray-900 dark:bg-gray-900 bg-gray-50 text-gray-300 dark:text-gray-300 text-gray-900 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-900 dark:text-white">Loading dashboard...</div>
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-layout bg-gray-900 dark:bg-gray-900 bg-gray-50 text-gray-300 dark:text-gray-300 text-gray-900 flex flex-col min-h-screen transition-colors duration-300">
      <AppHeader />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* 1. Overview KPIs */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Business Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Prospects */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-blue-500 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Total Prospects</span>
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white dark:text-white text-gray-900">{kpis.totalProspects || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">Active in pipeline</div>
              </div>

              {/* Total Activities */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-purple-500 dark:hover:border-purple-500 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Total Activities</span>
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white dark:text-white text-gray-900">{kpis.totalActivities || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">All time activities</div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-green-500 dark:hover:border-green-500 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Conversion Rate</span>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white dark:text-white text-gray-900">{kpis.conversionRate || 0}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">Prospects to Won</div>
              </div>

              {/* Active Users */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Active Users</span>
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white dark:text-white text-gray-900">{kpis.activeUsers || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">Team members</div>
              </div>
            </div>
          </div>

          {/* 2. Pipeline Overview */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Pipeline Overview</h2>
            <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-gray-700 dark:border-gray-700 border-gray-200 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* New */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">New</div>
                  <div className="text-2xl font-bold text-blue-400 dark:text-blue-400 text-blue-600">{pipeline.new || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">{pipelinePercentage('new')}%</div>
                </div>

                {/* Contacted */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">Contacted</div>
                  <div className="text-2xl font-bold text-purple-400 dark:text-purple-400 text-purple-600">{pipeline.contacted || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">{pipelinePercentage('contacted')}%</div>
                </div>

                {/* Interested */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">Interested</div>
                  <div className="text-2xl font-bold text-yellow-400 dark:text-yellow-400 text-yellow-600">{pipeline.interested || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">{pipelinePercentage('interested')}%</div>
                </div>

                {/* Proposal */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">Proposal</div>
                  <div className="text-2xl font-bold text-orange-400 dark:text-orange-400 text-orange-600">{pipeline.proposal || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">{pipelinePercentage('proposal')}%</div>
                </div>

                {/* Won */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">Won</div>
                  <div className="text-2xl font-bold text-green-400 dark:text-green-400 text-green-600">{pipeline.won || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">{pipelinePercentage('won')}%</div>
                </div>

                {/* Lost */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">Lost</div>
                  <div className="text-2xl font-bold text-red-400 dark:text-red-400 text-red-600">{pipeline.lost || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">{pipelinePercentage('lost')}%</div>
                </div>
              </div>

              {/* Visual Pipeline Bar */}
              <div className="mt-6 h-3 bg-gray-700 rounded-full overflow-hidden flex">
                {pipelinePercentage('new') > 0 && (
                  <div style={{ width: `${pipelinePercentage('new')}%` }} className="bg-blue-500 transition-all"></div>
                )}
                {pipelinePercentage('contacted') > 0 && (
                  <div style={{ width: `${pipelinePercentage('contacted')}%` }} className="bg-purple-500 transition-all"></div>
                )}
                {pipelinePercentage('interested') > 0 && (
                  <div style={{ width: `${pipelinePercentage('interested')}%` }} className="bg-yellow-500 transition-all"></div>
                )}
                {pipelinePercentage('proposal') > 0 && (
                  <div style={{ width: `${pipelinePercentage('proposal')}%` }} className="bg-orange-500 transition-all"></div>
                )}
                {pipelinePercentage('won') > 0 && (
                  <div style={{ width: `${pipelinePercentage('won')}%` }} className="bg-green-500 transition-all"></div>
                )}
                {pipelinePercentage('lost') > 0 && (
                  <div style={{ width: `${pipelinePercentage('lost')}%` }} className="bg-red-500 transition-all"></div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Activity Breakdown */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Activity Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Queue */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-red-500 dark:hover:border-red-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">In Queue</span>
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activityBreakdown.queue || 0}</span>
                </div>
                <div className="text-2xl font-bold text-white dark:text-white text-gray-900">{activityBreakdown.queue || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">Pending activities</div>
              </div>

              {/* Scheduled */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Scheduled</span>
                  <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activityBreakdown.scheduled || 0}</span>
                </div>
                <div className="text-2xl font-bold text-white dark:text-white text-gray-900">{activityBreakdown.scheduled || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">Upcoming activities</div>
              </div>

              {/* Completed Today */}
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-4 border border-gray-700 dark:border-gray-700 border-gray-200 hover:border-green-500 dark:hover:border-green-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Completed Today</span>
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activityBreakdown.completedToday || 0}</span>
                </div>
                <div className="text-2xl font-bold text-white dark:text-white text-gray-900">{activityBreakdown.completedToday || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-gray-600 mt-1">Activities done</div>
              </div>
            </div>
          </div>

          {/* 4. Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Today's Performance */}
            <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-gray-700 dark:border-gray-700 border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Today's Performance</h3>
              <div className="space-y-4">
                
                {/* Calls Made */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Calls Made</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{performance.callsMade || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400 dark:text-green-400 text-green-600">+{performance.callsChange || 0}%</div>
                </div>

                {/* Emails Sent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Emails Sent</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{performance.emailsSent || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400 dark:text-green-400 text-green-600">+{performance.emailsChange || 0}%</div>
                </div>

                {/* Appointments Set */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Appointments</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{performance.appointments || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400 dark:text-green-400 text-green-600">+{performance.appointmentsChange || 0}%</div>
                </div>

                {/* Deals Closed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Deals Closed</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{performance.dealsClosed || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-400 dark:text-green-400 text-green-600">+{performance.dealsChange || 0}%</div>
                </div>
              </div>
            </div>

            {/* Weekly Performance */}
            <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-gray-700 dark:border-gray-700 border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-white mb-4">This Week's Performance</h3>
              <div className="space-y-4">
                
                {/* New Prospects */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">New Prospects</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{weeklyPerformance.newProspects || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Total Activities */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Total Activities</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{weeklyPerformance.totalActivities || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Response Rate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Response Rate</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">{weeklyPerformance.responseRate || 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Revenue Generated */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 dark:text-gray-400 text-gray-600">Revenue</div>
                      <div className="text-xl font-bold text-white dark:text-white text-gray-900">${formatNumber(weeklyPerformance.revenue || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Quick Actions */}
          <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-gray-700 dark:border-gray-700 border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <button 
                onClick={() => navigateTo('/prospects')} 
                className="flex items-center gap-3 p-4 bg-gray-700 dark:bg-gray-700 bg-gray-100 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white dark:text-white text-gray-900">Add Prospect</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">Create new lead</div>
                </div>
              </button>

              <button 
                onClick={() => navigateTo('/activities')} 
                className="flex items-center gap-3 p-4 bg-gray-700 dark:bg-gray-700 bg-gray-100 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white dark:text-white text-gray-900">Log Activity</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">Record interaction</div>
                </div>
              </button>

              <button 
                onClick={() => navigateTo('/prospects?filter=queue')} 
                className="flex items-center gap-3 p-4 bg-gray-700 dark:bg-gray-700 bg-gray-100 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white dark:text-white text-gray-900">View Queue</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">Pending tasks</div>
                </div>
              </button>

              <button 
                onClick={() => navigateTo('/activities?filter=scheduled')} 
                className="flex items-center gap-3 p-4 bg-gray-700 dark:bg-gray-700 bg-gray-100 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-yellow-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white dark:text-white text-gray-900">View Scheduled</div>
                  <div className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">Upcoming events</div>
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

