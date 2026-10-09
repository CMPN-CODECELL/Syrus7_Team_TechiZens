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
  "Game Development",
  "AR/VR",
  "Blockchain & Web3",
  "Internet of Things",
  "Embedded Systems",
  "Electronics",
  "Computer Networks",
  "Quantum Computing",
  "Data Structures & Algorithms",
  "Competitive Programming",
  "Open Source",
  "Automation & Low-Code",
  "Mathematics",
  "Research & Academia",
  "Product Management",
  "Management & Consulting",
  "Digital Marketing",
  "E-commerce",
  "Content Writing",
  "Public Speaking",
  "Photography & Video",
  "Music & Art",
  "Sports & Fitness",
  "Healthcare & Biotech",
  "Education",
  "Agriculture & FoodTech",
  "Electric Vehicles & Energy",
  "Mechanical Engineering",
  "Space & Aerospace",
  "Law & Policy",
]

// Quick-pick skills (students can also type their own). The pickers show the first 16 and fold the rest away,
// so the most common ones come first; after that the order is roughly languages, web, mobile, data and AI, cloud and
// tools, databases, security and systems, hardware, design and media, core engineering, business and soft skills.
const COMMON_SKILLS = [
  "Python", "JavaScript", "Java", "C++", "HTML", "CSS", "React", "SQL",
  "Git", "Figma", "Machine Learning", "Data Analysis", "Excel", "Node.js", "Communication", "Public Speaking",
]
const MORE_SKILLS = [
  "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "R", "MATLAB", "Dart", "SQL",
  "HTML", "CSS", "React", "Next.js", "Node.js", "Express", "Angular", "Vue", "Tailwind CSS", "Django", "Flask", "FastAPI", "Spring Boot",
  "Flutter", "React Native", "Android", "iOS",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "NLP", "Computer Vision", "Generative AI",
  "Data Analysis", "Data Visualization", "Statistics", "Power BI", "Tableau", "Excel",
  "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Linux", "CI/CD", "Terraform",
  "MongoDB", "PostgreSQL", "MySQL", "Firebase", "Supabase", "REST APIs", "GraphQL",
  "Cybersecurity", "Ethical Hacking", "Cryptography", "Networking",
  "Arduino", "Raspberry Pi", "IoT", "Embedded C", "VLSI", "Circuit Design",
  "Figma", "UI/UX", "Canva", "Photoshop", "Illustrator", "Video Editing", "Blender", "Unity", "Unreal Engine",
  "AutoCAD", "SolidWorks", "Solidity", "Blockchain",
  "Data Structures", "Algorithms", "Problem Solving", "Competitive Programming",
  "Public Speaking", "Communication", "Leadership", "Teamwork", "Content Writing", "Copywriting", "Technical Writing",
  "SEO", "Digital Marketing", "Social Media", "Project Management", "Product Management", "Pitching", "Research", "Critical Thinking",
]
export const SKILL_SUGGESTIONS = [...new Set([...COMMON_SKILLS, ...MORE_SKILLS])]

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
}
