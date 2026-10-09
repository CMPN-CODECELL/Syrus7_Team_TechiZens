// ============================================================================
// SWAP POINT: login and profile storage (owner: backend / Supabase teammate)
//
// Everything about "who is logged in" and "where the profile is saved" lives here.
// Right now it is fake: a demo user saved in this browser's localStorage.
// To go live, replace each function body with the Supabase equivalent.
// Keep the function names, inputs and return values the same and the app keeps working.
//
// A "user" looks like:
//   { name, email, onboarded: boolean, profile: { headline, about, skills, interests, isBeginner, year, location, budget } }
// (older saved users may not have headline / about yet; treat them as empty text)
// ============================================================================

import { EMPTY_PROFILE } from "@/data/constants"

const STORAGE_KEY = "nexus-user"

const DEMO_ACCOUNT = {
  name: "Demo Student",
  email: "demo.student@example.com",
}

// Is someone already logged in? Returns the user, or null.
// TODO (Supabase): supabase.auth.getSession() then load their row from the profiles table.
export async function getCurrentUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

// "Sign in with Google". Returns the user.
// TODO (Supabase): supabase.auth.signInWithOAuth({ provider: "google" }). This redirects to
// Google and comes back, so you may need to finish the login inside getCurrentUser() instead.
export async function signInWithGoogle() {
  const user = { ...DEMO_ACCOUNT, onboarded: false, profile: EMPTY_PROFILE }
  await saveUser(user)
  return user
}

export async function signOut() {
  // TODO (Supabase): supabase.auth.signOut()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

// Saves the whole user (profile + onboarded flag). Called after every profile change.
// TODO (Supabase): upsert into the profiles table.
export async function saveUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Storage unavailable: the app still works for this session.
  }
}
