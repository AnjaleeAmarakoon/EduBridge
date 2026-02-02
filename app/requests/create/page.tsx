'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRequest } from '../actions';
import type { RequestCategory, RequestType, Urgency } from '@/lib/types/database';

export default function CreateRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Education Materials' as RequestCategory,
    type: 'money' as RequestType,
    urgency: 'Medium' as Urgency,
    target_amount: '',
    required_volunteers: '',
    students_impacted: '',
    deadline_date: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        urgency: formData.urgency,
        location: formData.location || undefined,
        students_impacted: formData.students_impacted ? parseInt(formData.students_impacted) : undefined,
        deadline_date: formData.deadline_date || undefined,
      };

      if (formData.type === 'money' && formData.target_amount) {
        data.target_amount = parseFloat(formData.target_amount);
      }

      if (formData.type === 'volunteer' && formData.required_volunteers) {
        data.required_volunteers = parseInt(formData.required_volunteers);
      }

      const result = await createRequest(data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/requests');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categories: RequestCategory[] = [
    'Education Materials',
    'Infrastructure',
    'Technology',
    'Volunteer Teaching',
    'Special Equipment',
    'Food & Nutrition',
    'Healthcare',
    'Other',
  ];

  const urgencies: Urgency[] = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Request</h1>
          <p className="text-lg text-gray-600">
            Share your school's needs with the community and connect with donors and volunteers
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Request Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Braille Learning Materials for 45 Students"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Provide detailed information about your request, why it's needed, and how it will help your students..."
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                Category *
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as RequestCategory })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">
                Request Type *
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as RequestType })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="money">💰 Money</option>
                <option value="goods">📦 Goods</option>
                <option value="volunteer">👥 Volunteer</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields Based on Type */}
          {formData.type === 'money' && (
            <div className="mb-6">
              <label htmlFor="target_amount" className="block text-sm font-semibold text-gray-900 mb-2">
                Target Amount ($) *
              </label>
              <input
                type="number"
                id="target_amount"
                required={formData.type === 'money'}
                min="0"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="5000"
              />
            </div>
          )}

          {formData.type === 'volunteer' && (
            <div className="mb-6">
              <label htmlFor="required_volunteers" className="block text-sm font-semibold text-gray-900 mb-2">
                Number of Volunteers Needed *
              </label>
              <input
                type="number"
                id="required_volunteers"
                required={formData.type === 'volunteer'}
                min="1"
                value={formData.required_volunteers}
                onChange={(e) => setFormData({ ...formData, required_volunteers: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="3"
              />
            </div>
          )}

          {/* Urgency and Students Impacted */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="urgency" className="block text-sm font-semibold text-gray-900 mb-2">
                Urgency *
              </label>
              <select
                id="urgency"
                required
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as Urgency })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {urgencies.map((urg) => (
                  <option key={urg} value={urg}>{urg}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="students_impacted" className="block text-sm font-semibold text-gray-900 mb-2">
                Students Impacted
              </label>
              <input
                type="number"
                id="students_impacted"
                min="1"
                value={formData.students_impacted}
                onChange={(e) => setFormData({ ...formData, students_impacted: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="45"
              />
            </div>
          </div>

          {/* Deadline and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="deadline_date" className="block text-sm font-semibold text-gray-900 mb-2">
                Deadline Date
              </label>
              <input
                type="date"
                id="deadline_date"
                value={formData.deadline_date}
                onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="New York, NY"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
