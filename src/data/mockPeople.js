// MOCK people for the Connections pages (connections, profiles, "People you may know", invitations).
// The people are invented (names are not real students); colleges are only labels.
// Ids match the author ids used in mockConnectionPosts.js and mockComments.js.
// Only used by src/api/people.js while there is no backend. Delete once it is live.
//
// Person: { id, name, college, year, location, headline, about, interests, skills,
//           connectionCount, connectionIds }
//   year            profile numbers (-2 .. 5), see YEAR_OPTIONS in src/lib/scoring.js
//   connectionCount the number shown as "N connections"
//   connectionIds   ids (from this list) the person is connected to; used to work out mutual connections
// No contact details on purpose: contacts are only shared after double opt-in.

// Students the demo user is already connected to, and since when.
export const SEED_CONNECTIONS = [
  { id: "u-1", connectedAt: "2026-08-12T10:00:00+05:30" },
  { id: "u-2", connectedAt: "2026-08-20T10:00:00+05:30" },
  { id: "u-3", connectedAt: "2026-09-02T10:00:00+05:30" },
  { id: "u-4", connectedAt: "2026-09-10T10:00:00+05:30" },
  { id: "u-5", connectedAt: "2026-09-18T10:00:00+05:30" },
  { id: "u-6", connectedAt: "2026-09-25T10:00:00+05:30" },
  { id: "u-7", connectedAt: "2026-10-01T10:00:00+05:30" },
  { id: "u-8", connectedAt: "2026-10-05T10:00:00+05:30" },
]

