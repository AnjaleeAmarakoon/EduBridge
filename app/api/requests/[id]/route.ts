import { NextRequest, NextResponse } from 'next/server';
import { RequestService } from '@/services/request.service';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const result = await RequestService.getRequestById(params.id);

    return NextResponse.json(
      { 
        request: result.request, 
        responseCount: result.responseCount 
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get request' },
      { status: 404 }
    );
  }
}

export async function DELETE(
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

    await RequestService.deleteRequest(user.id, params.id);

    // Revalidate paths
    revalidatePath('/requests');
    revalidatePath('/dashboard');

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete request' },
      { status: 400 }
    );
  }
}
