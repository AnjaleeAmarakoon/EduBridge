'use client';

import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import ActionButton from './ActionButton';
import { fetchUrgentRequests } from '../actions';
import { formatCurrency, formatCurrencyTrend } from '@/lib/currency';

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
  type: string;
  schools?: {
    name: string;
  };
}

export default function DonorDashboard({ firstName }: DonorDashboardProps) {
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUrgentRequests().then((result) => {
      if (result.success) {
        setUrgentRequests(result.data);
      } else {
        setUrgentRequests([]);
      }
      setLoading(false);
    });
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Welcome back, {firstName}! </h2>
          <p className="text-green-100 text-lg mb-4">Your Impact Dashboard</p>
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
            value={formatCurrency(12450)}
            color="green"
            trend={{ value: formatCurrencyTrend(2500) + ' this month', isPositive: true }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Donations Made"
            value={34}
            color="blue"
            trend={{ value: '+5 this month', isPositive: true }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            title="Schools Supported"
            value={15}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            title="Students Impacted"
            value="~1,200"
            color="orange"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Active Donations"
            value={8}
            color="indigo"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Pending Confirmations"
            value={3}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Average Rating"
            value="4.9"
            color="teal"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <StatCard
            title="Tax-Deductible"
            value={formatCurrency(11200)}
            color="pink"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <ActionButton
            title="Tax Receipts"
            description="Download donation records"
            gradient="bg-gradient-to-br from-orange-50 to-red-50"
            icon={
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
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
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm">
                    Donate Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Donations Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
              {[
                { school: 'Sunrise School', request: 'Braille Materials', type: 'Money', amount: formatCurrency(800), status: 'Delivered', date: '2026-01-15' },
                { school: 'Hope School', request: 'Sign Language Books', type: 'Goods', amount: '25 Books', status: 'In Transit', date: '2026-01-14' },
                { school: 'Rural Elementary', request: 'Water System', type: 'Money', amount: formatCurrency(2500), status: 'Confirmed', date: '2026-01-12' },
                { school: 'City Middle School', request: 'Computer Lab', type: 'Money', amount: formatCurrency(1200), status: 'Pending', date: '2026-01-10' },
              ].map((donation, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{donation.school}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{donation.request}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      donation.type === 'Money' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {donation.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">{donation.amount}</td>
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
                  <td className="py-4 px-4 text-sm text-gray-600">{donation.date}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition" title="View">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-purple-50 rounded-lg transition" title="Message">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Analytics */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Donation Analytics
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Donations by Category</span>
                <button className="text-xs text-blue-600 hover:underline">Export</button>
              </div>
              <div className="space-y-3">
                {[
                  { category: 'Education Materials', amount: formatCurrency(5200), percentage: 42 },
                  { category: 'Infrastructure', amount: formatCurrency(4100), percentage: 33 },
                  { category: 'Technology', amount: formatCurrency(2150), percentage: 17 },
                  { category: 'Other', amount: formatCurrency(1000), percentage: 8 },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.category}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.amount}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Monthly Trend</h4>
              <div className="flex items-end justify-between h-32 gap-2">
                {[40, 60, 45, 80, 65, 90, 100].map((height, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t hover:from-green-600 hover:to-emerald-500 transition"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm">
                Download Report
              </button>
              <button className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-sm">
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Communications & Feedback */}
        <div className="space-y-6">
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
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Recent Feedback
            </h3>
            <div className="space-y-3">
              {[
                { school: 'Sunrise School', rating: 5, comment: 'Your contribution helped 45 students access braille materials!', date: '2 days ago' },
                { school: 'Rural Elementary', rating: 5, comment: 'The water system is now operational. Thank you!', date: '5 days ago' },
              ].map((feedback, index) => (
                <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{feedback.school}</p>
                    <div className="flex">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">{feedback.comment}</p>
                  <p className="text-xs text-gray-500">{feedback.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommended for You
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { school: 'Valley School for Blind', request: 'Audio Learning Devices', match: '95% Match' },
            { school: 'Mountain Rural School', request: 'Sports Equipment', match: '88% Match' },
            { school: 'Lakeside Deaf School', request: 'Visual Learning Tools', match: '92% Match' },
          ].map((rec, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
              <span className="inline-block px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold mb-2">
                {rec.match}
              </span>
              <h4 className="font-semibold text-gray-900 mb-1">{rec.request}</h4>
              <p className="text-sm text-gray-600 mb-3">{rec.school}</p>
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                View Request
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
