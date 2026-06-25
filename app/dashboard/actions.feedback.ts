'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { RatingType } from '@/lib/types/database';

export interface FeedbackSubmissionData {
  ratee_id: string;
  rating_type: RatingType;
  rating: number;
  title?: string;
  comment?: string;
  feedback_categories?: string[];
  is_anonymous?: boolean;
  related_session_id?: string;
  related_donation_id?: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  starDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  commonCategories: { category: string; count: number }[];
}

export interface PendingDonation {
  donation_id: string;
  donor_id?: string;
  school_id?: string;
  amount?: number | null;
  donation_type: 'money' | 'goods';
  items_donated?: Record<string, unknown> | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  schools?: {
    name: string;
    school_id: string;
    user_id: string;
  } | null;
}

export interface PendingSession {
  session_id: string;
  volunteer_id?: string;
  school_id?: string;
  title: string;
  session_date: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  schools?: {
    name: string;
    school_id: string;
    user_id: string;
  } | null;
}

export async function submitFeedbackAction(data: FeedbackSubmissionData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to submit feedback.' };
    }

    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5.' };
    }

    // 1. Authorization checks based on related donation or session
    if (data.related_donation_id) {
      // Fetch donation details to ensure rater has permission to rate this donation
      const { data: donation, error: donationError } = await supabase
        .from('donations')
        .select('donor_id, school_id, payment_status, status, schools(user_id)')
        .eq('donation_id', data.related_donation_id)
        .single();

      if (donationError || !donation) {
        return { success: false, error: 'Associated donation not found.' };
      }

      // Check if user is the donor or the school admin
      const isDonor = donation.donor_id === user.id;
      const rawSchools = donation.schools;
      const schoolsObj = (Array.isArray(rawSchools) ? rawSchools[0] : rawSchools) as unknown as { user_id: string } | null | undefined;
      const isSchoolAdmin = schoolsObj?.user_id === user.id;

      if (!isDonor && !isSchoolAdmin) {
        return { success: false, error: 'You are not authorized to rate this donation.' };
      }

      // Validate rating_type corresponds to user role:
      // If donor is rating, they rate the 'school'.
      // If school admin is rating, they rate the 'donor'.
      if (isDonor && data.rating_type !== 'school') {
        return { success: false, error: 'Donors can only rate schools.' };
      }
      if (isSchoolAdmin && data.rating_type !== 'donor') {
        return { success: false, error: 'Schools can only rate donors.' };
      }
    } else if (data.related_session_id) {
      // Fetch session details
      const { data: session, error: sessionError } = await supabase
        .from('volunteer_sessions')
        .select('volunteer_id, school_id, status, schools(user_id)')
        .eq('session_id', data.related_session_id)
        .single();

      if (sessionError || !session) {
        return { success: false, error: 'Associated volunteer session not found.' };
      }

      const isVolunteer = session.volunteer_id === user.id;
      const rawSchools = session.schools;
      const schoolsObj = (Array.isArray(rawSchools) ? rawSchools[0] : rawSchools) as unknown as { user_id: string } | null | undefined;
      const isSchoolAdmin = schoolsObj?.user_id === user.id;

      if (!isVolunteer && !isSchoolAdmin) {
        return { success: false, error: 'You are not authorized to rate this session.' };
      }

      // Validate rating_type corresponds to user role:
      // If volunteer is rating, they rate the 'school'.
      // If school admin is rating, they rate the 'volunteer' or the 'session'.
      if (isVolunteer && data.rating_type !== 'school') {
        return { success: false, error: 'Volunteers can only rate schools.' };
      }
      if (isSchoolAdmin && data.rating_type !== 'volunteer' && data.rating_type !== 'session') {
        return { success: false, error: 'Schools can only rate volunteers or sessions.' };
      }
    } else {
      // General feedback (without donation/session context) is not allowed for security reasons
      return { success: false, error: 'Feedback must be associated with a valid completed donation or session.' };
    }

    // 2. Double-rating prevention check
    const query = supabase.from('ratings').select('rating_id');
    if (data.related_donation_id) {
      query.eq('related_donation_id', data.related_donation_id).eq('rater_id', user.id);
    } else if (data.related_session_id) {
      query.eq('related_session_id', data.related_session_id).eq('rater_id', user.id);
    }
    const { data: existingRating } = await query;
    if (existingRating && existingRating.length > 0) {
      return { success: false, error: 'You have already submitted feedback for this activity.' };
    }

    // 3. Insert rating record
    const { error: insertError } = await supabase
      .from('ratings')
      .insert({
        rater_id: user.id,
        ratee_id: data.ratee_id,
        related_session_id: data.related_session_id || null,
        related_donation_id: data.related_donation_id || null,
        rating_type: data.rating_type,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment || null,
        feedback_categories: data.feedback_categories || [],
        is_anonymous: data.is_anonymous || false,
        is_verified: false,
        helpful_count: 0
      });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return { success: false, error: insertError.message };
    }

    revalidatePath('/dashboard');
    if (data.related_donation_id) revalidatePath(`/requests`);
    return { success: true };
  } catch (error) {
    console.error('Error in submitFeedbackAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Server error occurred' };
  }
}

