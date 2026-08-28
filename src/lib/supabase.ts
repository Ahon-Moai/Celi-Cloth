import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Custom lock implementation to bypass Navigator LockManager issues
    // which cause uncaught "Acquiring an exclusive Navigator LockManager lock immediately failed" errors in browsers.
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
});

export default supabase;
