// Small helpers shared by the social api files (people.js, connections.js, squads.js).
// Only api files import Supabase; screens never do.

import { isDemoLogin } from "@/api/auth"
import { supabase } from "@/lib/supabase"

// The signed-in student's id, or null when nobody is signed in (or this is the local demo login,
// which has no database account). The social features then show empty lists.
export async function getUserId() {
  if (isDemoLogin) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// Same, but for actions: throws when there is nobody to act as.
export async function requireUserId() {
  const id = await getUserId()
  if (!id) throw new Error("Sign in with Google to do this.")
  return id
}

// Turns a Supabase error into a normal exception (and passes the data through).
export function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

// The columns of the public_profiles view (never contact details).
export const PERSON_COLUMNS = "id, name, college, year, location, headline, about, interests, skills, connection_count"

// A public_profiles row as the Person shape in CONTRIBUTING.md. The signed-in student gets the id "me".
export function toPerson(row, myId) {
  return {
    id: row.id === myId ? "me" : row.id,
    name: row.name || "Student",
    college: row.college || null,
    year: row.year,
    location: row.location ?? "",
    headline: row.headline ?? "",
    about: row.about ?? "",
    interests: row.interests ?? [],
    skills: row.skills ?? [],
    connectionCount: row.connection_count ?? 0,
  }
}

// The id a screen uses for a person: "me" for the signed-in student, otherwise their real id.
export const screenId = (id, myId) => (id === myId ? "me" : id)
// And back: the real id for an id from a screen.
export const realId = (id, myId) => (id === "me" ? myId : id)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (value) => typeof value === "string" && UUID.test(value)
