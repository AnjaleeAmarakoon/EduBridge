'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  fetchSchoolSessions,
  fetchSchoolDonations,
  approveSessionProposalAction,
  declineSessionProposalAction,
  logSessionAttendanceAction,
  completeSessionAction,
} from '@/app/dashboard/actions';
import {
  getRatingsSummaryAction,
  getReviewsListAction,
  getPendingFeedbackAction,
  type RatingSummary,
  type PendingDonation,
  type PendingSession
} from '@/app/dashboard/actions.feedback';

interface FeedbackReview {
  rating_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  feedback_categories: string[];
  is_anonymous: boolean;
  is_verified: boolean;
  created_at: string;
  rater?: {
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}
import Link from 'next/link';
import StatCard from './StatCard';
import ActionButton from './ActionButton';
import type { Request, RequestCategory, RequestType, Urgency } from '@/lib/types/database';
import { formatCurrency } from '@/lib/currency';
import { createClient } from '@/lib/supabase/client';
import FeedbackModal from './FeedbackModal';

interface SchoolAdminDashboardProps {
  schoolName: string;
  firstName: string;
  requests: Request[];
}

interface VolunteerSession {
  session_id: string;
  status: string;
  title: string;
  profiles?: { first_name?: string; last_name?: string } | null;
  volunteer_id?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  registered_students?: number | null;
  max_students?: number | null;
}

interface Donation {
  donation_id: string;
  donor_id: string;
  donation_type: 'money' | 'goods';
  amount?: number | null;
  items_donated?: Record<string, unknown>[] | null;
  status: string;
  created_at: string;
  is_anonymous?: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
  } | null;
  requests?: {
    title: string;
  } | null;
}

