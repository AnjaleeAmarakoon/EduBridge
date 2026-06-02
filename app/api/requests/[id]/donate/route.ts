import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { DonationService } from '@/services/donation.service';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

interface RouteParams {
  params: {
    id: string;
  };
}

const CARD_NUMBER_REGEX = /^[0-9]{12,19}$/;
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;
const CVV_REGEX = /^[0-9]{3,4}$/;

function generateTransactionId() {
  return `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[POST /api/requests/[id]/donate] user:', user.id, 'params.id:', params.id);

    const body = await request.json();

    const donationType = body.donation_type as 'money' | 'goods';
    const messageToSchool = typeof body.message_to_school === 'string' ? body.message_to_school : null;

    if (donationType !== 'money' && donationType !== 'goods') {
      return NextResponse.json({ error: 'Invalid donation type' }, { status: 400 });
    }

    if (donationType === 'money') {
      const amount = Number(body.amount);
      const cardNumber = String(body.card_number || '').replace(/\s+/g, '');
      const cardExpiry = String(body.card_expiry || '');
      const cardCvv = String(body.card_cvv || '');

      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: 'Donation amount must be greater than zero' }, { status: 400 });
      }

      if (!CARD_NUMBER_REGEX.test(cardNumber)) {
        return NextResponse.json({ error: 'Card number looks invalid' }, { status: 400 });
      }

      if (!EXPIRY_REGEX.test(cardExpiry)) {
        return NextResponse.json({ error: 'Card expiry must be in MM/YY format' }, { status: 400 });
      }

      if (!CVV_REGEX.test(cardCvv)) {
        return NextResponse.json({ error: 'CVV looks invalid' }, { status: 400 });
      }

      const transactionId = generateTransactionId();

      const result = await DonationService.createDonationForRequest(user.id, params.id, {
        donation_type: 'money',
        amount,
        payment_method: 'credit_card',
        payment_status: 'Completed',
        transaction_id: transactionId,
        status: 'Confirmed',
        message_to_school: messageToSchool,
      });

      console.log('[POST /api/requests/[id]/donate] donation created:', result?.donation?.donation_id);

      revalidatePath(`/requests/${params.id}`);

      return NextResponse.json(
        {
          success: true,
          donation: result.donation,
          transactionId,
        },
        { status: 201 }
      );
    }

    const itemsDonated = body.items_donated || null;

    if (!itemsDonated) {
      return NextResponse.json({ error: 'Please provide donated items' }, { status: 400 });
    }

    const transactionId = generateTransactionId();

    const result = await DonationService.createDonationForRequest(user.id, params.id, {
      donation_type: 'goods',
      items_donated: itemsDonated,
      payment_status: 'Pending',
      transaction_id: transactionId,
      status: 'Confirmed',
      message_to_school: messageToSchool,
    });

    revalidatePath(`/requests/${params.id}`);

    return NextResponse.json(
      {
        success: true,
        donation: result.donation,
        transactionId,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process donation' },
      { status: 400 }
    );
  }
}
