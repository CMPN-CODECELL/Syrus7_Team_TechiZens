import { createContext, useContext } from "react"

export const UserContext = createContext(null)

export function useUser() {
  const value = useContext(UserContext)
  if (!value) throw new Error("useUser must be used inside <UserProvider>")
  return value
}