export default function SchoolAdminDashboard({ schoolName, firstName, requests: initialRequests }: SchoolAdminDashboardProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    schoolName: schoolName,
    email: '',
    phone: '',
    location: '',
    description: '',
    postalCode: '',
    bankAccountDetails: '',
  });

  // Sessions and attendance state
  const [sessions, setSessions] = useState<VolunteerSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState<{ open: boolean; session?: VolunteerSession; csv?: string }>({ open: false });

  // Donations state
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);

  // Ratings and reviews state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratingsSummary, setRatingsSummary] = useState<RatingSummary | null>(null);
  const [reviewsList, setReviewsList] = useState<FeedbackReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{ donations: PendingDonation[]; sessions: PendingSession[] }>({ donations: [], sessions: [] });
  
  // Feedback modal state
  const [feedbackModalTarget, setFeedbackModalTarget] = useState<{
    rateeId: string;
    rateeName: string;
    ratingType: 'session' | 'donation' | 'volunteer' | 'school' | 'donor';
    relatedSessionId?: string;
    relatedDonationId?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setSessionsLoading(true);
      try {
        const res = await fetchSchoolSessions();
        if (res.success && mounted) setSessions(res.data || []);
      } catch (e) {
        console.error('Failed to load school sessions', e);
      } finally {
        if (mounted) setSessionsLoading(false);
      }

      setDonationsLoading(true);
      try {
        const res = await fetchSchoolDonations();
        if (res.success && mounted) setDonations(res.data || []);
      } catch (e) {
        console.error('Failed to load school donations', e);
      } finally {
        if (mounted) setDonationsLoading(false);
      }

      // Fetch user profile and ratings
      try {
        const clientSupabase = createClient();
        const { data: { user } } = await clientSupabase.auth.getUser();
        if (user && mounted) {
          setCurrentUserId(user.id);
          
          const sum = await getRatingsSummaryAction(user.id);
          if (mounted) setRatingsSummary(sum);

          setReviewsLoading(true);
          const rev = await getReviewsListAction(user.id);
          if (rev.success && mounted) {
            setReviewsList(rev.reviews || []);
          }
          setReviewsLoading(false);

          const pending = await getPendingFeedbackAction();
          if (pending.success && mounted) {
            setPendingFeedback({
              donations: pending.donations || [],
              sessions: pending.sessions || []
            });
          }
        }
      } catch (e) {
        console.error('Failed to load ratings/feedback', e);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const refreshRatingsAndPending = async () => {
    if (!currentUserId) return;
    try {
      const sum = await getRatingsSummaryAction(currentUserId);
      setRatingsSummary(sum);
      
      const rev = await getReviewsListAction(currentUserId);
      if (rev.success) {
        setReviewsList(rev.reviews || []);
      }

      const pending = await getPendingFeedbackAction();
      if (pending.success) {
        setPendingFeedback({
          donations: pending.donations || [],
          sessions: pending.sessions || []
        });
      }
    } catch (e) {
      console.error('Failed to refresh ratings', e);
    }
  };

  const refreshSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetchSchoolSessions();
      if (res.success) setSessions(res.data || []);
    } catch (e) {
      console.error('Error refreshing sessions', e);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleApprove = async (sessionId: string) => {
    try {
      const res = await approveSessionProposalAction(sessionId);
      if (res.success) {
        setSessions(prev => prev.map(s => (s.session_id === sessionId ? { ...s, status: 'Confirmed' } : s)));
      } else {
        alert(res.error || 'Failed to approve');
      }
    } catch (e) {
      alert((e as Error).message || 'Error');
    }
  };

  const handleDecline = async (sessionId: string) => {
    try {
      const res = await declineSessionProposalAction(sessionId);
      if (res.success) {
        setSessions(prev => prev.map(s => (s.session_id === sessionId ? { ...s, status: 'Cancelled' } : s)));
      } else {
        alert(res.error || 'Failed to decline');
      }
    } catch (e) {
      alert((e as Error).message || 'Error');
    }
  };

  const openAttendanceModal = (session: VolunteerSession) => {
    setAttendanceModal({ open: true, session, csv: '' });
  };

  const closeAttendanceModal = () => setAttendanceModal({ open: false });

  const submitAttendance = async () => {
    if (!attendanceModal.session) return;
    const lines = (attendanceModal.csv || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const participants = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return { student_name: parts[0] || null, attendance_status: parts[1] || null };
    });
    try {
      const res = await logSessionAttendanceAction(attendanceModal.session.session_id, participants);
      if (res.success) {
        alert('Attendance logged');
        closeAttendanceModal();
        refreshSessions();
      } else {
        alert(res.error || 'Failed to log attendance');
      }
    } catch (e) {
      alert((e as Error).message || 'Error');
    }
  };

  const handleMarkComplete = async (sessionId: string) => {
    try {
      const res = await completeSessionAction(sessionId);
      if (res.success) {
        setSessions(prev => prev.map(s => (s.session_id === sessionId ? { ...s, status: 'Completed' } : s)));
        refreshRatingsAndPending();
      } else {
        alert(res.error || 'Failed to complete session');
      }
    } catch (e) {
      alert((e as Error).message || 'Error');
    }
  };

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const openRequests = requests.filter(r => r.status === 'Open').length;
    const inProgressRequests = requests.filter(r => r.status === 'In Progress').length;
    const fulfilledRequests = requests.filter(r => r.status === 'Fulfilled').length;
    const totalResponses = requests.reduce((sum, r) => sum + r.volunteers_responded, 0);
    
    // Calculate active requests (Open + In Progress)
    const activeRequests = openRequests + inProgressRequests;
    
    return {
      totalRequests,
      openRequests,
      inProgressRequests,
      fulfilledRequests,
      activeRequests,
      totalResponses,
    };
  }, [requests]);

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           request.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const handleDeleteClick = (requestId: string, title: string) => {
    console.log('[handleDeleteClick] requestId:', requestId, 'title:', title);
    if (!requestId) {
      console.error('[handleDeleteClick] requestId is undefined!');
      alert('Error: Request ID is missing. Please refresh the page and try again.');
      return;
    }
    setDeleteConfirm({ id: requestId, title });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    console.log('[handleDeleteConfirm] deleteConfirm:', deleteConfirm);
    console.log('[handleDeleteConfirm] Calling DELETE /api/requests/', deleteConfirm.id);
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/requests/${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Delete failed:', data);
        alert(`Failed to delete request: ${data.error || 'Unknown error'}`);
        setDeleting(false);
        return;
      }

      // Remove from local state
      setRequests(requests.filter(r => r.request_id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setDeleting(false);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDeleting(false);
    }
  };

  const handleEditClick = (request: Request) => {
    setEditingRequest(request);
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    console.log('[handleSaveEdit] Saving request:', editingRequest.request_id);
    setSaving(true);

    try {
      const response = await fetch(`/api/requests/${editingRequest.request_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingRequest.title,
          description: editingRequest.description,
          category: editingRequest.category,
          type: editingRequest.type,
          urgency: editingRequest.urgency,
          target_amount: editingRequest.target_amount || undefined,
          required_items: editingRequest.required_items || undefined,
          required_volunteers: editingRequest.required_volunteers || undefined,
          students_impacted: editingRequest.students_impacted || undefined,
          deadline_date: editingRequest.deadline_date || undefined,
          location: editingRequest.location || undefined,
          image_url: editingRequest.image_url || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Save failed:', data);
        alert(`Failed to save request: ${data.error || 'Unknown error'}`);
        setSaving(false);
        return;
      }

      // Update local state with the edited request
      setRequests(requests.map(r => r.request_id === editingRequest.request_id ? editingRequest : r));
      setEditingRequest(null);
      setSaving(false);
      alert('Request updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/schools/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setUpdatingProfile(false);
      setSaving(false);
      alert('School profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert(`Error updating profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSaving(false);
    }
  };

  const handleOpenProfileModal = async () => {
    try {
      const response = await fetch('/api/schools/me');
      const data = await response.json();
      
      if (response.ok && data.school) {
        setProfileData({
          schoolName: data.school.name || schoolName,
          email: data.school.email || '',
          phone: data.school.phone || '',
          location: data.school.address || '',
          description: data.school.description || '',
          postalCode: data.school.postal_code || '',
          bankAccountDetails: data.school.bank_account_details || '',
        });
      }
    } catch (error) {
      console.error('Error fetching school data:', error);
    }
    setUpdatingProfile(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Welcome back, {firstName}! </h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm border border-white/30 shadow-sm">School Dashboard</span>
            <p className="text-blue-100 text-lg">{schoolName}</p>
          </div>
          <p className="text-blue-50 max-w-2xl">
            Manage your school profile, post resource requests, connect with donors and volunteers, and track your community support.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overview & Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            title="Active Requests"
            value={stats.activeRequests}
            color="orange"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Fulfilled Requests"
            value={stats.fulfilledRequests}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Responses"
            value={stats.totalResponses}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Primary Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionButton
            title="Create New Request"
            description="Post a new resource or volunteer request"
            variant="primary"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
            href="/requests/create"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <ActionButton
            title="View Calendar"
            description="Check your schedule and upcoming events"
            gradient="bg-gradient-to-br from-purple-50 to-pink-50"
            icon={
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <ActionButton
            title="Browse Requests"
            description="View all active requests"
            gradient="bg-gradient-to-br from-green-50 to-emerald-50"
            href="/requests"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <ActionButton
            title="Update Profile"
            description="Manage school information"
            gradient="bg-gradient-to-br from-orange-50 to-red-50"
            onClick={handleOpenProfileModal}
            icon={
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Request Management */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Active Requests
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>All Status</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Fulfilled</option>
              <option>Closed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Request Title</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Urgency</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Date Posted</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Interested</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests
                  .filter(r => r.request_id)  // Filter out any requests without a valid request_id
                  .slice(0, 10)
                  .map((request) => {
                  console.log('[SchoolAdminDashboard] Request object:', {
                    request_id: request.request_id,
                    title: request.title,
                    allKeys: Object.keys(request)
                  });
                  
                  const formattedDate = new Date(request.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={request.request_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Link href={`/requests/${request.request_id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {request.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {request.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                          request.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                          request.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {request.urgency}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                          request.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'Fulfilled' ? 'bg-green-100 text-green-700' :
                          request.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{formattedDate}</td>
                      <td className="py-4 px-4">
                        <span className="flex items-center text-sm font-medium text-gray-900">
                          <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {request.volunteers_responded}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Link href={`/requests/${request.request_id}`} className="p-2 hover:bg-blue-50 rounded-lg transition" title="View">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button 
                            onClick={() => handleEditClick(request)}
                            disabled={request.status !== 'Open'}
                            className={`p-2 rounded-lg transition ${request.status === 'Open' ? 'hover:bg-amber-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                            title={request.status === 'Open' ? 'Edit' : 'Only open requests can be edited'}
                          >
                            <svg className={`w-4 h-4 ${request.status === 'Open' ? 'text-amber-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(request.request_id, request.title)}
                            className="p-2 hover:bg-red-50 rounded-lg transition" 
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium mb-2">No requests found</p>
                      <p className="text-gray-400 mb-4">Create your first request to get started</p>
                      <Link
                        href="/requests/create"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Create Request
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Donations
          </h3>
          <div className="space-y-3">
            {donationsLoading ? (
              <div className="text-sm text-gray-600">Loading donations...</div>
            ) : donations.length === 0 ? (
              <div className="text-sm text-gray-600">No recent donations.</div>
            ) : (
              donations.slice(0, 5).map((donation) => {
                const donorName = donation.is_anonymous ? 'Anonymous' : (donation.profiles ? `${donation.profiles.first_name} ${donation.profiles.last_name}` : 'Unknown');
                const type = donation.donation_type === 'money' ? 'Money' : 'Goods';
                
                let amountStr = '';
                if (donation.donation_type === 'money') {
                  amountStr = formatCurrency(donation.amount || 0);
                } else if (donation.items_donated && Array.isArray(donation.items_donated) && donation.items_donated.length > 0) {
                  const firstItem = donation.items_donated[0];
                  amountStr = `${firstItem.quantity || ''} ${firstItem.item || 'Items'}`;
                } else {
                  amountStr = 'Goods';
                }
                
                const requestTitle = donation.requests ? donation.requests.title : 'General Donation';
                const formattedDate = new Date(donation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div key={donation.donation_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{donorName}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            type === 'Money' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{requestTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-gray-900">{amountStr}</span>
                          <span className="text-xs text-gray-500">• {formattedDate}</span>
                        </div>
                      </div>
                    </div>
                    <button className="ml-3 p-2 hover:bg-white rounded-lg transition" title={donation.status}>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Volunteer Sessions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Upcoming Volunteer Sessions
          </h3>
          <div className="space-y-3">
            {sessionsLoading ? (
              <div className="text-sm text-gray-600">Loading sessions...</div>
            ) : (
              (sessions || [])
                .filter(s => ['Confirmed', 'Approved', 'In Progress'].includes(s.status))
                .slice(0, 6)
                .map((session) => (
                  <div key={session.session_id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{session.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{session.profiles ? `${session.profiles.first_name} ${session.profiles.last_name}` : session.volunteer_id}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center">{new Date(session.session_date).toLocaleDateString()}</span>
                          <span className="flex items-center">{session.start_time} - {session.end_time}</span>
                          <span className="flex items-center">{session.registered_students || session.max_students || 0} students</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        <button onClick={() => {/* navigate to session detail if exists */}} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">View</button>
                        <button onClick={() => openAttendanceModal(session)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Log Attendance</button>
                        {session.status !== 'Completed' && (
                          <button onClick={() => handleMarkComplete(session.session_id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">Mark Completed</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Pending Proposals</h4>
            <div className="space-y-2">
              {(sessions || []).filter(s => s.status === 'Proposed').map((s) => (
                <div key={s.session_id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-600">by {s.profiles ? `${s.profiles.first_name} ${s.profiles.last_name}` : s.volunteer_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(s.session_id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">Approve</button>
                    <button onClick={() => handleDecline(s.session_id)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Communication & Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Recent Messages
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">8 New</span>
          </h3>
          <div className="space-y-2">
            {[
              { name: 'John Smith', message: 'I would like to help with your science lab...', time: '5m ago', unread: true },
              { name: 'Tech Corp', message: 'Our donation has been processed...', time: '1h ago', unread: true },
              { name: 'Sarah Johnson', message: 'Confirmed for the tutoring session...', time: '2h ago', unread: false },
            ].map((msg, index) => (
              <div key={index} className={`p-3 rounded-lg cursor-pointer transition ${msg.unread ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${msg.unread ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{msg.name}</p>
                      <p className="text-xs text-gray-600 truncate">{msg.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-center text-blue-600 font-medium text-sm hover:bg-blue-50 rounded-lg transition">
            View All Messages
          </button>
        </div>

        {/* Feedback & Profile */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Feedback & Rating
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-5xl font-bold text-gray-900">{ratingsSummary?.averageRating || '0.0'}</div>
                <div>
                  <div className="flex items-center mb-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avg = ratingsSummary?.averageRating || 0;
                      const fillStar = star <= Math.round(avg);
                      return (
                        <svg key={star} className={`w-5 h-5 ${fillStar ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600">Based on {ratingsSummary?.totalReviews || 0} reviews</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingsSummary?.starDistribution?.[star as 5 | 4 | 3 | 2 | 1] || 0;
                  const total = ratingsSummary?.totalReviews || 1;
                  const pct = ratingsSummary ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-12 text-gray-600 font-medium">{star} ★</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="w-12 text-right text-gray-600">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Reviews Checklist */}
          {(pendingFeedback.donations.length > 0 || pendingFeedback.sessions.length > 0) && (
            <div className="p-4 bg-yellow-50/60 rounded-xl border border-yellow-150 shadow-inner">
              <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Pending Feedback ({pendingFeedback.donations.length + pendingFeedback.sessions.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pendingFeedback.donations.map((donation) => {
                  const donorName = donation.profiles ? `${donation.profiles.first_name} ${donation.profiles.last_name}` : 'Donor';
                  const donationType = donation.donation_type === 'money' ? 'money' : 'goods';
                  return (
                    <div key={donation.donation_id} className="flex items-center justify-between text-xs p-2.5 bg-white rounded-lg border border-gray-150 shadow-sm gap-2">
                      <div className="truncate flex-1">
                        <span className="font-semibold text-gray-900">{donorName}</span> donated {donationType === 'money' ? formatCurrency(donation.amount) : 'goods'}
                      </div>
                      <button
                        onClick={() => {
                          if (donation.donor_id) {
                            setFeedbackModalTarget({
                              rateeId: donation.donor_id,
                              rateeName: donorName,
                              ratingType: 'donor',
                              relatedDonationId: donation.donation_id
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-bold transition shadow-sm"
                      >
                        Rate Donor
                      </button>
                    </div>
                  );
                })}
                {pendingFeedback.sessions.map((session) => {
                  const volunteerName = session.profiles ? `${session.profiles.first_name} ${session.profiles.last_name}` : 'Volunteer';
                  return (
                    <div key={session.session_id} className="flex items-center justify-between text-xs p-2.5 bg-white rounded-lg border border-gray-150 shadow-sm gap-2">
                      <div className="truncate flex-1">
                        <span className="font-semibold text-gray-900">{volunteerName}</span> completed &quot;{session.title}&quot;
                      </div>
                      <button
                        onClick={() => {
                          if (session.volunteer_id) {
                            setFeedbackModalTarget({
                              rateeId: session.volunteer_id,
                              rateeName: volunteerName,
                              ratingType: 'volunteer',
                              relatedSessionId: session.session_id
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-bold transition shadow-sm"
                      >
                        Rate Volunteer
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
              Reviews Received
              {reviewsList.length > 0 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-2xs font-semibold">
                  {reviewsList.length}
                </span>
              )}
            </h4>
            {reviewsLoading ? (
              <p className="text-xs text-gray-500">Loading reviews...</p>
            ) : reviewsList.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">No reviews received yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {reviewsList.map((review) => (
                  <div key={review.rating_id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs shadow-sm hover:shadow transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800">
                          {review.rater?.first_name} {review.rater?.last_name}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-semibold uppercase tracking-wider scale-95 origin-left">
                          {review.rater?.role === 'school_admin' ? 'School' : review.rater?.role}
                        </span>
                      </div>
                      <div className="flex text-amber-400 text-sm font-semibold select-none">
                        {'★'.repeat(review.rating)}
                      </div>
                    </div>
                    {review.title && <p className="font-bold text-gray-800 mb-1">{review.title}</p>}
                    {review.comment && <p className="text-gray-600 leading-relaxed break-words">{review.comment}</p>}
                    {review.feedback_categories && review.feedback_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {review.feedback_categories.map((cat: string) => (
                          <span key={cat} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[9px] font-medium">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="block text-[9px] text-gray-400 mt-2 text-right">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {feedbackModalTarget && (
        <FeedbackModal
          isOpen={!!feedbackModalTarget}
          onClose={() => setFeedbackModalTarget(null)}
          onSubmitSuccess={refreshRatingsAndPending}
          rateeId={feedbackModalTarget.rateeId}
          rateeName={feedbackModalTarget.rateeName}
          ratingType={feedbackModalTarget.ratingType}
          relatedSessionId={feedbackModalTarget.relatedSessionId}
          relatedDonationId={feedbackModalTarget.relatedDonationId}
        />
      )}

      {/* Attendance Modal */}
      {attendanceModal.open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Log Attendance for {attendanceModal.session?.title}</h3>
            <p className="text-sm text-gray-600 mb-4">Enter one participant per line as <strong>name,status</strong> (e.g. &quot;John Doe,Attended&quot;).</p>
            <textarea value={attendanceModal.csv || ''} onChange={(e) => setAttendanceModal(prev => ({ ...prev, csv: e.target.value }))} rows={8} className="w-full border border-gray-300 rounded-lg p-3 mb-4" />
            <div className="flex gap-3">
              <button onClick={closeAttendanceModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={submitAttendance} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit Attendance</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Request?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>&quot;{deleteConfirm.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRequest && (
        <>
          <style>{`
            .edit-modal-placeholder::placeholder {
              color: #000000 !important;
              opacity: 1 !important;
            }
            .edit-modal-placeholder::-webkit-input-placeholder {
              color: #000000 !important;
              opacity: 1 !important;
            }
            .edit-modal-placeholder::-moz-placeholder {
              color: #000000 !important;
              opacity: 1 !important;
            }
            .edit-modal-placeholder:-ms-input-placeholder {
              color: #000000 !important;
              opacity: 1 !important;
            }
            .edit-modal-placeholder:-moz-placeholder {
              color: #000000 !important;
              opacity: 1 !important;
            }
          `}</style>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="Enter request title"
                    value={editingRequest.title}
                    onChange={(e) => setEditingRequest({...editingRequest, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 edit-modal-placeholder"
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Enter detailed description of the request"
                  value={editingRequest.description}
                  onChange={(e) => setEditingRequest({...editingRequest, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 edit-modal-placeholder"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editingRequest.category}
                    onChange={(e) => setEditingRequest({...editingRequest, category: e.target.value as RequestCategory})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="" disabled>Select category</option>
                    <option>Education Materials</option>
                    <option>Infrastructure</option>
                    <option>Technology</option>
                    <option>Volunteer Teaching</option>
                    <option>Special Equipment</option>
                    <option>Food & Nutrition</option>
                    <option>Healthcare</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingRequest.type}
                    onChange={(e) => setEditingRequest({...editingRequest, type: e.target.value as RequestType})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="" disabled>Select type</option>
                    <option value="money">Money</option>
                    <option value="goods">Goods</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={editingRequest.urgency}
                    onChange={(e) => setEditingRequest({...editingRequest, urgency: e.target.value as Urgency})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="" disabled>Select urgency</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Enter school location"
                    value={editingRequest.location || ''}
                    onChange={(e) => setEditingRequest({...editingRequest, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 edit-modal-placeholder"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={editingRequest.deadline_date || ''}
                    onChange={(e) => setEditingRequest({...editingRequest, deadline_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Students Impacted</label>
                  <input
                    type="number"
                    placeholder="e.g., 150"
                    value={editingRequest.students_impacted || ''}
                    onChange={(e) => setEditingRequest({...editingRequest, students_impacted: parseInt(e.target.value) || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 edit-modal-placeholder"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingRequest(null)}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Update Profile Modal */}
      {updatingProfile && (
        <>
          <style>{`
            .profile-modal-placeholder::placeholder {
              color: #1f2937 !important;
              opacity: 1 !important;
            }
            .profile-modal-placeholder::-webkit-input-placeholder {
              color: #1f2937 !important;
              opacity: 1 !important;
            }
            .profile-modal-placeholder::-moz-placeholder {
              color: #1f2937 !important;
              opacity: 1 !important;
            }
          `}</style>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Update School Profile</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    placeholder="Enter school name"
                    value={profileData.schoolName}
                    onChange={(e) => setProfileData({...profileData, schoolName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Enter school email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter school phone number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Enter school location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Enter school description and details"
                    value={profileData.description}
                    onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code <span className="text-gray-500 text-xs">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Enter postal code"
                    value={profileData.postalCode}
                    onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Details <span className="text-gray-500 text-xs">(Optional)</span></label>
                  <textarea
                    placeholder="Enter bank account details for transactions (e.g., Account Holder Name, Account Number, Bank Name, IFSC Code)"
                    value={profileData.bankAccountDetails}
                    onChange={(e) => setProfileData({...profileData, bankAccountDetails: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 profile-modal-placeholder text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setUpdatingProfile(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
