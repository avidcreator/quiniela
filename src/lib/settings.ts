import "server-only";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** Feature flag keys stored in the `app_settings` table. */
export const LIVE_ENABLED_KEY = "live_enabled";

/**
 * Whether the live-matches feature is turned on. Read with the public
 * (anon) client so it works on the home page. Defaults to `true` if the
 * row is missing so a fresh DB behaves as before.
 */
export async function getLiveEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", LIVE_ENABLED_KEY)
    .maybeSingle();
  if (!data) return true;
  return data.value !== "false";
}

/** Toggle the live feature. Writes via the service-role client (admin only). */
export async function setLiveEnabled(enabled: boolean): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("app_settings")
    .upsert(
      { key: LIVE_ENABLED_KEY, value: enabled ? "true" : "false", updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
}
