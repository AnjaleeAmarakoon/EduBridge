import { createClient } from '@/lib/supabase/server';
import type {
  VolunteerSession,
  SessionParticipant,
} from '@/lib/types/database';

export type CreateSessionProposalInput = {
  schoolId: string;
  title: string;
  description: string;
  subject: string;
  educationalLevel?: string | null;
  targetAudience?: string | null;
  topic?: string | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  prerequisites?: string | null;
  sessionType: 'In-Person' | 'Virtual' | 'Hybrid';
  maxStudents?: number | null;
  materialsNeeded?: string[] | null;
  notes?: string | null;
};

export class SessionService {
  static async getSessionsForVolunteer(volunteerId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('volunteer_sessions')
      .select('*, schools(name, type, address)')
      .eq('volunteer_id', volunteerId)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data as VolunteerSession[];
  }

  static async getSessionsForSchool(schoolUserId: string) {
    const supabase = await createClient();

    const { data: school } = await supabase
      .from('schools')
      .select('school_id')
      .eq('user_id', schoolUserId)
      .single();

    if (!school) return [];

    const { data, error } = await supabase
      .from('volunteer_sessions')
      .select('*, profiles:profiles!volunteer_id(first_name,last_name,email), request:requests(*)')
      .eq('school_id', school.school_id)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data as VolunteerSession[];
  }

  static async createSessionProposal(volunteerId: string, data: CreateSessionProposalInput) {
    const supabase = await createClient();

    // basic duration calc
    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;

    const { data: session, error } = await supabase
      .from('volunteer_sessions')
      .insert({
        volunteer_id: volunteerId,
        school_id: data.schoolId,
        title: data.title,
        description: data.description,
        subject: data.subject,
        topic: data.topic || null,
        session_date: data.sessionDate,
        start_time: data.startTime,
        end_time: data.endTime,
        duration_hours: Number.isFinite(durationHours) ? durationHours : null,
        location: data.location || null,
        session_type: data.sessionType,
        max_students: data.maxStudents || null,
        materials_needed: data.materialsNeeded || null,
        notes: data.notes || null,
        status: 'Proposed',
      })
      .select()
      .single();

    if (error) throw error;
    return session as VolunteerSession;
  }

  static async approveSession(schoolUserId: string, sessionId: string) {
    const supabase = await createClient();

    const { data: school } = await supabase
      .from('schools')
      .select('school_id')
      .eq('user_id', schoolUserId)
      .single();

    if (!school) throw new Error('School not found for user');

    const { data: session, error } = await supabase
      .from('volunteer_sessions')
      .update({ status: 'Confirmed' })
      .eq('session_id', sessionId)
      .eq('school_id', school.school_id)
      .select()
      .single();

    if (error) throw error;
    return session as VolunteerSession;
  }

  static async declineSession(schoolUserId: string, sessionId: string) {
    const supabase = await createClient();

    const { data: school } = await supabase
      .from('schools')
      .select('school_id')
      .eq('user_id', schoolUserId)
      .single();

    if (!school) throw new Error('School not found for user');

    const { data: session, error } = await supabase
      .from('volunteer_sessions')
      .update({ status: 'Cancelled' })
      .eq('session_id', sessionId)
      .eq('school_id', school.school_id)
      .select()
      .single();

    if (error) throw error;
    return session as VolunteerSession;
  }

  static async acceptVolunteerOffer(schoolUserId: string, responseId: string) {
    const supabase = await createClient();

    // Fetch response
    const { data: response } = await supabase
      .from('request_responses')
      .select('*')
      .eq('response_id', responseId)
      .single();

    if (!response) throw new Error('Response not found');

    // Fetch request
    const { data: request } = await supabase
      .from('requests')
      .select('*')
      .eq('request_id', response.request_id)
      .single();

    if (!request) throw new Error('Request not found');

    // Ensure the school matches the current user
    const { data: school } = await supabase
      .from('schools')
      .select('school_id, user_id')
      .eq('school_id', request.school_id)
      .single();

    if (!school || school.user_id !== schoolUserId) {
      throw new Error('Not authorized to accept this offer');
    }

    // Transaction-like sequence
    const { error: updateRespErr } = await supabase
      .from('request_responses')
      .update({ status: 'Accepted' })
      .eq('response_id', responseId);

    if (updateRespErr) throw updateRespErr;

    const { error: updateReqErr } = await supabase
      .from('requests')
      .update({ status: 'In Progress' })
      .eq('request_id', request.request_id);

    if (updateReqErr) throw updateReqErr;

    // Create a confirmed session using available request data
    const sessionInsert = {
      volunteer_id: response.user_id,
      school_id: request.school_id,
      request_id: request.request_id,
      title: request.title,
      description: request.description,
      subject: (request.category as unknown) as string,
      session_date: request.deadline_date || new Date().toISOString(),
      start_time: '09:00',
      end_time: '11:00',
      duration_hours: 2,
      location: request.location || null,
      session_type: 'In-Person' as const,
      max_students: request.required_volunteers || null,
      status: 'Confirmed' as const,
    };

    const { data: newSession, error: insertErr } = await supabase
      .from('volunteer_sessions')
      .insert(sessionInsert)
      .select()
      .single();

    if (insertErr) throw insertErr;

    return newSession as VolunteerSession;
  }

  static async getRegisteredParticipants(sessionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as SessionParticipant[];
  }

  static async logStudentAttendance(sessionId: string, participants: { student_name?: string | null; attendance_status?: string | null; }[]) {
    const supabase = await createClient();

    const inserts = participants.map(p => ({
      session_id: sessionId,
      student_name: p.student_name || null,
      attendance_status: p.attendance_status || null,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from('session_participants').insert(inserts).select();

    if (error) throw error;
    return data as SessionParticipant[];
  }

  static async completeSession(sessionId: string, notes?: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('volunteer_sessions')
      .update({ status: 'Completed', completed_at: new Date().toISOString(), notes })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as VolunteerSession;
  }
}

export default SessionService;
