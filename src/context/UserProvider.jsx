import { useEffect, useState } from "react"
import { UserContext } from "./user-context"

const STORAGE_KEY = "nexus-user"

// Student profile fields from the POC.
const emptyProfile = {
  skills: [],
  interests: [],
  year: 2,
  location: "Mumbai",
  hoursPerWeek: 6,
  budget: 500,
}

// Placeholder identity used until real Google OAuth (Supabase) exists.
const demoAccount = {
  name: "Demo Student",
  email: "demo.student@example.com",
}

function loadUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  // Everything is saved in this browser only (no backend yet).
  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage unavailable: the app still works for this session.
    }
  }, [user])

  // Mock "Sign in with Google". Replace with Supabase Google OAuth later.
  function signIn() {
    setUser({ ...demoAccount, onboarded: false, profile: emptyProfile })
  }

  // Called when the step-by-step profile setup is finished.
  function completeOnboarding() {
    setUser((current) => ({ ...current, onboarded: true }))
  }

  function signOut() {
    setUser(null)
  }

  function updateProfile(changes) {
    setUser((current) => ({ ...current, profile: { ...current.profile, ...changes } }))
  }

  return (
    <UserContext.Provider value={{ user, signIn, signOut, updateProfile, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  )
}
