'use server';

import { RequestService } from '@/services/request.service';
import { createClient } from '@/lib/supabase/server';

export async function fetchUrgentRequests() {
  try {
    const { requests } = await RequestService.getRequests();

    const filtered = (requests || []).filter((req: any) => 
      (req.urgency === 'High' || req.urgency === 'Critical') &&
      (req.status === 'Open' || req.status === 'In Progress') &&
      (req.type === 'money' || req.type === 'goods')
    );

    return { success: true, data: filtered };
  } catch (error) {
    console.error('Error fetching urgent requests:', error);
    return { success: false, data: [], error: 'Failed to fetch urgent requests' };
  }
}

export interface CreateSessionProposalInput {
  title: string;
  description: string;
  topic: string;
  subject: string;
  educationalLevel: string;
  targetAudience: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  sessionType: 'In-Person' | 'Virtual' | 'Hybrid';
  maxStudents: number;
  materialsNeeded: string[];
  prerequisites: string;
}

export async function createSessionProposal(data: CreateSessionProposalInput) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // For now, use a default school_id. In a real scenario, this would be associated with a school
    // or the volunteer would select a school
    const { data: school } = await supabase
      .from('schools')
      .select('school_id')
      .limit(1)
      .single();

    if (!school) {
      return { success: false, error: 'No school available for this session' };
    }

    // Calculate duration
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const durationHours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;

    // Create session proposal
    const { data: session, error } = await supabase
      .from('volunteer_sessions')
      .insert({
        volunteer_id: user.id,
        school_id: school.school_id,
        title: data.title,
        description: data.description,
        topic: data.topic,
        subject: data.subject,
        session_date: data.sessionDate,
        start_time: data.startTime,
        end_time: data.endTime,
        duration_hours: durationHours,
        location: data.location,
        session_type: data.sessionType,
        max_students: data.maxStudents,
        materials_needed: data.materialsNeeded,
        notes: data.prerequisites || null,
        status: 'Proposed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message || 'Failed to create session proposal' };
    }

    return { success: true, data: session };
  } catch (error) {
    console.error('Error in createSessionProposal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function fetchVolunteerSessions(status?: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('volunteer_sessions')
      .select(`
        *,
        schools (
          name,
          type,
          address
        )
      `)
      .eq('volunteer_id', user.id)
      .order('session_date', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: sessions || [] };
  } catch (error) {
    console.error('Error in fetchVolunteerSessions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
