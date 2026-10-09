// MOCK alerts for the frontend demo (Change Sentinel). Invented, like mockOpportunities.js.
// Only used by src/api/alerts.js while there is no backend. Delete once real alerts exist.
//
// field:     "deadline" | "fee" | "rules"
// oldValue / newValue: ready-to-show text, so the screen can say exactly what changed.
export const mockAlerts = [
  { id: "alert-1", opportunityId: "opp-1", field: "deadline", oldValue: "18 Nov 2026", newValue: "25 Nov 2026", changedAt: "2026-10-08T18:30:00+05:30", read: false },
  { id: "alert-2", opportunityId: "opp-4", field: "fee", oldValue: "Free", newValue: "₹150", changedAt: "2026-10-08T09:10:00+05:30", read: false },
  { id: "alert-3", opportunityId: "opp-3", field: "rules", oldValue: "Teams of 2-3", newValue: "Teams of 2-4", changedAt: "2026-10-07T15:45:00+05:30", read: false },
  { id: "alert-4", opportunityId: "opp-13", field: "deadline", oldValue: "5 Dec 2026", newValue: "12 Dec 2026", changedAt: "2026-10-06T11:00:00+05:30", read: false },
  { id: "alert-5", opportunityId: "opp-14", field: "fee", oldValue: "₹150", newValue: "₹200", changedAt: "2026-10-05T20:20:00+05:30", read: false },
  { id: "alert-6", opportunityId: "opp-17", field: "rules", oldValue: "Open to 2nd year and above", newValue: "Open to 3rd year and above", changedAt: "2026-10-04T10:05:00+05:30", read: false },
  { id: "alert-7", opportunityId: "opp-7", field: "deadline", oldValue: "17 Nov 2026", newValue: "19 Nov 2026", changedAt: "2026-10-03T14:00:00+05:30", read: false },
  { id: "alert-8", opportunityId: "opp-12", field: "rules", oldValue: "Submit a 5-page deck", newValue: "Submit an 8-page deck", changedAt: "2026-10-02T17:30:00+05:30", read: false },
]
