import { NextRequest, NextResponse } from 'next/server';
import { RequestService } from '@/services/request.service';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    await RequestService.updateRequestStatus(user.id, params.id, status);

    // Revalidate paths
    revalidatePath('/requests');
    revalidatePath(`/requests/${params.id}`);
    revalidatePath('/dashboard');

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 400 }
    );
  }
}
