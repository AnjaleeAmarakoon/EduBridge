'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptVolunteerResponseAction } from '@/app/dashboard/actions';

interface Props {
  responseId: string;
}

export default function AcceptOfferButton({ responseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await acceptVolunteerResponseAction(responseId);
      if (!res || !res.success) {
        setError(res?.error || 'Failed to accept offer');
      } else {
        // refresh page to show created session and updated statuses
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Accepting...' : 'Accept Offer'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
