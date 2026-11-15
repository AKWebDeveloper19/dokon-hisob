import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Service role klienti: RLS’ni chetlab o‘tadi. FAQAT serverda va faqat
 * xodim yaratish, PIN tekshiruvi kabi aniq amallar uchun ishlatiladi.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Muhit o‘zgaruvchisi topilmadi: SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
