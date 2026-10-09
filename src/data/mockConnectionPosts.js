// MOCK connection posts for the frontend demo. The people are invented (names are not real
// students) and the colleges are only labels. Posts point at mock opportunity ids.
// Only used by src/api/connections.js while there is no backend. Delete once it is live.
//
// type: "saved" | "recommended" | "looking_for_team" | "update"
// author.year uses the same numbers as the student profile (see YEAR_OPTIONS in src/lib/scoring.js).
// No contact details appear here on purpose: contacts are only shared after double opt-in.
export const mockConnectionPosts = [
  {
    id: "post-1",
    author: { id: "u-1", name: "Priya Nair", college: "BITS Pilani", year: 2 },
    type: "saved",
    text: null,
    opportunityId: "opp-4",
    createdAt: "2026-10-09T09:20:00+05:30",
    likeCount: 4,
  },
  {
    id: "post-2",
    author: { id: "u-2", name: "Aarav Mehta", college: "IIT Madras", year: 3 },
    type: "recommended",
    text: "Great problem set if you like data. Worth a look.",
    opportunityId: "opp-2",
    createdAt: "2026-10-08T20:05:00+05:30",
    likeCount: 12,
  },
  {
    id: "post-3",
    author: { id: "u-3", name: "Rohan Iyer", college: "NIT Trichy", year: 4 },
    type: "update",
    text: "Just wrapped up this course. The assignments were worth the time.",
    opportunityId: "opp-22",
    createdAt: "2026-10-08T11:40:00+05:30",
    likeCount: 18,
  },
  {
    id: "post-4",
    author: { id: "u-4", name: "Ananya Sharma", college: "IIIT Hyderabad", year: 3 },
    type: "looking_for_team",
    text: "Looking for 2 teammates, ideally someone comfortable with PyTorch.",
    opportunityId: "opp-6",
    createdAt: "2026-10-07T18:30:00+05:30",
    likeCount: 7,
  },
  {
    id: "post-5",
    author: { id: "u-5", name: "Kabir Singh", college: "VIT Vellore", year: 1 },
    type: "saved",
    text: null,
    opportunityId: "opp-7",
    createdAt: "2026-10-07T10:15:00+05:30",
    likeCount: 2,
  },
  {
    id: "post-6",
    author: { id: "u-6", name: "Meera Joshi", college: "COEP Tech Pune", year: 2 },
    type: "update",
    text: "First hackathon coming up and I'm a little nervous. Any tips from people who have done one?",
    opportunityId: null,
    createdAt: "2026-10-06T21:00:00+05:30",
    likeCount: 23,
  },
  {
    id: "post-7",
    author: { id: "u-7", name: "Arjun Reddy", college: "IIT Guwahati", year: 4 },
    type: "recommended",
    text: "Solid practice before placement season. Problems get hard fast.",
    opportunityId: "opp-16",
    createdAt: "2026-10-06T08:45:00+05:30",
    likeCount: 9,
  },
  {
    id: "post-8",
    author: { id: "u-8", name: "Ishita Das", college: "IIT Kharagpur", year: 2 },
    type: "looking_for_team",
    text: "Our team needs a designer. Comfortable with Figma? Message me through Nexus.",
    opportunityId: "opp-1",
    createdAt: "2026-10-05T16:10:00+05:30",
    likeCount: 11,
  },
  {
    id: "post-9",
    author: { id: "u-9", name: "Dev Patel", college: "NIT Karnataka", year: 3 },
    type: "saved",
    text: null,
    opportunityId: "opp-3",
    createdAt: "2026-10-04T13:25:00+05:30",
    likeCount: 5,
  },
  {
    id: "post-10",
    author: { id: "u-10", name: "Sana Khan", college: "VIT Vellore", year: 4 },
    type: "update",
    text: "Registered for the campus CTF this December. Anyone else going?",
    opportunityId: "opp-14",
    createdAt: "2026-10-03T19:50:00+05:30",
    likeCount: 6,
  },
]
