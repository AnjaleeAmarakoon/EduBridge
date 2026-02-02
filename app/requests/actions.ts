'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { RequestCategory, RequestType, Urgency } from '@/lib/types/database';

export interface CreateRequestInput {
  title: string;
  description: string;
  category: RequestCategory;
  type: RequestType;
  urgency: Urgency;
  target_amount?: number;
  required_items?: any;
  required_volunteers?: number;
  students_impacted?: number;
  deadline_date?: string;
  location?: string;
  image_url?: string;
}

export async function createRequest(data: CreateRequestInput) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  // Get user's school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('school_id')
    .eq('user_id', user.id)
    .single();

  if (schoolError || !school) {
    return { error: 'School not found. Only school admins can create requests.' };
  }

  // Create request
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .insert({
      school_id: school.school_id,
      ...data,
    })
    .select()
    .single();

  if (requestError) {
    return { error: requestError.message };
  }

  revalidatePath('/requests');
  revalidatePath('/dashboard');
  
  return { success: true, request };
}

export async function getRequests(filters?: {
  category?: string;
  type?: string;
  urgency?: string;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('requests')
    .select(`
      *,
      schools (
        name,
        type,
        address
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.urgency) {
    query = query.eq('urgency', filters.urgency);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default to showing open and in-progress requests
    query = query.in('status', ['Open', 'In Progress']);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { requests: data };
}

export async function getRequestById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      schools (
        school_id,
        name,
        type,
        address,
        contact_person,
        phone,
        email
      )
    `)
    .eq('request_id', id)
    .single();

  if (error) {
    return { error: error.message };
  }

  // Get response count
  const { count } = await supabase
    .from('request_responses')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', id);

  return { request: data, responseCount: count || 0 };
}

export async function updateRequestStatus(requestId: string, status: string) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  // Verify user owns this request's school
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('school_id')
    .eq('request_id', requestId)
    .single();

  if (requestError || !request) {
    return { error: 'Request not found' };
  }

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('school_id')
    .eq('school_id', request.school_id)
    .eq('user_id', user.id)
    .single();

  if (schoolError || !school) {
    return { error: 'Unauthorized' };
  }

  // Update status
  const { error: updateError } = await supabase
    .from('requests')
    .update({ 
      status,
      fulfilled_at: status === 'Fulfilled' ? new Date().toISOString() : null
    })
    .eq('request_id', requestId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/requests');
  revalidatePath(`/requests/${requestId}`);
  revalidatePath('/dashboard');

  return { success: true };
}

export async function respondToRequest(requestId: string, data: {
  response_type: 'interested' | 'committed';
  message?: string;
  offered_amount?: number;
  offered_items?: any;
  availability_dates?: any;
}) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  // Check if user already responded
  const { data: existing } = await supabase
    .from('request_responses')
    .select('response_id')
    .eq('request_id', requestId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { error: 'You have already responded to this request' };
  }

  // Create response
  const { data: response, error: responseError } = await supabase
    .from('request_responses')
    .insert({
      request_id: requestId,
      user_id: user.id,
      ...data,
    })
    .select()
    .single();

  if (responseError) {
    return { error: responseError.message };
  }

  revalidatePath(`/requests/${requestId}`);
  
  return { success: true, response };
}

export async function deleteRequest(requestId: string) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  // Verify ownership
  const { data: request } = await supabase
    .from('requests')
    .select('school_id')
    .eq('request_id', requestId)
    .single();

  if (!request) {
    return { error: 'Request not found' };
  }

  const { data: school } = await supabase
    .from('schools')
    .select('school_id')
    .eq('school_id', request.school_id)
    .eq('user_id', user.id)
    .single();

  if (!school) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('request_id', requestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/requests');
  revalidatePath('/dashboard');

  return { success: true };
}
