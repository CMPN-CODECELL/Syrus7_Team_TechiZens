import { useEffect, useState } from "react"
import { getCurrentUser, saveUser, signInWithGoogle, signOut as apiSignOut } from "@/api/auth"
import { UserContext } from "./user-context"

// Keeps "who is logged in" in React state so every screen can read it with useUser().
// All real work (login, saving) happens in src/api/auth.js, so this file does not
// change when the backend does.
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until we know if someone is logged in

  // On first load, check if a session already exists.
  useEffect(() => {
    getCurrentUser().then((current) => {
      setUser(current)
      setLoading(false)
    })
  }, [])

  async function signIn() {
    setUser(await signInWithGoogle())
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
