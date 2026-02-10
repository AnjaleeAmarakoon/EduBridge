import Link from 'next/link';
import type { Request } from '@/lib/types/database';

interface RequestCardProps {
  request: Request & {
    schools: {
      name: string;
      type: string;
      address: string;
    };
  };
}

export default function RequestCard({ request }: RequestCardProps) {
  const progressPercentage = request.target_amount 
    ? Math.min((request.raised_amount / request.target_amount) * 100, 100)
    : 0;

  const urgencyColors = {
    Low: 'bg-blue-100 text-blue-700 border-blue-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  };

  const typeColors = {
    money: 'bg-green-50 text-green-700',
    goods: 'bg-purple-50 text-purple-700',
    volunteer: 'bg-blue-50 text-blue-700',
  };

  const statusColors = {
    Open: 'bg-green-100 text-green-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Fulfilled: 'bg-gray-100 text-gray-700',
    Closed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <Link href={`/requests/${request.request_id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${urgencyColors[request.urgency]}`}>
                {request.urgency}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[request.type]}`}>
                {request.type === 'money' ? '💰 Money' : request.type === 'goods' ? '📦 Goods' : '👥 Volunteer'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-purple-600 transition">
              {request.title}
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[request.status]}`}>
            {request.status}
          </span>
        </div>

        {/* School Info */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-medium">{request.schools.name}</span>
          <span className="text-gray-400">•</span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded">{request.schools.type}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {request.description}
        </p>

        {/* Category */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-gray-50 text-gray-700 text-xs rounded-lg border border-gray-200">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {request.category}
          </span>
        </div>

        {/* Progress Bar (for money requests) */}
        {request.type === 'money' && request.target_amount && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                Raised: <span className="font-bold text-green-600">${request.raised_amount.toLocaleString()}</span>
              </span>
              <span className="text-gray-600">
                Goal: <span className="font-bold">${request.target_amount.toLocaleString()}</span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{progressPercentage.toFixed(0)}% funded</p>
          </div>
        )}

        {/* Volunteer requests */}
        {request.type === 'volunteer' && request.required_volunteers && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-gray-700">
                <span className="font-bold text-blue-600">{request.volunteers_responded}</span> / {request.required_volunteers} volunteers responded
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {request.students_impacted && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{request.students_impacted} students</span>
              </div>
            )}
            {request.deadline_date && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Due: {new Date(request.deadline_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <button className="text-purple-600 font-semibold text-sm hover:text-purple-700 flex items-center gap-1 group">
            View Details
            <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
