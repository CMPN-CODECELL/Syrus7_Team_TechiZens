import { createContext, useContext } from "react"

// Lets any component open another student's profile without passing a callback through every layer.
// App.jsx provides the value: { openPerson(personId) }.
export const NavContext = createContext(null)

export function useNav() {
  const value = useContext(NavContext)
  if (!value) throw new Error("useNav must be used inside the navigation provider in App.jsx")
  return value
}