export const mockPeople = [
  // ---- Already connected (SEED_CONNECTIONS) ----
  {
    id: "u-1", name: "Priya Nair", college: "BITS Pilani", year: 2, location: "Pilani",
    headline: "Mobile and web developer in the making",
    about: "Second-year student who likes shipping small apps. Looking for hackathon teammates.",
    interests: ["Mobile Apps", "Social Impact"], skills: ["Flutter", "React Native"],
    connectionCount: 214, connectionIds: ["u-2", "u-5", "u-6", "u-11"],
  },
  {
    id: "u-2", name: "Aarav Mehta", college: "IIT Madras", year: 3, location: "Chennai",
    headline: "Data science and machine learning enthusiast",
    about: "Third-year student working on climate data projects. Happy to help beginners get started.",
    interests: ["Data Science", "AI & Machine Learning", "Sustainability"], skills: ["Python", "SQL", "Statistics"],
    connectionCount: 342, connectionIds: ["u-1", "u-3", "u-4", "u-7", "u-12", "u-15"],
  },
  {
    id: "u-3", name: "Rohan Iyer", college: "NIT Trichy", year: 4, location: "Tiruchirappalli",
    headline: "Final-year student exploring machine learning",
    about: "Finishing my last year and preparing for research internships. I share notes on the courses I complete.",
    interests: ["AI & Machine Learning", "Data Science"], skills: ["Python", "PyTorch"],
    connectionCount: 289, connectionIds: ["u-2", "u-4", "u-7", "u-14"],
  },
  {
    id: "u-4", name: "Ananya Sharma", college: "IIIT Hyderabad", year: 3, location: "Hyderabad",
    headline: "AI and security hobbyist",
    about: "Into deep learning and capture-the-flag contests. Currently looking for a team for an AI hackathon.",
    interests: ["AI & Machine Learning", "Cybersecurity"], skills: ["Python", "PyTorch", "Linux"],
    connectionCount: 301, connectionIds: ["u-2", "u-3", "u-10", "u-12", "u-13"],
  },
  {
    id: "u-5", name: "Kabir Singh", college: "VIT Vellore", year: 1, location: "Vellore",
    headline: "First-year learning web development",
    about: "Just started coding. Trying out one workshop every month.",
    interests: ["Web Development"], skills: ["HTML", "CSS"],
    connectionCount: 96, connectionIds: ["u-1", "u-6", "u-10"],
  },
  {
    id: "u-6", name: "Meera Joshi", college: "COEP Tech Pune", year: 2, location: "Pune",
    headline: "Design-minded engineering student",
    about: "Second-year student who enjoys design and frontend work. Preparing for my first hackathon.",
    interests: ["Design", "Web Development"], skills: ["Figma", "React"],
    connectionCount: 158, connectionIds: ["u-1", "u-5", "u-8", "u-11", "u-16"],
  },
  {
    id: "u-7", name: "Arjun Reddy", college: "IIT Guwahati", year: 4, location: "Guwahati",
    headline: "Contest programmer and data science fan",
    about: "Final year. I practise for contests and help juniors with problem solving.",
    interests: ["Data Science", "AI & Machine Learning"], skills: ["Python", "Algorithms"],
    connectionCount: 410, connectionIds: ["u-2", "u-3", "u-12"],
  },
  {
    id: "u-8", name: "Ishita Das", college: "IIT Kharagpur", year: 2, location: "Kharagpur",
    headline: "Robotics and sustainability tinkerer",
    about: "Building small robots, and putting together a team for a climate hackathon.",
    interests: ["Robotics", "Sustainability"], skills: ["Arduino", "Python"],
    connectionCount: 187, connectionIds: ["u-6", "u-13", "u-15"],
  },

  // ---- Have already invited the demo user (see mockInvitations). Their posts appear once accepted. ----
  {
    id: "u-9", name: "Dev Patel", college: "NIT Karnataka", year: 3, location: "Surathkal",
    headline: "Finance and web development",
    about: "Third-year student building a personal finance tracker in my spare time.",
    interests: ["Finance", "Web Development"], skills: ["JavaScript", "SQL"],
    connectionCount: 175, connectionIds: ["u-11", "u-14", "u-16"],
  },
  {
    id: "u-10", name: "Sana Khan", college: "VIT Vellore", year: 4, location: "Vellore",
    headline: "Cybersecurity student",
    about: "Final year, preparing for security roles. I play CTFs on weekends.",
    interests: ["Cybersecurity"], skills: ["Linux", "Networking"],
    connectionCount: 233, connectionIds: ["u-4", "u-5", "u-13"],
  },

  // ---- Suggestions ----
  {
    id: "u-11", name: "Riya Kapoor", college: "IIT Delhi", year: 2, location: "Delhi",
    headline: "Product designer and frontend learner",
    about: "Designing apps and learning React. Open to design sprints and small teams.",
    interests: ["Design", "Web Development"], skills: ["Figma", "React"],
    connectionCount: 126, connectionIds: ["u-1", "u-6", "u-9"],
  },
  {
    id: "u-12", name: "Karan Malhotra", college: "BITS Pilani", year: 3, location: "Pilani",
    headline: "Machine learning with a statistics focus",
    about: "Studying machine learning from the statistics side. Enjoy reading papers with friends.",
    interests: ["AI & Machine Learning", "Data Science"], skills: ["Python", "Statistics"],
    connectionCount: 204, connectionIds: ["u-2", "u-4", "u-7"],
  },
  {
    id: "u-13", name: "Zoya Ahmed", college: "IIIT Hyderabad", year: 1, location: "Hyderabad",
    headline: "First-year security and cloud learner",
    about: "Starting out with Linux and networking labs.",
    interests: ["Cybersecurity", "Cloud & DevOps"], skills: ["Linux", "Networking"],
    connectionCount: 72, connectionIds: ["u-4", "u-8", "u-10"],
  },
  {
    id: "u-14", name: "Nikhil Rao", college: "VIT Vellore", year: 4, location: "Vellore",
    headline: "Aspiring founder",
    about: "Final year, running a small startup club on campus.",
    interests: ["Entrepreneurship", "Finance"], skills: ["Pitching", "Excel"],
    connectionCount: 267, connectionIds: ["u-3", "u-9", "u-16"],
  },
  {
    id: "u-15", name: "Tara Menon", college: "NIT Karnataka", year: 2, location: "Surathkal",
    headline: "Sustainability and data",
    about: "Working on waste-reduction projects on campus.",
    interests: ["Sustainability", "Social Impact"], skills: ["Python", "Design"],
    connectionCount: 141, connectionIds: ["u-2", "u-8", "u-16"],
  },
  {
    id: "u-16", name: "Vikram Choudhary", college: "COEP Tech Pune", year: 3, location: "Pune",
    headline: "Cloud and web developer",
    about: "Third-year student deploying side projects to the cloud.",
    interests: ["Cloud & DevOps", "Web Development"], skills: ["Docker", "Linux", "JavaScript"],
    connectionCount: 192, connectionIds: ["u-6", "u-9", "u-14", "u-15"],
  },
]

// Invitations the demo user has received (the sender is a person above).
export const mockInvitations = [
  { id: "inv-1", personId: "u-9", createdAt: "2026-10-08T17:00:00+05:30" },
  { id: "inv-2", personId: "u-10", createdAt: "2026-10-07T12:30:00+05:30" },
]
