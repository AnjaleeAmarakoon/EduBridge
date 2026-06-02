'use server';

import { RequestService } from '@/services/request.service';
import { createClient } from '@/lib/supabase/server';
import { SessionService, CreateSessionProposalInput } from '@/services/session.service';

export async function fetchUrgentRequests() {
  try {
    const { requests } = await RequestService.getRequests();

    const filtered = (requests || []).filter((req: { urgency?: string; status?: string; type?: string }) => 
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

export async function createSessionProposal(data: CreateSessionProposalInput) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'User not authenticated' };

    // Ensure schoolId provided
    if (!data.schoolId) return { success: false, error: 'School selection is required' };

    const session = await SessionService.createSessionProposal(user.id, data);

    return { success: true, data: session };
  } catch (error) {
    console.error('Error in createSessionProposal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export async function fetchVerifiedSchools() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('schools').select('school_id, name').order('name');
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching schools:', error);
    return { success: false, data: [], error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function fetchSchoolSessions() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [], error: 'User not authenticated' };

    const sessions = await SessionService.getSessionsForSchool(user.id);
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error fetching school sessions:', error);
    return { success: false, data: [], error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function approveSessionProposalAction(sessionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    const session = await SessionService.approveSession(user.id, sessionId);
    return { success: true, data: session };
  } catch (error) {
    console.error('Error approving session:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function declineSessionProposalAction(sessionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    const session = await SessionService.declineSession(user.id, sessionId);
    return { success: true, data: session };
  } catch (error) {
    console.error('Error declining session:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function fetchRequestResponsesAction(requestId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('request_responses').select('*, profiles:profiles!user_id(first_name,last_name,email)').eq('request_id', requestId).order('created_at', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching responses:', error);
    return { success: false, data: [], error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function acceptVolunteerResponseAction(responseId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    const session = await SessionService.acceptVolunteerOffer(user.id, responseId);
    return { success: true, data: session };
  } catch (error) {
    console.error('Error accepting response:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function logSessionAttendanceAction(sessionId: string, attendanceData: { student_name?: string | null; attendance_status?: string | null; }[]) {
  try {
    const participants = await SessionService.logStudentAttendance(sessionId, attendanceData);
    return { success: true, data: participants };
  } catch (error) {
    console.error('Error logging attendance:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function completeSessionAction(sessionId: string) {
  try {
    const session = await SessionService.completeSession(sessionId);
    return { success: true, data: session };
  } catch (error) {
    console.error('Error completing session:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
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
