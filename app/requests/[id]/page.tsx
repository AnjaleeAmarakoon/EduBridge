import { RequestService } from '@/services/request.service';
import Link from 'next/link';
import RespondButton from './RespondButton';
import { notFound } from 'next/navigation';
import type { RequestType } from '@/lib/types/database';

interface School {
  name: string;
  type: string;
  address: string;
  contact_person: string;
}

interface RequestDetail {
  request_id: string;
  title: string;
  description: string;
  category: string;
  type: RequestType;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Fulfilled' | 'Closed' | 'Cancelled';
  target_amount?: number | null;
  raised_amount: number;
  required_volunteers?: number | null;
  volunteers_responded: number;
  students_impacted?: number | null;
  deadline_date?: string | null;
  location?: string | null;
  schools: School;
}

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let request: RequestDetail | null = null;
  let responseCount = 0;
  let error: string | null = null;

  try {
    const result = await RequestService.getRequestById(params.id);
    request = result.request as RequestDetail;
    responseCount = result.responseCount;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load request';
  }

  if (error || !request) {
    notFound();
  }

  const progressPercentage = request.target_amount 
    ? Math.min((request.raised_amount / request.target_amount) * 100, 100)
    : 0;

  const urgencyColors: Record<string, string> = {
    Low: 'bg-blue-100 text-blue-700 border-blue-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusColors: Record<string, string> = {
    Open: 'bg-green-100 text-green-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Fulfilled: 'bg-gray-100 text-gray-700',
    Closed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/requests" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Requests
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${urgencyColors[request.urgency]}`}>
                      {request.urgency} Priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{request.title}</h1>
                  <p className="text-gray-600">Category: {request.category}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
                {request.students_impacted && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Students Impacted</p>
                      <p className="text-xl font-bold text-gray-900">{request.students_impacted}</p>
                    </div>
                  </div>
                )}

                {request.deadline_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deadline</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(request.deadline_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {request.location && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-lg font-bold text-gray-900">{request.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Responses</p>
                    <p className="text-xl font-bold text-gray-900">{responseCount}</p>
                  </div>
                </div>
              </div>

              {/* Progress (for money requests) */}
              {request.type === 'money' && request.target_amount && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Funding Progress</h2>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-600">
                      Raised: <span className="font-bold text-green-600 text-lg">${(request.raised_amount || 0).toLocaleString()}</span>
                    </span>
                    <span className="text-gray-600">
                      Goal: <span className="font-bold text-lg">${(request.target_amount || 0).toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      {progressPercentage > 10 && (
                        <span className="text-white text-xs font-bold">{progressPercentage.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">${((request.target_amount || 0) - (request.raised_amount || 0)).toLocaleString()} remaining</p>
                </div>
              )}

              {/* Volunteer Progress */}
              {request.type === 'volunteer' && request.required_volunteers && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Volunteer Progress</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(((request.volunteers_responded || 0) / (request.required_volunteers || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {request.volunteers_responded || 0} / {request.required_volunteers || 0} volunteers
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* School Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">School Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">School Name</p>
                  <p className="font-semibold text-gray-900">{request.schools.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {request.schools.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-900">{request.schools.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Person</p>
                  <p className="text-gray-900">{request.schools.contact_person}</p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            {request.status === 'Open' && (
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Ready to Help?</h3>
                <p className="mb-6 text-purple-100">
                  Express your interest and make a difference in the lives of these students.
                </p>
                <RespondButton requestId={request.request_id} requestType={request.type} />
              </div>
            )}

            {/* Share */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share This Request</h3>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  Facebook
                </button>
                <button className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition">
                  Twitter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
