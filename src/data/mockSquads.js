// MOCK data for the Squad Hub. The people are invented (ids match mockPeople.js).
// Only used by src/api/squads.js while there is no backend. Delete once it is live.

// In the demo, a person you contact answers "yes" this many milliseconds later (unless they are in DECLINERS).
// A real backend works differently: the other student answers whenever they choose.
export const MOCK_RESPONSE_DELAY_MS = 4000
export const DECLINERS = ["u-10", "u-14"]

// Contact details. They are only handed out by the api AFTER both sides agreed (double opt-in).
// All addresses are invented and use example.com.
export const CONTACTS = {
  "u-1": "priya.nair@example.com",
  "u-2": "aarav.mehta@example.com",
  "u-3": "rohan.iyer@example.com",
  "u-4": "ananya.sharma@example.com",
  "u-5": "kabir.singh@example.com",
  "u-6": "meera.joshi@example.com",
  "u-7": "arjun.reddy@example.com",
  "u-8": "ishita.das@example.com",
  "u-9": "dev.patel@example.com",
  "u-10": "sana.khan@example.com",
  "u-11": "riya.kapoor@example.com",
  "u-12": "karan.malhotra@example.com",
  "u-13": "zoya.ahmed@example.com",
  "u-14": "nikhil.rao@example.com",
  "u-15": "tara.menon@example.com",
  "u-16": "vikram.choudhary@example.com",
}

// Students who opted in as "looking for a team" for each team opportunity, and their weekly hours.
export const SEEKERS = {
  "opp-1": [
    { personId: "u-11", hoursPerWeek: 6 },
    { personId: "u-12", hoursPerWeek: 10 },
    { personId: "u-15", hoursPerWeek: 6 },
    { personId: "u-6", hoursPerWeek: 10 },
    { personId: "u-16", hoursPerWeek: 15 },
    { personId: "u-2", hoursPerWeek: 6 },
  ],
  "opp-2": [
    { personId: "u-12", hoursPerWeek: 10 },
    { personId: "u-2", hoursPerWeek: 6 },
    { personId: "u-7", hoursPerWeek: 15 },
    { personId: "u-9", hoursPerWeek: 6 },
    { personId: "u-15", hoursPerWeek: 6 },
  ],
  "opp-3": [
    { personId: "u-9", hoursPerWeek: 6 },
    { personId: "u-16", hoursPerWeek: 10 },
    { personId: "u-11", hoursPerWeek: 6 },
    { personId: "u-14", hoursPerWeek: 6 },
    { personId: "u-6", hoursPerWeek: 10 },
  ],
  "opp-4": [
    { personId: "u-1", hoursPerWeek: 10 },
    { personId: "u-5", hoursPerWeek: 3 },
    { personId: "u-6", hoursPerWeek: 6 },
    { personId: "u-13", hoursPerWeek: 3 },
    { personId: "u-11", hoursPerWeek: 6 },
  ],
  "opp-5": [
    { personId: "u-16", hoursPerWeek: 10 },
    { personId: "u-9", hoursPerWeek: 6 },
    { personId: "u-11", hoursPerWeek: 6 },
    { personId: "u-6", hoursPerWeek: 6 },
  ],
  "opp-6": [
    { personId: "u-4", hoursPerWeek: 15 },
    { personId: "u-12", hoursPerWeek: 10 },
    { personId: "u-3", hoursPerWeek: 10 },
    { personId: "u-7", hoursPerWeek: 15 },
    { personId: "u-2", hoursPerWeek: 10 },
  ],
  "opp-12": [
    { personId: "u-14", hoursPerWeek: 6 },
    { personId: "u-9", hoursPerWeek: 6 },
    { personId: "u-3", hoursPerWeek: 10 },
  ],
  "opp-13": [
    { personId: "u-11", hoursPerWeek: 6 },
    { personId: "u-14", hoursPerWeek: 10 },
    { personId: "u-15", hoursPerWeek: 6 },
    { personId: "u-8", hoursPerWeek: 6 },
    { personId: "u-6", hoursPerWeek: 6 },
  ],
  "opp-14": [
    { personId: "u-10", hoursPerWeek: 6 },
    { personId: "u-13", hoursPerWeek: 6 },
    { personId: "u-4", hoursPerWeek: 10 },
    { personId: "u-5", hoursPerWeek: 3 },
  ],
  "opp-15": [
    { personId: "u-14", hoursPerWeek: 6 },
    { personId: "u-9", hoursPerWeek: 10 },
    { personId: "u-12", hoursPerWeek: 6 },
  ],
}

// Existing squads that are looking for members. The squad's capacity is the opportunity's maximum team size.
// memberIds includes the leader.
export const SQUADS = [
  { id: "s-1", opportunityId: "opp-1", leaderId: "u-8", memberIds: ["u-8", "u-15"], lookingForSkills: ["React", "Design"], hoursPerWeek: 10 },
  { id: "s-2", opportunityId: "opp-1", leaderId: "u-6", memberIds: ["u-6", "u-1", "u-16"], lookingForSkills: ["Python"], hoursPerWeek: 10 },
  { id: "s-3", opportunityId: "opp-2", leaderId: "u-2", memberIds: ["u-2"], lookingForSkills: ["SQL", "Statistics"], hoursPerWeek: 6 },
  { id: "s-4", opportunityId: "opp-2", leaderId: "u-7", memberIds: ["u-7", "u-12"], lookingForSkills: ["Python"], hoursPerWeek: 15 },
  { id: "s-5", opportunityId: "opp-3", leaderId: "u-9", memberIds: ["u-9", "u-14"], lookingForSkills: ["Node", "JavaScript"], hoursPerWeek: 6 },
  { id: "s-6", opportunityId: "opp-4", leaderId: "u-1", memberIds: ["u-1"], lookingForSkills: ["Flutter", "React Native"], hoursPerWeek: 10 },
  { id: "s-7", opportunityId: "opp-4", leaderId: "u-6", memberIds: ["u-6", "u-5", "u-13"], lookingForSkills: ["React Native"], hoursPerWeek: 6 },
  { id: "s-8", opportunityId: "opp-5", leaderId: "u-16", memberIds: ["u-16", "u-9"], lookingForSkills: ["JavaScript", "APIs"], hoursPerWeek: 10 },
  { id: "s-9", opportunityId: "opp-6", leaderId: "u-4", memberIds: ["u-4", "u-3"], lookingForSkills: ["PyTorch", "Python"], hoursPerWeek: 15 },
  { id: "s-10", opportunityId: "opp-6", leaderId: "u-12", memberIds: ["u-12"], lookingForSkills: ["Python", "Statistics"], hoursPerWeek: 10 },
  { id: "s-11", opportunityId: "opp-13", leaderId: "u-15", memberIds: ["u-15", "u-8", "u-11"], lookingForSkills: ["Design", "Pitching"], hoursPerWeek: 6 },
  { id: "s-12", opportunityId: "opp-14", leaderId: "u-13", memberIds: ["u-13"], lookingForSkills: ["Linux", "Networking"], hoursPerWeek: 6 },
  { id: "s-13", opportunityId: "opp-15", leaderId: "u-14", memberIds: ["u-14"], lookingForSkills: ["Pitching", "Analytics"], hoursPerWeek: 6 },
]
