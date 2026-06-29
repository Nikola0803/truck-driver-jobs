/**
 * Re-exports the local SQLite-backed db client as `supabase`
 * so every existing import — `import { supabase } from "@/lib/supabase"` —
 * continues to work without touching page code.
 */
export { db as supabase } from "./db";
