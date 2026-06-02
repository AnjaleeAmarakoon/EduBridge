import { createClient } from '@/lib/supabase/server';
import type { DonationType, PaymentMethod } from '@/lib/types/database';

export interface CreateDonationInput {
  donation_type: DonationType;
  amount?: number | null;
  items_donated?: Record<string, unknown> | null;
  payment_method?: PaymentMethod | null;
  payment_status?: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  transaction_id?: string | null;
  status?: 'Pending' | 'Confirmed' | 'In Transit' | 'Delivered' | 'Cancelled';
  message_to_school?: string | null;
}

export class DonationService {
  static async createDonationForRequest(userId: string, requestId: string, data: CreateDonationInput) {
    const supabase = await createClient();

    console.log('[DonationService.createDonationForRequest] userId:', userId, 'requestId:', requestId);
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('request_id, school_id, raised_amount')
      .eq('request_id', requestId)
      .single();

    console.log('[DonationService] request lookup result:', { request, requestError });

    if (requestError || !request) {
      throw new Error('Request not found');
    }

    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        donor_id: userId,
        request_id: requestId,
        school_id: request.school_id,
        donation_type: data.donation_type,
        amount: data.amount ?? null,
        items_donated: data.items_donated ?? null,
        payment_method: data.payment_method ?? null,
        payment_status: data.payment_status ?? 'Pending',
        transaction_id: data.transaction_id ?? null,
        status: data.status ?? 'Pending',
        message_to_school: data.message_to_school ?? null,
      })
      .select()
      .single();

    if (donationError) {
      throw new Error(donationError.message);
    }

    if (data.donation_type === 'money' && data.amount && data.amount > 0) {
      const newRaisedAmount = Number(request.raised_amount || 0) + data.amount;
      const { error: updateError } = await supabase
        .from('requests')
        .update({ raised_amount: newRaisedAmount })
        .eq('request_id', requestId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    return { donation };
  }
}
