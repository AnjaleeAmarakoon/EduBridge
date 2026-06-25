'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Users, 
  CheckCircle, 
  ShieldAlert, 
  FileText, 
  Download, 
  Check, 
  X, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  Building,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Trash2
} from 'lucide-react';
import { 
  fetchAdminStats, 
  fetchAdminSchools, 
  verifySchoolAction, 
  fetchAdminProfiles, 
  fetchAdminRequestsAndSessions, 
  moderateRequestAction, 
  moderateSessionAction,
  updateUserRoleAction,
  fetchAdminRatings,
  moderateRatingAction,
  AdminStatsFilters
} from '../actions.admin';
import { formatCurrency } from '@/lib/currency';
import type { Profile, School, Request, VolunteerSession } from '@/lib/types/database';

interface AdminStats {
  summary: {
    totalMonetaryRaised: number;
    goodsDonationCount: number;
    totalRequests: number;
    activeRequests: number;
    fulfilledRequests: number;
    fulfillmentRate: number;
    totalSessions: number;
    completedSessions: number;
    totalHoursLogged: number;
    studentAttendanceRate: number;
    studentCount: number;
  };
  schoolTypeDistribution: {
    Blind: number;
    Deaf: number;
    Rural: number;
  };
  categoryBreakdown: Record<string, number>;
  geographicBreakdown: Record<string, number>;
  monthlyTrends: Array<{ month: string; amount: number }>;
}

interface SchoolWithProfile extends School {
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface RequestWithSchool extends Request {
  schools: {
    name: string;
  } | null;
}

interface SessionWithDetails extends VolunteerSession {
  schools: {
    name: string;
  } | null;
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
}

interface RatingWithUser {
  rating_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  feedback_categories: string[];
  is_anonymous: boolean;
  is_verified: boolean;
  created_at: string;
  rater: { first_name: string; last_name: string; email: string; role: string } | null;
  ratee: { first_name: string; last_name: string; email: string; role: string } | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'users' | 'moderation'>('overview');
  
