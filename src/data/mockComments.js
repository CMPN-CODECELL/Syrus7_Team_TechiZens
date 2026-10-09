// MOCK comments for the Connections feed. People are invented, like mockConnectionPosts.js.
// Only used by src/api/connections.js while there is no backend. Delete once it is live.
//
// parentId: null for a comment, or the id of the comment it replies to (replies sit one level
// under a comment, like LinkedIn).
export const mockComments = [
  // post-1: Priya saved the BITS hackathon
  { id: "c-1", postId: "post-1", parentId: null, author: { id: "u-5", name: "Kabir Singh", college: "VIT Vellore", year: 1 }, text: "Is it okay for first-years?", createdAt: "2026-10-09T10:05:00+05:30" },
  { id: "c-2", postId: "post-1", parentId: "c-1", author: { id: "u-1", name: "Priya Nair", college: "BITS Pilani", year: 2 }, text: "Yes, teams of 2-4 and it's beginner level. You'd be fine.", createdAt: "2026-10-09T10:30:00+05:30" },

  // post-2: Aarav recommends the climate challenge
  { id: "c-3", postId: "post-2", parentId: null, author: { id: "u-4", name: "Ananya Sharma", college: "IIIT Hyderabad", year: 3 }, text: "Registered. The dataset looks interesting.", createdAt: "2026-10-08T21:10:00+05:30" },
  { id: "c-4", postId: "post-2", parentId: null, author: { id: "u-9", name: "Dev Patel", college: "NIT Karnataka", year: 3 }, text: "Is it solo or team?", createdAt: "2026-10-08T22:00:00+05:30" },
  { id: "c-5", postId: "post-2", parentId: "c-4", author: { id: "u-2", name: "Aarav Mehta", college: "IIT Madras", year: 3 }, text: "Teams of up to 3, or solo.", createdAt: "2026-10-08T22:20:00+05:30" },

  // post-3: Rohan finished the ML course
  { id: "c-6", postId: "post-3", parentId: null, author: { id: "u-6", name: "Meera Joshi", college: "COEP Tech Pune", year: 2 }, text: "How many hours a week did it take?", createdAt: "2026-10-08T13:00:00+05:30" },
  { id: "c-7", postId: "post-3", parentId: "c-6", author: { id: "u-3", name: "Rohan Iyer", college: "NIT Trichy", year: 4 }, text: "Around 5. Assignments took the most time.", createdAt: "2026-10-08T14:15:00+05:30" },

  // post-4: Ananya looking for teammates
  { id: "c-8", postId: "post-4", parentId: null, author: { id: "u-7", name: "Arjun Reddy", college: "IIT Guwahati", year: 4 }, text: "Good luck finding a team!", createdAt: "2026-10-07T19:00:00+05:30" },

  // post-6: Meera's first hackathon
  { id: "c-9", postId: "post-6", parentId: null, author: { id: "u-2", name: "Aarav Mehta", college: "IIT Madras", year: 3 }, text: "Pick a small scope on day one. A working demo beats a big idea.", createdAt: "2026-10-06T21:30:00+05:30" },
  { id: "c-10", postId: "post-6", parentId: null, author: { id: "u-8", name: "Ishita Das", college: "IIT Kharagpur", year: 2 }, text: "Sleep a little. Seriously.", createdAt: "2026-10-06T22:10:00+05:30" },
  { id: "c-11", postId: "post-6", parentId: "c-9", author: { id: "u-6", name: "Meera Joshi", college: "COEP Tech Pune", year: 2 }, text: "That helps a lot, thank you!", createdAt: "2026-10-06T22:45:00+05:30" },

  // post-8: Ishita needs a designer
  { id: "c-12", postId: "post-8", parentId: null, author: { id: "u-9", name: "Dev Patel", college: "NIT Karnataka", year: 3 }, text: "Do you have a deadline for joining the team?", createdAt: "2026-10-05T17:00:00+05:30" },
]
