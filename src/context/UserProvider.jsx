import { useEffect, useRef, useState } from "react"
import { getCurrentUser, saveUser, signInWithGoogle, signOut as apiSignOut } from "@/api/auth"
import { supabase } from "@/lib/supabase"
import { UserContext } from "./user-context"

// Keeps "who is logged in" in React state so every screen can read it with useUser().
// Synchronizes state with Supabase auth events and profile database rows.
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState(false) // true when the last save of the profile failed
  const latestUser = useRef(null) // the newest version of the user, which is what a retry saves

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
    latestUser.current = null
    setSaveError(false)
    setUser(null)
  }

  // Saves in the background and remembers whether it worked. Only the newest save decides the flag, so a slow
  // older save cannot hide a failure (or report one) for something the student changed afterwards.
  async function persist(next) {
    latestUser.current = next
    const saved = await saveUser(next)
    if (latestUser.current === next) setSaveError(!saved)
    return saved
  }

  // Updates the screen straight away, then saves in the background.
  function updateProfile(changes) {
    const next = { ...user, profile: { ...user.profile, ...changes } }
    setUser(next)
    persist(next)
  }

  // The Profile page's Save button: saves the display name and the profile fields together.
  // Returns true when it was saved (the page shows its own message if not).
  function saveProfile({ name, ...profileChanges }) {
    const next = { ...user, name: name ?? user.name, profile: { ...user.profile, ...profileChanges } }
    setUser(next)
    return persist(next)
  }

  // Called when the step-by-step profile setup is finished.
  function completeOnboarding() {
    const next = { ...user, onboarded: true }
    setUser(next)
    persist(next)
  }

  // "Try again" after a failed save.
  function retrySave() {
    if (latestUser.current) persist(latestUser.current)
  }

  return (
    <UserContext.Provider value={{ user, loading, saveError, retrySave, signIn, signOut, updateProfile, saveProfile, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  )
}