  // Overview Tab State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState<AdminStatsFilters>({
    startDate: '',
    endDate: '',
    category: '',
    region: '',
  });
  
  // School Verifications Tab State
  const [schools, setSchools] = useState<SchoolWithProfile[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithProfile | null>(null);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolFilter, setSchoolFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [schoolSearch, setSchoolSearch] = useState('');

  // User Directory Tab State
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');

  // Moderation Tab State
  const [requests, setRequests] = useState<RequestWithSchool[]>([]);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [ratings, setRatings] = useState<RatingWithUser[]>([]);
  const [modLoading, setModLoading] = useState(true);
  const [modSearch, setModSearch] = useState('');
  const [modSubTab, setModSubTab] = useState<'requests' | 'sessions' | 'feedback'>('requests');

  // Loading Overlay
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load stats
  const loadStats = useCallback(async (currentFilters = filters) => {
    setStatsLoading(true);
    const result = await fetchAdminStats(currentFilters);
    if (result.success && result.data) {
      setStats(result.data);
    } else {
      setErrorMessage(result.error || 'Failed to load stats');
    }
    setStatsLoading(false);
  }, [filters]);

  // Load schools
  const loadSchools = useCallback(async (status = schoolFilter) => {
    setSchoolsLoading(true);
    const result = await fetchAdminSchools(status);
    if (result.success) {
      setSchools(result.data || []);
    } else {
      setErrorMessage(result.error || 'Failed to load schools');
    }
    setSchoolsLoading(false);
  }, [schoolFilter]);

  // Load users
  const loadUsers = useCallback(async (role = userRoleFilter) => {
    setUsersLoading(true);
    const result = await fetchAdminProfiles(role);
    if (result.success) {
      setUsers(result.data || []);
    } else {
      setErrorMessage(result.error || 'Failed to load users');
    }
    setUsersLoading(false);
  }, [userRoleFilter]);

  // Load moderation requests, sessions, and ratings
  const loadModerationData = useCallback(async () => {
    setModLoading(true);
    const result = await fetchAdminRequestsAndSessions();
    if (result.success) {
      setRequests(result.data?.requests || []);
      setSessions(result.data?.sessions || []);
    } else {
      setErrorMessage(result.error || 'Failed to load moderation records');
    }

    const ratingResult = await fetchAdminRatings();
    if (ratingResult.success && ratingResult.data) {
      setRatings(ratingResult.data);
    }
    setModLoading(false);
  }, []);

  // Fetch initial data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats();
    } else if (activeTab === 'verifications') {
      loadSchools();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'moderation') {
      loadModerationData();
    }
  }, [activeTab, loadStats, loadSchools, loadUsers, loadModerationData]);

  // School actions
  const handleVerifySchool = async (schoolId: string, approve: boolean) => {
    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await verifySchoolAction(schoolId, approve);
      if (result.success) {
        setSuccessMessage(`School ${approve ? 'verified' : 'unverified'} successfully.`);
        setSelectedSchool(null);
        loadSchools();
      } else {
        setErrorMessage(result.error || 'Operation failed');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Error executing action');
    } finally {
      setActionLoading(false);
    }
  };

  // Moderate request action
  const handleModerateRequest = async (requestId: string, action: 'cancel' | 'delete') => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await moderateRequestAction(requestId, action);
      if (result.success) {
        setSuccessMessage(`Request successfully ${action === 'cancel' ? 'cancelled' : 'deleted'}.`);
        loadModerationData();
      } else {
        setErrorMessage(result.error || 'Operation failed');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Error executing action');
    } finally {
      setActionLoading(false);
    }
  };

  // Moderate session action
  const handleModerateSession = async (sessionId: string, action: 'cancel' | 'delete') => {
    if (!window.confirm(`Are you sure you want to ${action} this session?`)) return;
    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await moderateSessionAction(sessionId, action);
      if (result.success) {
        setSuccessMessage(`Session successfully ${action === 'cancel' ? 'cancelled' : 'deleted'}.`);
        loadModerationData();
      } else {
        setErrorMessage(result.error || 'Operation failed');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Error executing action');
    } finally {
      setActionLoading(false);
    }
  };

  // Moderate rating action
  const handleModerateRating = async (ratingId: string, action: 'verify' | 'unverify' | 'delete') => {
    if (action === 'delete' && !window.confirm('Are you sure you want to delete this rating/review?')) return;
    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await moderateRatingAction(ratingId, action);
      if (result.success) {
        setSuccessMessage(`Rating moderated successfully.`);
        loadModerationData();
      } else {
        setErrorMessage(result.error || 'Moderation action failed');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Error executing moderation action');
    } finally {
      setActionLoading(false);
    }
  };

  // Update user role action
  const handleUpdateRole = async (userId: string, newRole: 'school_admin' | 'donor' | 'volunteer' | 'admin') => {
    setActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await updateUserRoleAction(userId, newRole);
      if (result.success) {
        setSuccessMessage('User role updated successfully.');
        loadUsers();
      } else {
        setErrorMessage(result.error || 'Failed to update user role');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Error executing action');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter apply for Overview
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStats(filters);
  };

  const handleResetFilters = () => {
    const defaultFilters = { startDate: '', endDate: '', category: '', region: '' };
    setFilters(defaultFilters);
    loadStats(defaultFilters);
  };

  // CSV Exporter helper
  const exportToCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger downloads
  const handleExportStats = () => {
    if (!stats) return;
    const summary = stats.summary;
    const data = [
      ['Metric', 'Value'],
      ['Total Monetary Raised (LKR)', summary.totalMonetaryRaised],
      ['Goods Fulfillments Count', summary.goodsDonationCount],
      ['Total School Requests', summary.totalRequests],
      ['Active Requests', summary.activeRequests],
      ['Fulfilled Requests', summary.fulfilledRequests],
      ['Fulfillment Rate (%)', summary.fulfillmentRate.toFixed(2)],
      ['Total Sessions Scheduled', summary.totalSessions],
      ['Completed Sessions', summary.completedSessions],
      ['Total Volunteer Hours Logged', summary.totalHoursLogged],
      ['Student Attendance Rate (%)', summary.studentAttendanceRate.toFixed(2)],
      ['Students Logged', summary.studentCount]
    ];
    exportToCSV(`edubridge_stats_summary_${new Date().toISOString().slice(0,10)}.csv`, data);
  };

  // Render Alert banner
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Categories helper
  const categories = [
    'Education Materials',
    'Infrastructure',
    'Technology',
    'Volunteer Teaching',
    'Special Equipment',
    'Food & Nutrition',
    'Healthcare',
    'Other'
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white leading-none">Console</p>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">System Admin</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart className="w-4 h-4" />
            Overview & Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('verifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'verifications' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            School Verifications
            {schools.filter(s => !s.verified).length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">
                {schools.filter(s => !s.verified).length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            User Directory
          </button>
          
          <button
            onClick={() => setActiveTab('moderation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'moderation' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Content Moderation
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <p>EduBridge v1.0.0</p>
          <p>© 2026 Admin Portal</p>
        </div>
      </aside>

      {/* Main Admin Panels Area */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Messages */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl shadow-sm flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics & Platform Health</h2>
                <p className="text-slate-500 mt-1">Real-time indicators of donor giving, school requests, and volunteer programs.</p>
              </div>
              <button 
                onClick={handleExportStats}
                disabled={!stats}
                className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 transition shadow-sm hover:shadow flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Export Summary CSV
              </button>
            </div>

            {/* Filters Row */}
            <form onSubmit={handleFilterSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Filter Analytics</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Region Keyword</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Moratuwa"
                      value={filters.region}
                      onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 pl-9 pr-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                  Apply Filters
                </button>
              </div>
            </form>

            {statsLoading ? (
              <div className="flex flex-col justify-center items-center py-20 bg-white border border-slate-200 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-semibold text-sm">Aggregating platform metrics...</p>
              </div>
            ) : stats ? (
              <div className="space-y-6 animate-fadeIn">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Raised</p>
                      <h4 className="text-2xl font-black text-slate-900">{formatCurrency(stats.summary.totalMonetaryRaised)}</h4>
                      <p className="text-xs text-slate-500">From completed Stripe/PayHere receipts</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Goods Donated</p>
                      <h4 className="text-2xl font-black text-slate-900">{stats.summary.goodsDonationCount} items</h4>
                      <p className="text-xs text-slate-500">In-kind deliveries to rural schools</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Building className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfillment Rate</p>
                      <h4 className="text-2xl font-black text-slate-900">{stats.summary.fulfillmentRate.toFixed(1)}%</h4>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${stats.summary.fulfillmentRate}%` }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volunteer Sessions</p>
                      <h4 className="text-2xl font-black text-slate-900">{stats.summary.totalHoursLogged} hrs</h4>
                      <p className="text-xs text-slate-500">Logged over {stats.summary.totalSessions} confirms</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Sub-Aggregates Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Categories Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Requests Category Frequency</h3>
                    <div className="space-y-4 flex-1">
                      {Object.keys(stats.categoryBreakdown).length === 0 ? (
                        <p className="text-slate-500 text-sm py-10 text-center">No categories matched filters.</p>
                      ) : (
                        Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                          const percent = (Number(count) / stats.summary.totalRequests) * 100;
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-slate-700">{category}</span>
                                <span className="text-slate-900 font-bold">{count} ({percent.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Chart 2: School Types & Attendance */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">School Specialization Ratio</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Blind</span>
                          <span className="text-2xl font-black text-rose-700 block mt-1">{stats.schoolTypeDistribution.Blind}</span>
                        </div>
                        <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl">
                          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Deaf</span>
                          <span className="text-2xl font-black text-sky-700 block mt-1">{stats.schoolTypeDistribution.Deaf}</span>
                        </div>
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Rural</span>
                          <span className="text-2xl font-black text-emerald-700 block mt-1">{stats.schoolTypeDistribution.Rural}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 pb-2 border-b border-slate-100">Average Student Attendance</h3>
                      <div className="flex items-center gap-4 py-2">
                        <div className="text-3xl font-extrabold text-indigo-700">{stats.summary.studentAttendanceRate.toFixed(1)}%</div>
                        <div className="flex-1">
                          <div className="w-full bg-slate-100 rounded-full h-3">
                            <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${stats.summary.studentAttendanceRate}%` }}></div>
                          </div>
                          <span className="text-slate-500 text-xs mt-1 block">Calculated from {stats.summary.studentCount} logged participants</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Geographic Distribution */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Geographic Request Concentration</h3>
                    <div className="space-y-3">
                      {Object.keys(stats.geographicBreakdown).length === 0 ? (
                        <p className="text-slate-500 text-sm py-10 text-center">No location matches.</p>
                      ) : (
                        Object.entries(stats.geographicBreakdown).slice(0, 5).map(([loc, count], idx) => (
                          <div key={loc} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-full font-bold text-xs flex items-center justify-center">{idx + 1}</span>
                              <span className="text-slate-800 text-sm font-medium">{loc}</span>
                            </div>
                            <span className="bg-blue-50 text-blue-700 font-bold text-xs py-1 px-2.5 rounded-full">{count} requests</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Monthly Donations Trend (SVG Chart) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Monthly Giving Trend (LKR)</h3>
                    <div className="flex-1 flex items-end justify-between h-44 gap-2 pt-6">
                      {stats.monthlyTrends.length === 0 ? (
                        <div className="w-full text-slate-500 text-sm py-10 text-center self-center">No completed financial logs in period.</div>
                      ) : (
                        stats.monthlyTrends.map((t) => {
                          const maxAmt = Math.max(...stats.monthlyTrends.map((i) => i.amount), 1);
                          const hPercent = (t.amount / maxAmt) * 100;
                          return (
                            <div key={t.month} className="flex-1 flex flex-col items-center group">
                              <div className="relative w-full flex justify-center">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10 font-bold">
                                  {formatCurrency(t.amount)}
                                </div>
                                <div 
                                  className="w-8 sm:w-12 bg-gradient-to-t from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-t transition-all duration-300 shadow-sm"
                                  style={{ height: `${Math.max(hPercent, 6)}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 mt-2 whitespace-nowrap">{t.month}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">Failed to yield metrics.</p>
            )}
          </div>
        )}

        {/* SCHOOL VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">School Onboarding & Verifications</h2>
              <p className="text-slate-500 mt-1">Review school registrations, bank details, and verify credentials to prevent platform fraud.</p>
            </div>

            {/* Filter buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    onClick={() => { setSchoolFilter('pending'); loadSchools('pending'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      schoolFilter === 'pending' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Pending Review
                  </button>
                  <button
                    onClick={() => { setSchoolFilter('verified'); loadSchools('verified'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      schoolFilter === 'verified' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Verified Schools
                  </button>
                  <button
                    onClick={() => { setSchoolFilter('all'); loadSchools('all'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      schoolFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    All Schools
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by school name..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 pl-9 pr-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Schools list */}
              {schoolsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-500 text-sm">Querying school entries...</p>
                </div>
              ) : schools.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">No schools match search criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                        <th className="p-4">School Name</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Contact Person</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools
                        .filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
                        .map(school => (
                          <tr key={school.school_id} className="border-b border-slate-200 hover:bg-slate-50 transition text-sm">
                            <td className="p-4 font-bold text-slate-900">{school.name}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                school.type === 'Blind' ? 'bg-red-50 text-red-700' :
                                school.type === 'Deaf' ? 'bg-blue-50 text-blue-700' :
                                'bg-emerald-50 text-emerald-700'
                              }`}>
                                {school.type}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-slate-700">{school.contact_person}</td>
                            <td className="p-4 text-slate-500">{school.email || 'No email provided'}</td>
                            <td className="p-4">
                              {school.verified ? (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                                  <Check className="w-3 h-3" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Pending Review
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => setSelectedSchool(school)}
                                className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Inspect Details
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected School detail modal */}
            {selectedSchool && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                      <Building className="w-6 h-6 text-blue-400" />
                      <div>
                        <h3 className="font-extrabold text-lg leading-tight">{selectedSchool.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">Onboarding Verification Dossier</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedSchool(null)}
                      className="text-slate-400 hover:text-white transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* General Profile */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">School Type</span>
                        <span className="text-sm font-semibold text-slate-900">{selectedSchool.type} specialization</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registrant Account</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {selectedSchool.profiles?.first_name} {selectedSchool.profiles?.last_name}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Contact Credentials</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-slate-400 block">Contact Name</span>
                          <span className="font-medium text-slate-900">{selectedSchool.contact_person}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">Telephone</span>
                          <span className="font-medium text-slate-900">{selectedSchool.phone || selectedSchool.profiles?.phone || 'No phone provided'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-slate-400 block">Postal Address</span>
                          <span className="font-medium text-slate-900">{selectedSchool.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bank Details section */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Bank Transfer Credentials
                      </div>
                      <p className="text-sm text-slate-800 font-mono bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedSchool.bank_account_details || 'No bank transfer coordinates provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                    <button
                      onClick={() => setSelectedSchool(null)}
                      className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100 transition"
                    >
                      Close Dossier
                    </button>
                    
                    {selectedSchool.verified ? (
                      <button
                        onClick={() => handleVerifySchool(selectedSchool.school_id, false)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-1"
                      >
                        Unverify School
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleVerifySchool(selectedSchool.school_id, true)}
                          disabled={actionLoading}
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Approve & Verify
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* USER DIRECTORY TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Directory</h2>
              <p className="text-slate-500 mt-1">Audit platform accounts, registration dates, contact phone records, and system privileges.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Role:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); loadUsers(e.target.value); }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
                  >
                    <option value="all">All Roles</option>
                    <option value="school_admin">School Admin</option>
                    <option value="donor">Donor</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 pl-9 pr-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-500 text-sm">Querying database users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-500">No accounts match criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Role Badge</th>
                        <th className="p-4">Signup Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => 
                          `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map(u => (
                          <tr key={u.id} className="border-b border-slate-200 hover:bg-slate-50 transition text-sm">
                            <td className="p-4 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                            <td className="p-4 text-slate-600">{u.email}</td>
                            <td className="p-4 text-slate-500">{u.phone || 'No phone record'}</td>
                            <td className="p-4">
                              <select
                                value={u.role}
                                disabled={actionLoading}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value as 'school_admin' | 'donor' | 'volunteer' | 'admin')}
                                className={`text-xs font-bold border rounded-lg px-2 py-1 bg-white hover:bg-slate-50 transition cursor-pointer ${
                                  u.role === 'admin' ? 'text-purple-700 border-purple-200' :
                                  u.role === 'school_admin' ? 'text-blue-700 border-blue-200' :
                                  u.role === 'donor' ? 'text-green-700 border-green-200' :
                                  'text-orange-700 border-orange-200'
                                }`}
                              >
                                <option value="school_admin">School Admin</option>
                                <option value="donor">Donor</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="admin">System Admin</option>
                              </select>
                            </td>
                            <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENT MODERATION TAB */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Content Moderation Console</h2>
              <p className="text-slate-500 mt-1">Filter, review, and cancel/delete inappropriate requests or volunteer sessions system-wide.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    onClick={() => setModSubTab('requests')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      modSubTab === 'requests' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    School Requests
                  </button>
                  <button
                    onClick={() => setModSubTab('sessions')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      modSubTab === 'sessions' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Volunteer Sessions
                  </button>
                  <button
                    onClick={() => setModSubTab('feedback')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      modSubTab === 'feedback' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    User Feedback
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder={`Search ${modSubTab}...`}
                    value={modSearch}
                    onChange={(e) => setModSearch(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm py-2 pl-9 pr-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {modLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-500 text-sm">Querying database moderation lists...</p>
                </div>
              ) : modSubTab === 'requests' ? (
                // Requests moderation
                requests.filter(r => r.title.toLowerCase().includes(modSearch.toLowerCase())).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-slate-500">No requests found matching criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                          <th className="p-4">Request Title</th>
                          <th className="p-4">School</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Urgency</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Moderator actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests
                          .filter(r => r.title.toLowerCase().includes(modSearch.toLowerCase()))
                          .map(req => (
                            <tr key={req.request_id} className="border-b border-slate-200 hover:bg-slate-50 transition text-sm">
                              <td className="p-4 font-bold text-slate-900 max-w-xs truncate" title={req.title}>{req.title}</td>
                              <td className="p-4 font-medium text-slate-700">{req.schools?.name}</td>
                              <td className="p-4 capitalize">{req.type}</td>
                              <td className="p-4">{req.category}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                  req.urgency === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                  req.urgency === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  req.urgency === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                  'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                  {req.urgency}
                                </span>
                              </td>
                              <td className="p-4 font-medium text-slate-600">{req.status}</td>
                              <td className="p-4 text-right space-x-2">
                                {req.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleModerateRequest(req.request_id, 'cancel')}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition inline-flex items-center gap-1"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  onClick={() => handleModerateRequest(req.request_id, 'delete')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : modSubTab === 'sessions' ? (
                // Sessions moderation
                sessions.filter(s => s.title.toLowerCase().includes(modSearch.toLowerCase())).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-slate-500">No volunteer sessions found matching criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                          <th className="p-4">Session Title</th>
                          <th className="p-4">Volunteer</th>
                          <th className="p-4">School</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Moderator actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions
                          .filter(s => s.title.toLowerCase().includes(modSearch.toLowerCase()))
                          .map(ses => (
                            <tr key={ses.session_id} className="border-b border-slate-200 hover:bg-slate-50 transition text-sm">
                              <td className="p-4 font-bold text-slate-900 max-w-xs truncate" title={ses.title}>{ses.title}</td>
                              <td className="p-4 font-medium text-slate-700">
                                {ses.profiles?.first_name} {ses.profiles?.last_name}
                              </td>
                              <td className="p-4 font-medium text-slate-700">{ses.schools?.name}</td>
                              <td className="p-4 text-slate-500">{new Date(ses.session_date).toLocaleDateString()}</td>
                              <td className="p-4 capitalize font-semibold text-slate-600">{ses.status}</td>
                              <td className="p-4 text-right space-x-2">
                                {ses.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleModerateSession(ses.session_id, 'cancel')}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition inline-flex items-center gap-1"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  onClick={() => handleModerateSession(ses.session_id, 'delete')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                // Feedback moderation
                ratings.filter(r => (r.comment || '').toLowerCase().includes(modSearch.toLowerCase()) || (r.title || '').toLowerCase().includes(modSearch.toLowerCase())).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-slate-500">No ratings or feedback reviews found matching criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                          <th className="p-4">Rater</th>
                          <th className="p-4">Ratee</th>
                          <th className="p-4">Rating</th>
                          <th className="p-4">Comment</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Moderator actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratings
                          .filter(r => (r.comment || '').toLowerCase().includes(modSearch.toLowerCase()) || (r.title || '').toLowerCase().includes(modSearch.toLowerCase()))
                          .map(rat => {
                            const raterName = rat.rater ? `${rat.rater.first_name} ${rat.rater.last_name}` : 'Unknown';
                            const rateeName = rat.ratee ? `${rat.ratee.first_name} ${rat.ratee.last_name}` : 'Unknown';
                            return (
                              <tr key={rat.rating_id} className="border-b border-slate-200 hover:bg-slate-50 transition text-sm">
                                <td className="p-4">
                                  <div className="font-semibold text-slate-900">{raterName}</div>
                                  <div className="text-xs text-slate-500 capitalize">{rat.rater?.role}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-slate-900">{rateeName}</div>
                                  <div className="text-xs text-slate-500 capitalize">{rat.ratee?.role}</div>
                                </td>
                                <td className="p-4 text-amber-500 font-bold">{rat.rating} ★</td>
                                <td className="p-4 max-w-sm truncate" title={rat.comment || undefined}>
                                  {rat.title && <span className="font-semibold block text-xs">{rat.title}</span>}
                                  {rat.comment || <span className="text-slate-400 italic">No comment left</span>}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                    rat.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {rat.is_verified ? 'Verified' : 'Pending'}
                                  </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleModerateRating(rat.rating_id, rat.is_verified ? 'unverify' : 'verify')}
                                    disabled={actionLoading}
                                    className={`px-2.5 py-1 text-xs font-bold border rounded-lg transition inline-flex items-center gap-1 ${
                                      rat.is_verified ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {rat.is_verified ? 'Unverify' : 'Verify'}
                                  </button>
                                  <button
                                    onClick={() => handleModerateRating(rat.rating_id, 'delete')}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
