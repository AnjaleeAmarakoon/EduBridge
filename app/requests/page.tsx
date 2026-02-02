import { getRequests } from './actions';
import RequestCard from '@/app/components/requests/RequestCard';
import Link from 'next/link';

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { category?: string; type?: string; urgency?: string; search?: string };
}) {
  const { requests, error } = await getRequests(searchParams);

  const categories = [
    'Education Materials',
    'Infrastructure',
    'Technology',
    'Volunteer Teaching',
    'Special Equipment',
    'Food & Nutrition',
    'Healthcare',
    'Other',
  ];

  const types = [
    { value: 'money', label: '💰 Money', color: 'green' },
    { value: 'goods', label: '📦 Goods', color: 'purple' },
    { value: 'volunteer', label: '👥 Volunteer', color: 'blue' },
  ];

  const urgencies = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Browse Requests</h1>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Discover how you can make a difference in the lives of students at special needs schools
            </p>
            
            {/* Search Bar */}
            <form method="GET" className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchParams.search}
                  placeholder="Search requests..."
                  className="w-full px-6 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-300 pr-12"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </h2>

              {/* Request Type */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Request Type</h3>
                <div className="space-y-2">
                  {types.map((type) => (
                    <Link
                      key={type.value}
                      href={`/requests?${new URLSearchParams({ ...searchParams, type: type.value }).toString()}`}
                      className={`block px-4 py-2 rounded-lg text-sm transition ${
                        searchParams.type === type.value
                          ? `bg-${type.color}-100 text-${type.color}-700 font-medium`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {type.label}
                    </Link>
                  ))}
                  {searchParams.type && (
                    <Link
                      href="/requests"
                      className="block px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                    >
                      Clear filter
                    </Link>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={`/requests?${new URLSearchParams({ ...searchParams, category }).toString()}`}
                      className={`block px-4 py-2 rounded-lg text-sm transition ${
                        searchParams.category === category
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </Link>
                  ))}
                  {searchParams.category && (
                    <Link
                      href={`/requests?${new URLSearchParams({ ...searchParams, category: '' }).toString()}`}
                      className="block px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                    >
                      Clear filter
                    </Link>
                  )}
                </div>
              </div>

              {/* Urgency */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Urgency</h3>
                <div className="space-y-2">
                  {urgencies.map((urgency) => (
                    <Link
                      key={urgency}
                      href={`/requests?${new URLSearchParams({ ...searchParams, urgency }).toString()}`}
                      className={`block px-4 py-2 rounded-lg text-sm transition ${
                        searchParams.urgency === urgency
                          ? 'bg-orange-100 text-orange-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {urgency}
                    </Link>
                  ))}
                  {searchParams.urgency && (
                    <Link
                      href={`/requests?${new URLSearchParams({ ...searchParams, urgency: '' }).toString()}`}
                      className="block px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
                    >
                      Clear filter
                    </Link>
                  )}
                </div>
              </div>

              {/* Clear All */}
              {(searchParams.type || searchParams.category || searchParams.urgency || searchParams.search) && (
                <Link
                  href="/requests"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition text-center"
                >
                  Clear All Filters
                </Link>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {requests && requests.length > 0 ? (
                    <>Found {requests.length} request{requests.length !== 1 ? 's' : ''}</>
                  ) : (
                    'No requests found'
                  )}
                </h2>
                {(searchParams.type || searchParams.category || searchParams.urgency) && (
                  <p className="text-gray-600 mt-1">
                    Filtered by:{' '}
                    {[searchParams.type, searchParams.category, searchParams.urgency]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Requests Grid */}
            {requests && requests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((request) => (
                  <RequestCard key={request.request_id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-block p-8 bg-gray-100 rounded-full mb-6">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <Link
                  href="/requests"
                  className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Clear All Filters
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
