import { createClient } from '@/lib/supabase/server';
import type { RequestCategory, RequestType, Urgency } from '@/lib/types/database';

export interface RequiredItem {
  item: string;
  quantity: number;
  unit: string;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  category: RequestCategory;
  type: RequestType;
  urgency: Urgency;
  target_amount?: number;
  required_items?: RequiredItem[] | null;
  required_volunteers?: number;
  students_impacted?: number;
  deadline_date?: string;
  location?: string;
  image_url?: string;
}

export interface RequestFilters {
  category?: string;
  type?: string;
  urgency?: string;
  status?: string;
  search?: string;
}

export interface RespondToRequestInput {
  response_type: 'interested' | 'committed';
  message?: string;
  offered_amount?: number;
  offered_items?: Record<string, unknown> | null;
  availability_dates?: Record<string, unknown> | null;
}

export class RequestService {
  /**
   * Create a new request
   */
  static async createRequest(userId: string, data: CreateRequestInput) {
    const supabase = await createClient();

    // Get user's school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('school_id')
      .eq('user_id', userId)
      .single();

    if (schoolError || !school) {
      throw new Error('School not found. Only school admins can create requests.');
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
      throw new Error(requestError.message);
    }

    return { request };
  }

  /**
   * Get all requests with optional filters
   */
  static async getRequests(filters?: RequestFilters) {
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
      throw new Error(error.message);
    }

    return { requests: data };
  }

  /**
   * Get request by ID with school and response count
   */
  static async getRequestById(id: string) {
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
      throw new Error(error.message);
    }

    // Get response count
    const { count } = await supabase
      .from('request_responses')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', id);

    return { request: data, responseCount: count || 0 };
  }

  /**
   * Update request status
   */
  static async updateRequestStatus(userId: string, requestId: string, status: string) {
    const supabase = await createClient();

    // Verify user owns this request's school
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('school_id')
      .eq('request_id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Request not found');
    }

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('school_id')
      .eq('school_id', request.school_id)
      .eq('user_id', userId)
      .single();

    if (schoolError || !school) {
      throw new Error('Unauthorized');
    }

    // Update status
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status,
        fulfilled_at: status === 'Fulfilled' ? new Date().toISOString() : null,
      })
      .eq('request_id', requestId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true };
  }

  /**
   * Respond to a request
   */
  static async respondToRequest(userId: string, requestId: string, data: RespondToRequestInput) {
    const supabase = await createClient();

    // Check if user already responded
    const { data: existing } = await supabase
      .from('request_responses')
      .select('response_id')
      .eq('request_id', requestId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('You have already responded to this request');
    }

    // Create response
    const { data: response, error: responseError } = await supabase
      .from('request_responses')
      .insert({
        request_id: requestId,
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (responseError) {
      throw new Error(responseError.message);
    }

    return { response };
  }

  /**
   * Delete a request
   */
  static async deleteRequest(userId: string, requestId: string) {
    const supabase = await createClient();

    // Verify ownership
    const { data: request } = await supabase
      .from('requests')
      .select('school_id')
      .eq('request_id', requestId)
      .single();

    if (!request) {
      throw new Error('Request not found');
    }

    const { data: school } = await supabase
      .from('schools')
      .select('school_id')
      .eq('school_id', request.school_id)
      .eq('user_id', userId)
      .single();

    if (!school) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('request_id', requestId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }
}
