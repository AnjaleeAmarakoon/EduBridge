'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AdminStatsFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  region?: string;
}

export async function checkIsAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return false;
  }

  return true;
}

export async function fetchAdminStats(filters?: AdminStatsFilters) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // 1. Fetch Donations
    const donationsQuery = supabase.from('donations').select('*');
    const { data: donations, error: donError } = await donationsQuery;
    if (donError) throw donError;

    // 2. Fetch Requests
    let requestsQuery = supabase.from('requests').select('*, schools(name, type, address)');
    if (filters?.category) {
      requestsQuery = requestsQuery.eq('category', filters.category);
    }
    if (filters?.region) {
      requestsQuery = requestsQuery.or(`location.ilike.%${filters.region}%,address.ilike.%${filters.region}%`);
    }
    const { data: requests, error: reqError } = await requestsQuery;
    if (reqError) throw reqError;

    // 3. Fetch Volunteer Sessions
    const sessionsQuery = supabase.from('volunteer_sessions').select('*');
    const { data: sessions, error: sesError } = await sessionsQuery;
    if (sesError) throw sesError;

    // 4. Fetch Session Participants
    const { data: participants, error: partError } = await supabase
      .from('session_participants')
      .select('*');
    if (partError) throw partError;

    // 5. Fetch Schools
    const { data: schools, error: schError } = await supabase.from('schools').select('*');
    if (schError) throw schError;

    // --- CALCULATE AGGREGATIONS ---
    
    // Apply date filters if present
    const startDate = filters?.startDate ? new Date(filters.startDate) : null;
    const endDate = filters?.endDate ? new Date(filters.endDate) : null;

    const dateFilter = (dateStr: string) => {
      const d = new Date(dateStr);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    // Filter donations by date
    const filteredDonations = donations ? donations.filter(d => dateFilter(d.created_at)) : [];
    
    // Filter requests by date
    const filteredRequests = requests ? requests.filter(r => dateFilter(r.created_at)) : [];

    // Filter sessions by date
    const filteredSessions = sessions ? sessions.filter(s => dateFilter(s.created_at)) : [];

    // Aggregate Donations
    let totalMonetaryRaised = 0;
    let goodsDonationCount = 0;
    const monthlyDonationData: Record<string, number> = {};

    filteredDonations.forEach(d => {
      if (d.donation_type === 'money') {
        if (d.payment_status === 'Completed') {
          totalMonetaryRaised += Number(d.amount || 0);
          
          // Monthly trend (LKR)
          const date = new Date(d.created_at);
          const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          monthlyDonationData[monthKey] = (monthlyDonationData[monthKey] || 0) + Number(d.amount || 0);
        }
      } else if (d.donation_type === 'goods') {
        goodsDonationCount += 1;
      }
    });

    // Aggregate Requests
    const totalRequests = filteredRequests.length;
    const fulfilledRequests = filteredRequests.filter(r => r.status === 'Fulfilled').length;
    const activeRequests = filteredRequests.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
    const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 0;

    const categoryBreakdown: Record<string, number> = {};
    const geographicBreakdown: Record<string, number> = {};

    filteredRequests.forEach(r => {
      // Category Breakdown
      categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;

      // Location Breakdown
      const loc = r.location || r.schools?.address?.split(',').pop()?.trim() || 'Unknown';
      if (loc && loc !== 'Unknown') {
        geographicBreakdown[loc] = (geographicBreakdown[loc] || 0) + 1;
      }
    });

    // Aggregate Volunteer Sessions
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.status === 'Completed').length;
    let totalHoursLogged = 0;
    filteredSessions.forEach(s => {
      if (s.status === 'Completed') {
        totalHoursLogged += Number(s.duration_hours || 0);
      }
    });

    // Aggregate Attendance & Rates
    let totalRegistered = 0;
    let totalAttended = 0;
    
    // Map participants
    if (participants) {
      participants.forEach(p => {
        totalRegistered += 1;
        if (p.attendance_status === 'Attended' || p.attendance_status === 'Late') {
          totalAttended += 1;
        }
      });
    }
    const attendanceRate = totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0;

    // School Type Distribution
    const schoolTypeDistribution = { Blind: 0, Deaf: 0, Rural: 0 };
    if (schools) {
      schools.forEach(s => {
        if (s.type in schoolTypeDistribution) {
          schoolTypeDistribution[s.type as keyof typeof schoolTypeDistribution] += 1;
        }
      });
    }

    return {
      success: true,
      data: {
        summary: {
          totalMonetaryRaised,
          goodsDonationCount,
          totalRequests,
          activeRequests,
          fulfilledRequests,
          fulfillmentRate,
          totalSessions,
          completedSessions,
          totalHoursLogged,
          studentAttendanceRate: attendanceRate,
          studentCount: totalRegistered,
        },
        schoolTypeDistribution,
        categoryBreakdown,
        geographicBreakdown,
        monthlyTrends: Object.entries(monthlyDonationData).map(([month, amount]) => ({ month, amount })),
      }
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error fetching statistics' };
  }
}

