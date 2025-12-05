// ⚠️ DEPRECATED: Use lib/supabase/server.ts instead
// This file is kept for backward compatibility but should not be used in new code

import { createClient } from "./supabase/server";
import type { Profile } from "./types/database";

export async function getUserProfile() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile };
}
