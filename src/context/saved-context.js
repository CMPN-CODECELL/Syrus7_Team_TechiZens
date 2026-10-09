import { createContext, useContext } from "react"

export const SavedContext = createContext(null)

export function useSaved() {
  const value = useContext(SavedContext)
  if (!value) throw new Error("useSaved must be used inside <SavedProvider>")
  return value
}
