'use client';

import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ActionButton from './ActionButton';
import CreateSessionModal from './CreateSessionModal';
import { fetchVolunteerSessions } from '@/app/dashboard/actions';

interface VolunteerDashboardProps {
  firstName: string;
  isOrganization?: boolean;
  organizationName?: string;
}

interface Session {
  id: string;
  title: string;
  subject?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  max_students?: number;
  status: 'Proposed' | 'Approved' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled';
  schools?: { name: string; type?: string; address?: string };
  topic?: string;
}

interface Opportunity {
  request_id: string;
  title: string;
  description?: string;
  category?: string;
  type?: string;
  urgency?: string;
  status?: string;
  required_volunteers?: number | null;
  students_impacted?: number | null;
  location?: string | null;
  deadline_date?: string | null;
  schools?: { name: string; type?: string; address?: string } | null;
}

export default function VolunteerDashboard({ firstName, isOrganization = false, organizationName }: VolunteerDashboardProps) {
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Proposed');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppsError, setOppsError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Map status values to tab names for filtering
  const getTabStatusFilter = (tab: string): string[] => {
    switch (tab) {
      case 'Proposed':
        return ['Proposed'];
      case 'Upcoming':
        return ['Confirmed', 'Approved', 'In Progress'];
      case 'Completed':
        return ['Completed'];
      case 'Cancelled':
        return ['Cancelled', 'Rescheduled'];
      default:
        return ['Proposed'];
    }
  };

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchVolunteerSessions();
        if (result.success) {
          // Normalize session id field
          const mapped = (result.data || []).map((s) => ({
            id: s.session_id || s.id,
            title: s.title,
            subject: s.subject,
            session_date: s.session_date,
            start_time: s.start_time,
            end_time: s.end_time,
            location: s.location,
            max_students: s.max_students,
            status: s.status,
            schools: s.schools || s.schools || (s.schools ? s.schools : s.school) ,
            topic: s.topic,
          }));

          setSessions(mapped || []);
        } else {
          setError(result.error || 'Failed to load sessions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
    // Fetch teaching opportunities (requests made by schools)
    const loadOpportunities = async () => {
      setOppsLoading(true);
      setOppsError(null);
      try {
        // Fetch only volunteer teaching requests
        const res = await fetch('/api/requests?category=Volunteer%20Teaching&type=volunteer');
        if (!res.ok) throw new Error('Failed to fetch opportunities');
        const body = await res.json();
        setOpportunities(body.requests || []);
      } catch (err) {
        setOppsError(err instanceof Error ? err.message : 'Failed to load opportunities');
      } finally {
        setOppsLoading(false);
      }
    };

    loadOpportunities();
  }, []);

  const getFilteredSessions = () => {
    const statusFilter = getTabStatusFilter(selectedTab);
    return sessions.filter(session => statusFilter.includes(session.status));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Proposed':
        return 'bg-yellow-100 text-yellow-700';
      case 'Approved':
      case 'Confirmed':
      case 'In Progress':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      case 'Cancelled':
      case 'Rescheduled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredSessions = getFilteredSessions();
  // calendar helpers
  const startOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstWeekDay = startOfMonth.getDay();

  const daysArray = Array.from({ length: firstWeekDay + daysInMonth }, (_, i) => i - firstWeekDay + 1);
  const sessionDaysSet = new Set<number>();
  sessions.forEach(s => {
    try {
      const d = new Date(s.session_date);
      if (d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear()) {
        sessionDaysSet.add(d.getDate());
      }
    } catch {
      // ignore invalid dates
    }
  });
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">
            Welcome back, {firstName}! 
          </h2>
          {isOrganization && organizationName && (
            <p className="text-purple-100 text-lg mb-4">{organizationName}</p>
          )}
          <p className="text-purple-50 max-w-2xl">
            {isOrganization 
              ? 'Manage your team, organize teaching sessions, and track your collective impact on students.'
              : 'Find volunteer opportunities, conduct teaching sessions, and make a difference in students\' lives.'}
          </p>
        </div>
      </div>

      {/* Impact Stats */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Your Impact Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Sessions Conducted"
            value={42}
            color="purple"
            trend={{ value: '+8 this month', isPositive: true }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Students Reached"
            value="1,850"
            color="blue"
            trend={{ value: '+320 this month', isPositive: true }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Schools Partnered"
            value={18}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            title="Upcoming Sessions"
            value={6}
            color="orange"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Proposed Sessions"
            value={4}
            color="indigo"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Completed Sessions"
            value={32}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
            title="Total Hours"
            value="248"
            color="pink"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Primary Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionButton
            title="Create Session"
            description="Propose a new teaching session"
            variant="primary"
            gradient="bg-gradient-to-br from-purple-500 to-pink-600 text-white"
            onClick={() => setIsCreateSessionOpen(true)}
            icon={
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <ActionButton
            title="Browse Requests"
            description="Find teaching opportunities"
            href="/requests"
            gradient="bg-gradient-to-br from-blue-50 to-indigo-50"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <ActionButton
            title="View Calendar"
            description="Manage your schedule"
            gradient="bg-gradient-to-br from-green-50 to-emerald-50"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <ActionButton
            title="Availability"
            description="Set your availability"
            gradient="bg-gradient-to-br from-orange-50 to-red-50"
            icon={
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Session Management Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Session Management
        </h3>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['Proposed', 'Upcoming', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 font-medium text-sm transition border-b-2 ${
                selectedTab === tab
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab} ({filteredSessions.filter(s => {
                const statusFilter = getTabStatusFilter(tab);
                return statusFilter.includes(s.status);
              }).length})
            </button>
          ))}
        </div>

        {/* Session List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No {selectedTab.toLowerCase()} sessions yet</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gradient-to-r from-white to-purple-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900 text-lg">{session.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {session.schools?.name || 'School'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(session.session_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {session.start_time} - {session.end_time}
                      </span>
                      {session.max_students && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Max {session.max_students} students
                        </span>
                      )}
                    </div>
                    {session.topic && (
                      <div className="mt-2 inline-flex items-center px-3 py-1 bg-purple-100 rounded-lg text-xs font-medium text-purple-700">
                        Topic: {session.topic}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                      Message School
                    </button>
                    {['Proposed', 'Confirmed', 'Approved'].includes(session.status) && (
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Teaching Opportunities */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Available Teaching Opportunities
          </h3>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>All Subjects</option>
              <option>Math</option>
              <option>Science</option>
              <option>English</option>
              <option>Arts</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>All Locations</option>
              <option>New York</option>
              <option>California</option>
              <option>Texas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {oppsLoading ? (
            <div className="col-span-3 text-center py-8">Loading opportunities...</div>
          ) : oppsError ? (
            <div className="col-span-3 text-center py-8 text-red-600">{oppsError}</div>
          ) : opportunities.length === 0 ? (
            <div className="col-span-3 text-center py-8">No teaching opportunities available</div>
          ) : (
            opportunities.map((opportunity) => (
              <div key={opportunity.request_id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition bg-gradient-to-br from-white to-blue-50">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    opportunity.schools?.type === 'Blind' ? 'bg-blue-100 text-blue-700' :
                    opportunity.schools?.type === 'Deaf' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {opportunity.schools?.type || 'School'} School
                  </span>
                  <button className="p-1 hover:bg-white rounded">
                    <svg className="w-5 h-5 text-gray-400 hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
                
                <h4 className="font-bold text-gray-900 mb-1 text-lg">{opportunity.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{opportunity.schools?.name}</p>
                
                <div className="space-y-2 mb-4 text-xs text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {opportunity.category || 'Volunteer Teaching'}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {opportunity.location || opportunity.schools?.address || 'Location not specified'}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {opportunity.students_impacted ? `${opportunity.students_impacted} students` : (opportunity.required_volunteers ? `${opportunity.required_volunteers} volunteers` : 'Students / Volunteers info')}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule: {opportunity.deadline_date || 'Flexible'}
                  </div>
                </div>
                
                <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm">
                  Offer to Help
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Calendar & Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            {daysArray.map((day, i) => {
              const isValid = day > 0 && day <= daysInMonth;
              const hasSession = isValid && sessionDaysSet.has(day);
              return (
                <div
                  key={i}
                  className={`text-center text-sm py-2 rounded-lg ${
                    !isValid ? 'text-gray-300' : hasSession ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  {isValid ? day : ''}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-purple-600 rounded"></div>
              <span className="text-gray-700">Today&apos;s Session</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-purple-100 rounded"></div>
              <span className="text-gray-700">Upcoming Sessions</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
              Export Calendar
            </button>
            <button className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
              Set Availability
            </button>
          </div>
        </div>

        {/* Communication & Feedback */}
        <div className="space-y-6">
          {/* Messages */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Messages
              </span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">6 New</span>
            </h3>
            <div className="space-y-2">
              {[
                { school: 'Sunrise School', session: 'Math Session', message: 'Looking forward to tomorrow&apos;s session...', time: '15m ago', unread: true },
                { school: 'Hope School', session: 'Science Workshop', message: 'Materials have been prepared...', time: '2h ago', unread: true },
                { school: 'Rural Elementary', session: 'English Lit', message: 'Thank you for the last session...', time: '5h ago', unread: false },
              ].map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg cursor-pointer transition ${msg.unread ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full ${msg.unread ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{msg.school}</p>
                        <p className="text-xs text-gray-500">{msg.session}</p>
                        <p className="text-xs text-gray-600 truncate mt-1">{msg.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 text-center text-indigo-600 font-medium text-sm hover:bg-indigo-50 rounded-lg transition">
              View All Messages
            </button>
          </div>

          {/* Feedback Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Recent Feedback
            </h3>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-bold text-gray-900">4.9</div>
              <div>
                <div className="flex items-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600">Based on 38 reviews</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { school: 'Sunrise School', comment: 'Excellent teaching methods! Students loved it.', rating: 5 },
                { school: 'Hope School', comment: 'Very engaging and well-prepared.', rating: 5 },
              ].map((feedback, index) => (
                <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
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
                  <p className="text-xs text-gray-700">{feedback.comment}</p>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full py-2 text-center text-yellow-700 font-medium text-sm hover:bg-yellow-50 rounded-lg transition border border-yellow-200">
              View All Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Organization Team Management (if applicable) */}
      {isOrganization && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Team Management
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'John Smith', role: 'Lead Instructor', sessions: 15, rating: 4.9, status: 'Active' },
              { name: 'Sarah Johnson', role: 'Math Specialist', sessions: 12, rating: 4.8, status: 'Active' },
              { name: 'Mike Davis', role: 'Science Teacher', sessions: 10, rating: 5.0, status: 'Active' },
            ].map((member, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-700 font-bold text-lg">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {member.status}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{member.role}</p>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>{member.sessions} sessions</span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 fill-current mr-1" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    {member.rating}
                  </span>
                </div>
                <button className="w-full py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition">
                  View Details
                </button>
              </div>
            ))}
          </div>
          
          <button className="mt-4 w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition">
            + Add New Team Member
          </button>
        </div>
      )}

      {/* Reports & Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Impact Reports
          </h3>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition">
            Download Full Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
            <div className="text-4xl font-bold text-purple-600 mb-2">248</div>
            <p className="text-sm text-gray-600">Total Teaching Hours</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-4xl font-bold text-blue-600 mb-2">1,850</div>
            <p className="text-sm text-gray-600">Students Impacted</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
            <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
            <p className="text-sm text-gray-600">Positive Feedback</p>
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={isCreateSessionOpen}
        onClose={() => setIsCreateSessionOpen(false)}
      />
    </div>
  );
}
