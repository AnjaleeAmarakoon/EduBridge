'use client';

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import ActionButton from './ActionButton';
import { fetchUrgentRequests, fetchDonorDonations } from '../actions';
import {
  getReviewsListAction,
  getPendingFeedbackAction,
  type PendingDonation,
  type PendingSession
} from '../actions.feedback';

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
import { formatCurrency } from '@/lib/currency';
import DonationModal from '@/app/requests/[id]/DonationModal';
import { createClient } from '@/lib/supabase/client';
import FeedbackModal from './FeedbackModal';

interface DonorDashboardProps {
  firstName: string;
}

interface UrgentRequest {
  request_id: string;
  title: string;
  school_name: string;
  urgency: string;
  location: string;
  students_impacted: number;
  target_amount: number;
  raised_amount: number;
  type: 'money' | 'goods';
  schools?: {
    name: string;
  };
}

interface DonorDonation {
  donation_id: string;
  donation_type: 'money' | 'goods';
  amount?: number | null;
  items_donated?: Record<string, unknown> | null;
  status: 'Pending' | 'Confirmed' | 'In Transit' | 'Delivered' | 'Cancelled';
  created_at: string;
  requests?: {
    title: string;
  } | null;
  schools?: {
    name: string;
    user_id?: string;
    school_id?: string;
  } | null;
}

