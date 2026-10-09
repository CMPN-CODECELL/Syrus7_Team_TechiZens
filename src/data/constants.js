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
export const EMPTY_PROFILE = {
  skills: [],
  interests: [],
  isBeginner: false,
  year: 2, // see YEAR_OPTIONS in src/lib/scoring.js
  location: "",
  budget: 500, // INR
}
