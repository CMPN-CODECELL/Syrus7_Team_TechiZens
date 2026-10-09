// ============================================================================
// SWAP POINT: login and profile storage (owner: backend / Supabase teammate)
//
// Manages authentication and user profile synchronization with Supabase.
// Preserves the User data shape documented in CONTRIBUTING.md.
//
// A "user" looks like:
//   { name, email, onboarded: boolean, profile: { headline, about, skills, interests, isBeginner, year, location, budget } }
// (older saved users may not have headline / about yet; treat them as empty text)
// ============================================================================

import { EMPTY_PROFILE } from "@/data/constants"
import { supabase } from "@/lib/supabase"

const STORAGE_KEY = "nexus-user"
const isConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Helper to map a database profile row and auth user into the app's User shape
function formatUser(profileRow, authUser) {
  const name =
    profileRow?.name ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split("@")[0] ||
    "Student"

  const email = profileRow?.email || authUser?.email || ""
  const onboarded = profileRow ? Boolean(profileRow.onboarded) : false

  const profile = {
    skills: profileRow?.skills ?? EMPTY_PROFILE.skills,
    interests: profileRow?.interests ?? EMPTY_PROFILE.interests,
    isBeginner: profileRow?.is_beginner ?? EMPTY_PROFILE.isBeginner,
    year: profileRow?.year ?? EMPTY_PROFILE.year,
    location: profileRow?.location ?? EMPTY_PROFILE.location,
    budget: profileRow?.budget ?? EMPTY_PROFILE.budget,
  }

  return {
    name,
    email,
    onboarded,
    profile,
  }
}

// Is someone already logged in? Returns the user, or null.
export async function getCurrentUser() {
  if (!isConfigured) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return null
    }

    const authUser = session.user

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle()

    if (profileError) {
      console.error("Error fetching profile from Supabase:", profileError.message)
    }

    const user = formatUser(profileRow, authUser)

    // If profile row doesn't exist yet, insert the default profile
    if (!profileRow) {
      await supabase.from("profiles").upsert({
        id: authUser.id,
        name: user.name,
        email: user.email,
        onboarded: false,
        skills: user.profile.skills,
        interests: user.profile.interests,
        is_beginner: user.profile.isBeginner,
        year: user.profile.year,
        location: user.profile.location,
        budget: user.profile.budget,
      })
    }

    return user
  } catch (err) {
    console.error("Error in getCurrentUser:", err)
    return null
  }
}

// "Sign in with Google" OAuth initiation
export async function signInWithGoogle() {
  if (!isConfigured) {
    const demoUser = {
      name: "Demo Student",
      email: "demo.student@example.com",
      onboarded: false,
      profile: EMPTY_PROFILE,
    }
    await saveUser(demoUser)
    return demoUser
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) {
    console.error("Error signing in with Google:", error.message)
    throw error
  }

  return data
}

export async function signOut() {
  if (isConfigured) {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error.message)
    }
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

// Saves the whole user (profile + onboarded flag). Called after every profile change.
export async function saveUser(user) {
  if (!user) return

  if (!isConfigured) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } catch {
      // Storage unavailable
    }
    return
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return
    }

    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      name: user.name,
      email: user.email,
      onboarded: Boolean(user.onboarded),
      skills: user.profile?.skills || [],
      interests: user.profile?.interests || [],
      is_beginner: Boolean(user.profile?.isBeginner),
      year: user.profile?.year ?? 2,
      location: user.profile?.location || "",
      budget: user.profile?.budget ?? 500,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving profile to Supabase:", error.message)
    }
  } catch (err) {
    console.error("Error in saveUser:", err)
  }
}