export async function getPendingFeedbackAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized', donations: [], sessions: [] };
    }

    // Get user's profile to understand role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found', donations: [], sessions: [] };
    }

    // Get all rating entries submitted by this user to filter them out
    const { data: ratedEntries } = await supabase
      .from('ratings')
      .select('related_donation_id, related_session_id')
      .eq('rater_id', user.id);

    const ratedDonationIds = ratedEntries?.map(r => r.related_donation_id).filter(Boolean) as string[] || [];
    const ratedSessionIds = ratedEntries?.map(r => r.related_session_id).filter(Boolean) as string[] || [];

    let pendingDonations: PendingDonation[] = [];
    let pendingSessions: PendingSession[] = [];

    if (profile.role === 'school_admin') {
      // Find school managed by this admin
      const { data: school } = await supabase
        .from('schools')
        .select('school_id')
        .eq('user_id', user.id)
        .single();

      if (school) {
        // Completed donations to this school not yet rated
        const { data: donations } = await supabase
          .from('donations')
          .select('donation_id, donor_id, amount, donation_type, items_donated, created_at, profiles(first_name, last_name, email)')
          .eq('school_id', school.school_id)
          .or('payment_status.eq.Completed,status.eq.Delivered');

        pendingDonations = (donations || []).filter(
          d => !ratedDonationIds.includes(d.donation_id)
        ).map(d => ({
          ...d,
          profiles: (Array.isArray(d.profiles) ? d.profiles[0] : d.profiles) || null
        })) as unknown as PendingDonation[];

        // Completed sessions at this school not yet rated
        const { data: sessions } = await supabase
          .from('volunteer_sessions')
          .select('session_id, volunteer_id, title, session_date, profiles(first_name, last_name)')
          .eq('school_id', school.school_id)
          .eq('status', 'Completed');

        pendingSessions = (sessions || []).filter(
          s => !ratedSessionIds.includes(s.session_id)
        ).map(s => ({
          ...s,
          profiles: (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles) || null
        })) as unknown as PendingSession[];
      }
    } else if (profile.role === 'donor') {
      // Donations by this donor that are completed but not yet rated (rating the school)
      const { data: donations } = await supabase
        .from('donations')
        .select('donation_id, school_id, amount, donation_type, items_donated, created_at, schools(name, school_id, user_id)')
        .eq('donor_id', user.id)
        .or('payment_status.eq.Completed,status.eq.Delivered');

      pendingDonations = (donations || []).filter(
        d => !ratedDonationIds.includes(d.donation_id)
      ).map(d => ({
        ...d,
        schools: (Array.isArray(d.schools) ? d.schools[0] : d.schools) || null
      })) as unknown as PendingDonation[];
    } else if (profile.role === 'volunteer') {
      // Sessions this volunteer completed but not yet rated (rating the school)
      const { data: sessions } = await supabase
        .from('volunteer_sessions')
        .select('session_id, school_id, title, session_date, schools(name, school_id, user_id)')
        .eq('volunteer_id', user.id)
        .eq('status', 'Completed');

      pendingSessions = (sessions || []).filter(
        s => !ratedSessionIds.includes(s.session_id)
      ).map(s => ({
        ...s,
        schools: (Array.isArray(s.schools) ? s.schools[0] : s.schools) || null
      })) as unknown as PendingSession[];
    }

    return { success: true, donations: pendingDonations, sessions: pendingSessions };
  } catch (error) {
    console.error('Error in getPendingFeedbackAction:', error);
    return { success: false, error: 'Failed to fetch pending ratings', donations: [], sessions: [] };
  }
}

