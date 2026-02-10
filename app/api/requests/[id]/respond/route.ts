import { NextRequest, NextResponse } from 'next/server';
import { RequestService } from '@/services/request.service';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
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

    const result = await RequestService.respondToRequest(user.id, params.id, body);

    // Revalidate path
    revalidatePath(`/requests/${params.id}`);

    return NextResponse.json(
      { 
        success: true, 
        response: result.response 
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to respond to request' },
      { status: 400 }
    );
  }
}