export async function fetchAdminSchools(status?: 'all' | 'pending' | 'verified') {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    let query = supabase
      .from('schools')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (status === 'pending') {
      query = query.eq('verified', false);
    } else if (status === 'verified') {
      query = query.eq('verified', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching admin schools:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error fetching schools' };
  }
}

export async function verifySchoolAction(schoolId: string, verify: boolean) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('schools')
      .update({ verified: verify })
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error verifying school:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error verifying school' };
  }
}

export async function fetchAdminProfiles(roleFilter?: string) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching admin profiles:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error fetching profiles' };
  }
}

export async function fetchAdminRequestsAndSessions() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    const { data: requests, error: reqError } = await supabase
      .from('requests')
      .select('*, schools(name)')
      .order('created_at', { ascending: false });

    if (reqError) throw reqError;

    const { data: sessions, error: sesError } = await supabase
      .from('volunteer_sessions')
      .select('*, schools(name), profiles:volunteer_id(first_name, last_name)')
      .order('created_at', { ascending: false });

    if (sesError) throw sesError;

    return {
      success: true,
      data: {
        requests: requests || [],
        sessions: sessions || []
      }
    };
  } catch (error) {
    console.error('Error fetching requests and sessions:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error fetching records' };
  }
}

export async function moderateRequestAction(requestId: string, action: 'cancel' | 'delete') {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    if (action === 'cancel') {
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'Cancelled' })
        .eq('request_id', requestId)
        .select();

      if (error) throw error;
      revalidatePath('/dashboard');
      revalidatePath('/requests');
      return { success: true, data };
    } else {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('request_id', requestId);

      if (error) throw error;
      revalidatePath('/dashboard');
      revalidatePath('/requests');
      return { success: true };
    }
  } catch (error) {
    console.error('Error moderating request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error moderating request' };
  }
}

export async function moderateSessionAction(sessionId: string, action: 'cancel' | 'delete') {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    if (action === 'cancel') {
      const { data, error } = await supabase
        .from('volunteer_sessions')
        .update({ status: 'Cancelled' })
        .eq('session_id', sessionId)
        .select();

      if (error) throw error;
      revalidatePath('/dashboard');
      return { success: true, data };
    } else {
      const { error } = await supabase
        .from('volunteer_sessions')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      revalidatePath('/dashboard');
      return { success: true };
    }
  } catch (error) {
    console.error('Error moderating session:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error moderating session' };
  }
}

export async function updateUserRoleAction(userId: string, newRole: 'school_admin' | 'donor' | 'volunteer' | 'admin') {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error updating user role' };
  }
}

export async function fetchAdminRatings() {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:rater_id (first_name, last_name, email, role),
        ratee:ratee_id (first_name, last_name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching admin ratings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error fetching ratings' };
  }
}

export async function moderateRatingAction(ratingId: string, action: 'verify' | 'unverify' | 'delete') {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();

    if (action === 'delete') {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('rating_id', ratingId);

      if (error) throw error;
    } else {
      const isVerified = action === 'verify';
      const { error } = await supabase
        .from('ratings')
        .update({ is_verified: isVerified })
        .eq('rating_id', ratingId);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error moderating rating:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error moderating rating' };
  }
}
