import { useEffect, useState } from "react"
import { getCurrentUser, saveUser, signInWithGoogle, signOut as apiSignOut } from "@/api/auth"
import { supabase } from "@/lib/supabase"
import { UserContext } from "./user-context"

// Keeps "who is logged in" in React state so every screen can read it with useUser().
// Synchronizes state with Supabase auth events and profile database rows.
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Check if session already exists on load
    getCurrentUser().then((current) => {
      if (isMounted) {
        setUser(current)
        setLoading(false)
      }
    })

    // Listen for auth events (e.g. Google OAuth callback redirect, signout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const current = await getCurrentUser()
        if (isMounted) setUser(current)
      } else if (event === "SIGNED_OUT") {
        if (isMounted) setUser(null)
      }
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  async function signIn() {
    const result = await signInWithGoogle()
    // When falling back to demo mode without Supabase keys, a user object is returned directly
    if (result && result.name && result.profile) {
      setUser(result)
    }
  }

  async function signOut() {
    await apiSignOut()
    setUser(null)
  }

  // Updates the screen straight away, then saves in the background.
  function updateProfile(changes) {
    const next = { ...user, profile: { ...user.profile, ...changes } }
    setUser(next)
    saveUser(next)
  }

  // Called when the step-by-step profile setup is finished.
  function completeOnboarding() {
    const next = { ...user, onboarded: true }
    setUser(next)
    saveUser(next)
  }

  return (
    <UserContext.Provider value={{ user, loading, signIn, signOut, updateProfile, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  )
}
