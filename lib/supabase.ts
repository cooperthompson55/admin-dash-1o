import { createClient } from "@supabase/supabase-js"

// Use environment variables instead of hardcoded values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Log configuration status (for debugging)
if (typeof window !== "undefined") {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase configuration is incomplete. Check your environment variables.")
  } else {
    console.log("Supabase configuration loaded successfully.")
  }
}

// Create a Supabase client with error handling
let supabase: ReturnType<typeof createClient>

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
} catch (error) {
  console.error("Failed to initialize Supabase client:", error)
  // Create a dummy client that will return empty results to prevent app crashes
  supabase = {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: new Error("Supabase client initialization failed") }),
      }),
    }),
    // Add other required methods as needed
  } as any
}

export { supabase, supabaseUrl, supabaseAnonKey }
