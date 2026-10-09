// MOCK people for "People you may know" and invitations. The people are invented (names are not
// real students); colleges are only labels. Ids continue the author ids used in mockConnectionPosts.js.
// Only used by src/api/people.js while there is no backend. Delete once it is live.
//
// Person: { id, name, college, year, interests, skills }. year uses the profile numbers (-2 .. 5).
// No contact details on purpose: contacts are only shared after double opt-in.

// Students the demo user is already connected to (authors u-1 .. u-8 of the mock posts).
export const SEED_CONNECTED_IDS = ["u-1", "u-2", "u-3", "u-4", "u-5", "u-6", "u-7", "u-8"]

export const mockPeople = [
  // Have already invited the demo user (see mockInvitations). Their posts appear once accepted.
  { id: "u-9", name: "Dev Patel", college: "NIT Karnataka", year: 3, interests: ["Finance", "Web Development"], skills: ["JavaScript", "SQL"] },
  { id: "u-10", name: "Sana Khan", college: "VIT Vellore", year: 4, interests: ["Cybersecurity"], skills: ["Linux", "Networking"] },

  // Suggestions
  { id: "u-11", name: "Riya Kapoor", college: "IIT Delhi", year: 2, interests: ["Design", "Web Development"], skills: ["Figma", "React"] },
  { id: "u-12", name: "Karan Malhotra", college: "BITS Pilani", year: 3, interests: ["AI & Machine Learning", "Data Science"], skills: ["Python", "Statistics"] },
  { id: "u-13", name: "Zoya Ahmed", college: "IIIT Hyderabad", year: 1, interests: ["Cybersecurity", "Cloud & DevOps"], skills: ["Linux", "Networking"] },
  { id: "u-14", name: "Nikhil Rao", college: "VIT Vellore", year: 4, interests: ["Entrepreneurship", "Finance"], skills: ["Pitching", "Excel"] },
  { id: "u-15", name: "Tara Menon", college: "NIT Karnataka", year: 2, interests: ["Sustainability", "Social Impact"], skills: ["Python", "Design"] },
  { id: "u-16", name: "Vikram Choudhary", college: "COEP Tech Pune", year: 3, interests: ["Cloud & DevOps", "Web Development"], skills: ["Docker", "Linux", "JavaScript"] },
]

// Invitations the demo user has received (the sender is a person above).
export const mockInvitations = [
  { id: "inv-1", personId: "u-9", createdAt: "2026-10-08T17:00:00+05:30" },
  { id: "inv-2", personId: "u-10", createdAt: "2026-10-07T12:30:00+05:30" },
]
