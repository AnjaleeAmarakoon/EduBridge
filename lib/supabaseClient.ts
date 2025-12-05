// ⚠️ DEPRECATED: Use lib/supabase/client.ts or lib/supabase/server.ts instead
// This file is kept for backward compatibility but should not be used in new code

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