export async function getRatingsSummaryAction(rateeId: string): Promise<RatingSummary> {
  try {
    const supabase = await createClient();
    
    // Fetch all ratings received by the ratee
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating, feedback_categories')
      .eq('ratee_id', rateeId);

    if (error || !ratings || ratings.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        commonCategories: []
      };
    }

    const totalReviews = ratings.length;
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const categoryCounts: Record<string, number> = {};

    ratings.forEach(r => {
      const star = r.rating as 5 | 4 | 3 | 2 | 1;
      if (starDistribution[star] !== undefined) {
        starDistribution[star]++;
      }
      if (r.feedback_categories && Array.isArray(r.feedback_categories)) {
        r.feedback_categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    const commonCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averageRating,
      totalReviews,
      starDistribution,
      commonCategories
    };
  } catch (error) {
    console.error('Error in getRatingsSummaryAction:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      commonCategories: []
    };
  }
}

export async function getReviewsListAction(rateeId: string, page = 1, limit = 10) {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    const { data: reviews, error, count } = await supabase
      .from('ratings')
      .select('rating_id, rating, title, comment, feedback_categories, is_anonymous, is_verified, created_at, rater:profiles(first_name, last_name, role)', { count: 'exact' })
      .eq('ratee_id', rateeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Redact names if reviews are anonymous
    const sanitizedReviews = (reviews || []).map(review => {
      const raterObj = (Array.isArray(review.rater) ? review.rater[0] : review.rater) as unknown as { first_name: string; last_name: string; role: string } | null;
      if (review.is_anonymous) {
        return {
          ...review,
          rater: {
            first_name: 'Anonymous',
            last_name: raterObj?.role || 'User',
            role: raterObj?.role || 'user'
          }
        };
      }
      return {
        ...review,
        rater: raterObj
      };
    });

    return {
      success: true,
      reviews: sanitizedReviews,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    };
  } catch (error) {
    console.error('Error in getReviewsListAction:', error);
    return { success: false, error: 'Failed to retrieve reviews', reviews: [], totalCount: 0, totalPages: 0, currentPage: page };
  }
}

export async function getSchoolReviewsBySchoolIdAction(schoolId: string, page = 1, limit = 10) {
  try {
    const supabase = await createClient();
    
    // First, find school's user_id
    const { data: school } = await supabase
      .from('schools')
      .select('user_id')
      .eq('school_id', schoolId)
      .single();

    if (!school) {
      return { success: false, error: 'School not found', reviews: [], totalCount: 0, totalPages: 0, currentPage: page };
    }

    return getReviewsListAction(school.user_id, page, limit);
  } catch (error) {
    console.error('Error in getSchoolReviewsBySchoolIdAction:', error);
    return { success: false, error: 'Failed to retrieve school reviews', reviews: [], totalCount: 0, totalPages: 0, currentPage: page };
  }
}

export async function getSchoolSummaryBySchoolIdAction(schoolId: string): Promise<RatingSummary> {
  const supabase = await createClient();
  const { data: school } = await supabase
    .from('schools')
    .select('user_id')
    .eq('school_id', schoolId)
    .single();

  if (!school) {
    return {
      averageRating: 0,
      totalReviews: 0,
      starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      commonCategories: []
    };
  }

  return getRatingsSummaryAction(school.user_id);
}
