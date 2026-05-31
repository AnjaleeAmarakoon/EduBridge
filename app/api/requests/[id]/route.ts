import { NextRequest, NextResponse } from 'next/server';
import { RequestService } from '@/services/request.service';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const result = await RequestService.getRequestById(id);

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
    const { id } = await params;
    
    console.log('[DELETE /api/requests/[id]] Starting delete. id:', id);
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[DELETE /api/requests/[id]] User authenticated:', user.id);

    await RequestService.deleteRequest(user.id, id);

    // Revalidate paths
    revalidatePath('/requests');
    revalidatePath('/dashboard');

    return NextResponse.json(
      { success: true, message: 'Request deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/requests/[id]] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    console.log('[PUT /api/requests/[id]] Starting update. id:', id);
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[PUT /api/requests/[id]] User authenticated:', user.id);

    const body = await request.json();
    
    await RequestService.updateRequest(user.id, id, body);

    // Revalidate paths
    revalidatePath('/requests');
    revalidatePath('/dashboard');

    return NextResponse.json(
      { success: true, message: 'Request updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PUT /api/requests/[id]] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
