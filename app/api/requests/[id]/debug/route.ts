import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = params;

    console.log('[GET /api/requests/[id]/debug] id:', id);

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('request_id', id)
      .single();

    if (error || !data) {
      console.log('[GET /api/requests/[id]/debug] not found or error:', { error });
      return NextResponse.json({ found: false, error: error ? error.message : 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ found: true, request: data }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/requests/[id]/debug] unexpected error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error' }, { status: 500 });
  }
}
