'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type SchoolType = 'Blind' | 'Deaf' | 'Rural';

export interface RegisterSchoolInput {
  name: string;
  type: SchoolType;
  address: string;
  contact_person: string;
  phone?: string;
  email?: string;
}

export async function registerSchool(data: RegisterSchoolInput) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: 'Not authenticated' };
  }

  // Check if school already exists for this user
  const { data: existingSchool } = await supabase
    .from('schools')
    .select('school_id')
    .eq('user_id', user.id)
    .single();

  if (existingSchool) {
    return { error: 'You have already registered a school' };
  }

  // Create school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .insert({
      user_id: user.id,
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
    return { error: schoolError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/requests/create');
  
  return { success: true, school };
}
