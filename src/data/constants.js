// Fixed lists used across the app (not fetched from a backend).

export const CATEGORIES = [
  { id: "courses", label: "Courses", singular: "Course" },
  { id: "internships", label: "Internships", singular: "Internship" },
  { id: "hackathons", label: "Hackathons", singular: "Hackathon" },
  { id: "workshops", label: "Workshops", singular: "Workshop" },
  { id: "competitions", label: "Competitions", singular: "Competition" },
]

export const INTEREST_OPTIONS = [
  "Web Development",
  "AI & Machine Learning",
  "Data Science",
  "Design",
  "Cybersecurity",
  "Mobile Apps",
  "Cloud & DevOps",
  "Robotics",
  "Entrepreneurship",
  "Finance",
  "Sustainability",
  "Social Impact",
]

// What a brand-new student's profile looks like before onboarding.
// Limits for the text fields (the screens enforce them; enforce them on the server too).
export const HEADLINE_MAX_LENGTH = 100
export const ABOUT_MAX_LENGTH = 300

export const EMPTY_PROFILE = {
  headline: "", // one line shown under your name, e.g. "Second-year student exploring web development"
  about: "", // a short paragraph about yourself
  skills: [],
  interests: [],
  isBeginner: false,
  year: 2, // see YEAR_OPTIONS in src/lib/scoring.js
  location: "",
  budget: 500, // INR
}