export default function DonorDashboard({ firstName }: DonorDashboardProps) {
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [donations, setDonations] = useState<DonorDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationsLoading, setDonationsLoading] = useState(true);

  // Feedback states
  const [reviewsList, setReviewsList] = useState<FeedbackReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{ donations: PendingDonation[]; sessions: PendingSession[] }>({ donations: [], sessions: [] });
  const [feedbackModalTarget, setFeedbackModalTarget] = useState<{
    rateeId: string;
    rateeName: string;
    ratingType: 'session' | 'donation' | 'volunteer' | 'school' | 'donor';
    relatedSessionId?: string;
    relatedDonationId?: string;
  } | null>(null);

  const donorStats = React.useMemo(() => {
    const activeStatuses = ['Pending', 'Confirmed', 'In Transit'];
    const validDonations = donations.filter(d => d.status !== 'Cancelled');
    
    const totalDonated = validDonations.reduce((sum, d) => d.donation_type === 'money' ? sum + (d.amount || 0) : sum, 0);
    const donationsMade = validDonations.length;
    
    const uniqueSchools = new Set(
      validDonations
        .map(d => d.schools?.name || d.schools?.school_id || '')
        .filter(name => name !== '')
    );
    const schoolsSupported = uniqueSchools.size;
    
    const activeDonations = donations.filter(d => activeStatuses.includes(d.status)).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthDonated = validDonations
      .filter(d => d.donation_type === 'money' && new Date(d.created_at) >= startOfMonth)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
      
    const thisMonthCount = validDonations.filter(d => new Date(d.created_at) >= startOfMonth).length;

    return {
      totalDonated,
      donationsMade,
      schoolsSupported,
      activeDonations,
      thisMonthDonated,
      thisMonthCount
    };
  }, [donations]);

  const refreshDonationsAndRatings = async () => {
    // Refresh donations
    const donRes = await fetchDonorDonations();
    if (donRes.success) {
      setDonations(donRes.data);
    }
    
    // Refresh ratings
    const clientSupabase = createClient();
    const { data: { user } } = await clientSupabase.auth.getUser();
    if (user) {
      const rev = await getReviewsListAction(user.id);
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
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchUrgentRequests().then((result) => {
        if (result.success && mounted) {
          setUrgentRequests(result.data);
        } else if (mounted) {
          setUrgentRequests([]);
        }
        if (mounted) setLoading(false);
      }),
      fetchDonorDonations().then((result) => {
        if (result.success && mounted) {
          setDonations(result.data);
        } else if (mounted) {
          setDonations([]);
        }
        if (mounted) setDonationsLoading(false);
      }),
    ]);

    // Fetch user and feedback reviews
    const loadFeedbackData = async () => {
      try {
        const clientSupabase = createClient();
        const { data: { user } } = await clientSupabase.auth.getUser();
        if (user && mounted) {
          setReviewsLoading(true);
          const rev = await getReviewsListAction(user.id);
          if (rev.success && mounted) {
            setReviewsList(rev.reviews || []);
          }
          if (mounted) setReviewsLoading(false);

          const pending = await getPendingFeedbackAction();
          if (pending.success && mounted) {
            setPendingFeedback({
              donations: pending.donations || [],
              sessions: pending.sessions || []
            });
          }
        }
      } catch (e) {
        console.error('Failed to load donor reviews', e);
      }
    };

    loadFeedbackData();
    return () => { mounted = false; };
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Welcome back, {firstName}! </h2>
          <div className="mb-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm border border-white/30 shadow-sm">Donator Dashboard</span>
          </div>
          <p className="text-green-50 max-w-2xl">
            Track your donations, browse requests from schools, and see the difference you&apos;re making in students&apos; lives.
          </p>
        </div>
      </div>

      {/* Impact Stats */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Your Impact Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Donated"
            value={formatCurrency(donorStats.totalDonated)}
            color="green"
            trend={donorStats.thisMonthDonated > 0 ? { value: formatCurrency(donorStats.thisMonthDonated) + ' this month', isPositive: true } : undefined}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Donations Made"
            value={donorStats.donationsMade}
            color="blue"
            trend={donorStats.thisMonthCount > 0 ? { value: `+${donorStats.thisMonthCount} this month`, isPositive: true } : undefined}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            title="Schools Supported"
            value={donorStats.schoolsSupported}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatCard
            title="Active Donations"
            value={donorStats.activeDonations}
            color="indigo"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Primary Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            title="Browse Requests"
            description="Discover schools in need"
            href="/requests"
            variant="primary"
            gradient="bg-gradient-to-br from-green-500 to-emerald-600 text-white"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <ActionButton
            title="My Donations"
            description="Track your contributions"
            gradient="bg-gradient-to-br from-blue-50 to-indigo-50"
            onClick={() => {
              const element = document.getElementById('recent-donations-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <ActionButton
            title="Messages"
            description="Connect with schools"
            gradient="bg-gradient-to-br from-purple-50 to-pink-50"
            icon={
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Featured Requests Carousel */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Urgent Requests
          </h3>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="text-gray-600">Loading urgent requests...</div>
            </div>
          ) : urgentRequests.length === 0 ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="text-gray-600">No urgent requests at the moment.</div>
            </div>
          ) : (
            urgentRequests.slice(0, 3).map((request) => (
              <div key={request.request_id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    request.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {request.urgency}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <h4 className="font-bold text-gray-900 mb-2 text-lg">{request.title}</h4>
                <p className="text-sm text-gray-600 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {request.schools?.name || 'School'}
                </p>
                
                <div className="flex items-center gap-3 mb-4 text-xs text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {request.location || 'Location'}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {request.students_impacted} students
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Goal</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(request.target_amount)}</p>
                  </div>
                  <DonationModal
                    requestId={request.request_id}
                    requestType={request.type || 'money'}
                    triggerText="Donate Now"
                    triggerClassName="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Donations Overview */}
      <div id="recent-donations-section" className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Donations
          </h3>
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
            View All →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">School</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Request</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="pb-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donationsLoading ? (
                <tr>
                  <td colSpan={7} className="py-4 px-4 text-center text-sm text-gray-600">
                    Loading donations...
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 px-4 text-center text-sm text-gray-600">
                    No donations yet. Start making a difference today!
                  </td>
                </tr>
              ) : (
                donations.map((donation) => (
                  <tr key={donation.donation_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{donation.schools?.name || 'Unknown'}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{donation.requests?.title || 'General Donation'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        donation.donation_type === 'money' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {donation.donation_type === 'money' ? 'Money' : 'Goods'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {donation.donation_type === 'money' ? formatCurrency(donation.amount || 0) : 'Items'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        donation.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        donation.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                        donation.status === 'Confirmed' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-blue-50 rounded-lg transition" title="View">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {pendingFeedback.donations.some(d => d.donation_id === donation.donation_id) && donation.schools?.user_id && (
                          <button
                            onClick={() => {
                              if (donation.schools?.user_id) {
                                setFeedbackModalTarget({
                                  rateeId: donation.schools.user_id,
                                  rateeName: donation.schools.name,
                                  ratingType: 'school',
                                  relatedDonationId: donation.donation_id
                                });
                              }
                            }}
                            className="p-2 hover:bg-yellow-50 rounded-lg transition text-yellow-600"
                            title="Rate School"
                          >
                            <svg className="w-4 h-4 fill-current animate-pulse" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        )}
                        <button className="p-2 hover:bg-purple-50 rounded-lg transition" title="Message">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Communications & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Conversations
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">5 New</span>
          </h3>
          <div className="space-y-2">
            {[
              { school: 'Sunrise School', message: 'Thank you for your generous donation...', time: '10m ago', unread: true },
              { school: 'Hope School', message: 'Your goods have been received...', time: '1h ago', unread: true },
              { school: 'Rural Elementary', message: 'We appreciate your support...', time: '3h ago', unread: false },
            ].map((msg, index) => (
              <div key={index} className={`p-3 rounded-lg cursor-pointer transition ${msg.unread ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${msg.unread ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{msg.school}</p>
                      <p className="text-xs text-gray-600 truncate">{msg.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-center text-purple-600 font-medium text-sm hover:bg-purple-50 rounded-lg transition">
            View All Conversations
          </button>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
            <span className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Feedback from Schools
            </span>
            {reviewsList.length > 0 && (
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                {reviewsList.length}
              </span>
            )}
          </h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Loading reviews...</p>
            ) : reviewsList.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-8 bg-gray-50 rounded-xl">No feedback received yet.</p>
            ) : (
              reviewsList.map((review) => (
                <div key={review.rating_id} className="p-4 bg-yellow-50/40 rounded-xl border border-yellow-100/70 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm">
                        {review.rater?.first_name} {review.rater?.last_name}
                      </p>
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[9px] font-bold uppercase tracking-wider scale-95 origin-left">
                        School
                      </span>
                    </div>
                    <div className="flex text-amber-400 text-sm select-none">
                      {'★'.repeat(review.rating)}
                    </div>
                  </div>
                  {review.title && <p className="font-semibold text-gray-800 text-xs mb-1">{review.title}</p>}
                  {review.comment && <p className="text-xs text-gray-700 leading-relaxed mb-2 break-words">{review.comment}</p>}
                  {review.feedback_categories && review.feedback_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {review.feedback_categories.map((cat: string) => (
                        <span key={cat} className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[9px] font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="block text-[9px] text-gray-400 mt-2 text-right">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {feedbackModalTarget && (
        <FeedbackModal
          isOpen={!!feedbackModalTarget}
          onClose={() => setFeedbackModalTarget(null)}
          onSubmitSuccess={refreshDonationsAndRatings}
          rateeId={feedbackModalTarget.rateeId}
          rateeName={feedbackModalTarget.rateeName}
          ratingType={feedbackModalTarget.ratingType}
          relatedDonationId={feedbackModalTarget.relatedDonationId}
        />
      )}
    </div>
  );
}
