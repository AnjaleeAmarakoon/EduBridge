'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';

interface DonationModalProps {
  requestId: string;
  requestType: 'money' | 'goods';
  triggerText?: string;
  triggerClassName?: string;
}

type DonationStep = 'amount' | 'payment' | 'success';

type DonationType = 'money' | 'goods';

export default function DonationModal({ requestId, requestType, triggerText, triggerClassName }: DonationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<DonationStep>('amount');
  const [donationType, setDonationType] = useState<DonationType>(requestType);
  const [amount, setAmount] = useState('');
  const [goodsDescription, setGoodsDescription] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [messageToSchool, setMessageToSchool] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const pathname = usePathname();

  // derive request id from pathname if prop missing or 'undefined'
  const extractedIdMatch = pathname ? pathname.match(/\/requests\/([^\/\?]+)/) : null;
  const extractedId = extractedIdMatch ? extractedIdMatch[1] : null;
  const effectiveRequestId = (!requestId || requestId === 'undefined') ? extractedId : requestId;

  const resetState = () => {
    setStep('amount');
    setAmount('');
    setGoodsDescription('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setMessageToSchool('');
    setError('');
    setLoading(false);
    setTransactionId('');
    setDonationType(requestType);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetState();
  };

  const handleContinue = () => {
    setError('');

    if (donationType === 'money') {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid amount.');
        return;
      }
      setStep('payment');
      return;
    }

    if (!goodsDescription.trim()) {
      setError('Please describe the goods you want to donate.');
      return;
    }

    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
        if (!effectiveRequestId) {
          setError('Missing request id. Cannot submit donation.');
          setLoading(false);
          console.error('[DonationModal] missing requestId; props requestId:', requestId, 'extractedId:', extractedId, 'pathname:', pathname);
          return;
        }

      const payload: Record<string, unknown> = {
        donation_type: donationType,
        message_to_school: messageToSchool || null,
      };

      if (donationType === 'money') {
        // sanitize inputs
        const parsedAmount = Number(amount);
        const sanitizedCardNumber = cardNumber.replace(/\s+/g, '');
        const normalizedExpiry = (() => {
          const v = cardExpiry.replace(/\s+/g, '');
          if (/^[0-9]{4}$/.test(v)) {
            return v.slice(0, 2) + '/' + v.slice(2);
          }
          return v;
        })();

        payload.amount = parsedAmount;
        payload.card_number = sanitizedCardNumber;
        payload.card_expiry = normalizedExpiry;
        payload.card_cvv = cardCvv.replace(/\s+/g, '');
      } else {
        payload.items_donated = {
          description: goodsDescription.trim(),
        };
      }

      console.log('[DonationModal] submitting donation for requestId:', effectiveRequestId, 'payload:', payload);
      const response = await fetch(`/api/requests/${effectiveRequestId}/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // try to parse JSON error or fallback to plain text
      let result: { error?: string; transactionId?: string } | null = null;
      try {
        result = await response.json();
      } catch {
        const txt = await response.text();
        result = { error: txt || 'Unknown error' };
      }

      if (!response.ok) {
        setError(result?.error || 'Failed to process donation');
        setLoading(false);
        console.error('Donation API error', response.status, result);
        return;
      }

      setTransactionId(result?.transactionId || '');
      setStep('success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
      setError('Please complete the payment details.');
      return;
    }

    handleSubmit();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "w-full px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition"}
      >
        {triggerText || 'Donate Now'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 text-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Make a Donation</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {step === 'success' ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {donationType === 'money' ? 'Payment Successful' : 'Donation Submitted'}
                </h4>
                {donationType === 'money' && amount && (
                  <p className="text-gray-600 mb-2">Amount: {formatCurrency(Number(amount))}</p>
                )}
                {transactionId && (
                  <p className="text-sm text-gray-500">Transaction ID: {transactionId}</p>
                )}
                <button
                  onClick={closeModal}
                  className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Donation Type
                  </label>
                  <select
                    value={donationType}
                    onChange={(event) => {
                      const nextType = event.target.value as DonationType;
                      setDonationType(nextType);
                      setStep('amount');
                      setError('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="money">Monetary Donation</option>
                    <option value="goods">Goods Donation</option>
                  </select>
                </div>

                {donationType === 'money' && step === 'amount' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Donation Amount
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter amount"
                    />

                    <label className="block text-sm font-semibold text-gray-900 mt-4 mb-2">
                      Message to School (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={messageToSchool}
                      onChange={(event) => setMessageToSchool(event.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Share a short note with the school"
                    />

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                )}

                {donationType === 'goods' && step === 'amount' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Items You Will Donate
                    </label>
                    <textarea
                      rows={4}
                      value={goodsDescription}
                      onChange={(event) => setGoodsDescription(event.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the goods, quantities, and condition"
                    />

                    <label className="block text-sm font-semibold text-gray-900 mt-4 mb-2">
                      Message to School (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={messageToSchool}
                      onChange={(event) => setMessageToSchool(event.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Share a short note with the school"
                    />

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleContinue}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Submitting...' : 'Submit Donation'}
                      </button>
                    </div>
                  </div>
                )}

                {donationType === 'money' && step === 'payment' && (
                  <form onSubmit={handlePaymentSubmit}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(event) => setCardExpiry(event.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="08/28"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          CVV
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={cardCvv}
                          onChange={(event) => setCardCvv(event.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setStep('amount')}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Submit Payment'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
