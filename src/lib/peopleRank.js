// Ranks other students for "People you may know" and Find people: the most in common comes first.

import { getSharedWithProfile } from "@/lib/scoring"

// people -> [{ person, shared }], best first. `shared` = the interests and skills you both have.
export function rankPeople(people, profile) {
  return people
    .map((person) => ({ person, shared: getSharedWithProfile(person, profile) }))
    .sort((a, b) => b.shared.length - a.shared.length || a.person.name.localeCompare(b.person.name))
}
