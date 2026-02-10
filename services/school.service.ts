import { createClient } from '@/lib/supabase/server';

type SchoolType = 'Blind' | 'Deaf' | 'Rural';

export interface RegisterSchoolInput {
  name: string;
  type: SchoolType;
  address: string;
  contact_person: string;
  phone?: string;
  email?: string;
}

export class SchoolService {
  /**
   * Register a new school for a user
   */
  static async registerSchool(userId: string, data: RegisterSchoolInput) {
    const supabase = await createClient();

    // Check if school already exists for this user
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('school_id')
      .eq('user_id', userId)
      .single();

    if (existingSchool) {
      throw new Error('You have already registered a school');
    }

    // Create school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        user_id: userId,
        name: data.name,
        type: data.type,
        address: data.address,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        verified: false,
      })
      .select()
      .single();

    if (schoolError) {
      console.error('School registration error:', schoolError);
      throw new Error(schoolError.message);
    }

    return { school };
  }

  /**
   * Get school by user ID
   */
  static async getSchoolByUserId(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Get school by school ID
   */
  static async getSchoolById(schoolId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('school_id', schoolId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update school information
   */
  static async updateSchool(userId: string, schoolId: string, updates: Partial<RegisterSchoolInput>) {
    const supabase = await createClient();

    // Verify ownership
    const { data: school } = await supabase
      .from('schools')
      .select('school_id')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .single();

    if (!school) {
      throw new Error('School not found or unauthorized');
    }

    const { data, error } = await supabase
      .from('schools')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { school: data };
  }
}
