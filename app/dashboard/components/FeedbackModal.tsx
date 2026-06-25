'use client';

import React, { useState } from 'react';
import { RatingType } from '@/lib/types/database';
import { submitFeedbackAction } from '../actions.feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  rateeId: string;
  rateeName: string;
  ratingType: RatingType;
  relatedSessionId?: string;
  relatedDonationId?: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  rateeId,
  rateeName,
  ratingType,
  relatedSessionId,
  relatedDonationId,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Set tags based on rating type
  const getAvailableTags = () => {
    switch (ratingType) {
      case 'school':
        return [
          'Highly Organized',
          'Friendly Staff',
          'Clean Facilities',
          'Transparent',
          'Great Coordination',
          'Gratitude Shown',
        ];
      case 'volunteer':
      case 'session':
        return [
          'Punctual',
          'Engaging Teaching',
          'Well Prepared',
          'Polite',
          'Subject Expert',
          'Great with Kids',
        ];
      case 'donor':
        return [
          'Generous',
          'Quick Delivery',
          'Great Communication',
          'Highly Supportive',
          'Polite',
        ];
      default:
        return ['Friendly', 'Professional', 'Helpful', 'Responsive', 'Polite'];
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await submitFeedbackAction({
      ratee_id: rateeId,
      rating_type: ratingType,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
      feedback_categories: selectedTags,
      is_anonymous: isAnonymous,
      related_session_id: relatedSessionId,
      related_donation_id: relatedDonationId,
    });

    setLoading(false);

    if (result.success) {
      setRating(0);
      setTitle('');
      setComment('');
      setSelectedTags([]);
      setIsAnonymous(false);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } else {
      setError(result.error || 'Failed to submit feedback. Please try again.');
    }
  };

  const availableTags = getAvailableTags();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 transform transition-all scale-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
            <p className="text-sm text-gray-600 mt-1">
              For <span className="font-semibold text-blue-700">{rateeName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-full transition text-gray-500 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="flex flex-col items-center justify-center py-2 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-sm font-semibold text-gray-700 mb-2">Overall Rating</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform transform hover:scale-125 focus:outline-none"
                >
                  <svg
                    className={`w-10 h-10 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    } transition-colors duration-150`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 mt-2 font-medium">
              {rating === 5 ? 'Excellent!' :
               rating === 4 ? 'Good' :
               rating === 3 ? 'Average' :
               rating === 2 ? 'Below Average' :
               rating === 1 ? 'Poor' : 'Select a score'}
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Review Summary</label>
            <input
              type="text"
              placeholder="e.g., Highly recommended, excellent communication!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              maxLength={80}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Comments</label>
            <textarea
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              maxLength={1000}
            />
          </div>

          {/* Tags / Categories */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Highlight Qualities</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="anonymous-checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="anonymous-checkbox" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Submit anonymously
              <span className="block text-xs font-normal text-gray-500">
                Your review comments are visible, but your name is hidden.
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
