'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RequestCategory, RequestType, Urgency } from '@/lib/types/database';

interface RequiredItem {
  item: string;
  quantity: number;
  unit: string;
}

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
    image_url: '',
  });
  
  // For goods type requests
  const [requiredItems, setRequiredItems] = useState<RequiredItem[]>([{ item: '', quantity: 1, unit: 'pieces' }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.title.trim()) {
        setError('Please enter a title');
        setLoading(false);
        return;
      }

      if (!formData.description.trim() || formData.description.length < 20) {
        setError('Please provide a detailed description (at least 20 characters)');
        setLoading(false);
        return;
      }

      // Type-specific validation
      if (formData.type === 'money') {
        const amount = parseFloat(formData.target_amount);
        if (!formData.target_amount || amount <= 0) {
          setError('Please enter a valid target amount greater than 0');
          setLoading(false);
          return;
        }
      }

      if (formData.type === 'goods') {
        const validItems = requiredItems.filter(item => item.item.trim() !== '' && item.quantity > 0);
        if (validItems.length === 0) {
          setError('Please add at least one item for goods request');
          setLoading(false);
          return;
        }
      }

      if (formData.type === 'volunteer') {
        const volunteers = parseInt(formData.required_volunteers);
        if (!formData.required_volunteers || volunteers <= 0) {
          setError('Please enter the number of volunteers needed (at least 1)');
          setLoading(false);
          return;
        }
      }

      // Deadline validation
      if (formData.deadline_date) {
        const deadline = new Date(formData.deadline_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadline < today) {
          setError('Deadline date cannot be in the past');
          setLoading(false);
          return;
        }
      }

      const data: {
        title: string;
        description: string;
        category: RequestCategory;
        type: RequestType;
        urgency: Urgency;
        target_amount?: number;
        required_items?: RequiredItem[];
        required_volunteers?: number;
        students_impacted?: number;
        deadline_date?: string;
        location?: string;
        image_url?: string;
      } = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        urgency: formData.urgency,
        location: formData.location || undefined,
        students_impacted: formData.students_impacted ? parseInt(formData.students_impacted) : undefined,
        deadline_date: formData.deadline_date || undefined,
        image_url: formData.image_url || undefined,
      };

      if (formData.type === 'money' && formData.target_amount) {
        data.target_amount = parseFloat(formData.target_amount);
      }

      if (formData.type === 'goods') {
        const validItems = requiredItems.filter(item => item.item.trim() !== '' && item.quantity > 0);
        data.required_items = validItems;
      }

      if (formData.type === 'volunteer' && formData.required_volunteers) {
        data.required_volunteers = parseInt(formData.required_volunteers);
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create request');
        setLoading(false);
        return;
      }

      // Redirect to requests page
      router.push(result.redirectTo || '/requests');
      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(error.message);
      setLoading(false);
    }
  };

  // Handle items for goods type
  const addItem = () => {
    setRequiredItems([...requiredItems, { item: '', quantity: 1, unit: 'pieces' }]);
  };

  const removeItem = (index: number) => {
    if (requiredItems.length > 1) {
      setRequiredItems(requiredItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequiredItem, value: string | number) => {
    const updated = [...requiredItems];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredItems(updated);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Create New Request</h1>
          <p className="text-lg text-slate-600">
            Share your school&apos;s needs with the community and connect with donors and volunteers
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">
              Request Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., Braille Learning Materials for 45 Students"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Provide detailed information about your request, why it's needed, and how it will help your students..."
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-2">
                Category *
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as RequestCategory })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-slate-900 mb-2">
                Request Type *
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as RequestType })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="money">Money</option>
                <option value="goods">Goods</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields Based on Type */}
          {formData.type === 'money' && (
            <div className="mb-6">
              <label htmlFor="target_amount" className="block text-sm font-semibold text-slate-900 mb-2">
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="5000"
              />
            </div>
          )}

          {formData.type === 'goods' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Required Items *
              </label>
              <div className="space-y-3">
                {requiredItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Item name (e.g., Braille Books)"
                        value={item.item}
                        onChange={(e) => updateItem(index, 'item', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition mb-2"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          required
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          <option value="pieces">Pieces</option>
                          <option value="boxes">Boxes</option>
                          <option value="sets">Sets</option>
                          <option value="units">Units</option>
                          <option value="kg">Kilograms</option>
                          <option value="liters">Liters</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={requiredItems.length === 1}
                      className="mt-1 p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-3 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-700 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Item
              </button>
            </div>
          )}

          {formData.type === 'volunteer' && (
            <div className="mb-6">
              <label htmlFor="required_volunteers" className="block text-sm font-semibold text-slate-900 mb-2">
                Number of Volunteers Needed *
              </label>
              <input
                type="number"
                id="required_volunteers"
                required={formData.type === 'volunteer'}
                min="1"
                value={formData.required_volunteers}
                onChange={(e) => setFormData({ ...formData, required_volunteers: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="3"
              />
            </div>
          )}

          {/* Urgency and Students Impacted */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="urgency" className="block text-sm font-semibold text-slate-900 mb-2">
                Urgency *
              </label>
              <select
                id="urgency"
                required
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as Urgency })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {urgencies.map((urg) => (
                  <option key={urg} value={urg}>{urg}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="students_impacted" className="block text-sm font-semibold text-slate-900 mb-2">
                Students Impacted
              </label>
              <input
                type="number"
                id="students_impacted"
                min="1"
                value={formData.students_impacted}
                onChange={(e) => setFormData({ ...formData, students_impacted: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="45"
              />
            </div>
          </div>

          {/* Deadline and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="deadline_date" className="block text-sm font-semibold text-slate-900 mb-2">
                Deadline Date
              </label>
              <input
                type="date"
                id="deadline_date"
                value={formData.deadline_date}
                onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-slate-900 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="New York, NY"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="mb-6">
            <label htmlFor="image_url" className="block text-sm font-semibold text-slate-900 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-2 text-sm text-slate-500">
              Add an image to help illustrate your request and attract more support
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
