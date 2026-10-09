import { useState } from "react"
import Header from "@/components/Header"
import { useUser } from "@/context/user-context"
import ComingSoonPage from "@/pages/ComingSoonPage"
import DiscoverPage from "@/pages/DiscoverPage"
import LoginPage from "@/pages/LoginPage"
import OnboardingPage from "@/pages/OnboardingPage"
import ProfilePage from "@/pages/ProfilePage"

// Features from the POC that are not built yet. Each gets its own menu entry.
const COMING_SOON = {
  cheatsheets: {
    title: "Participation Cheat Sheet",
    items: ["Prerequisites and setup", "Key milestones", "Deliverable checklist"],
  },
  squads: {
    title: "Squad Hub",
    items: [
      "Leaders see the top 3-5 opted-in candidates",
      "Solo seekers see the top 5 best-fit squads",
      "Lightweight Connect mode for workshops",
      "Contacts revealed only after double opt-in",
      "Copy Roster when a team is full, then apply on the organizer's website",
    ],
  },
  alerts: {
    title: "Change Sentinel",
    items: ["In-app alerts for deadline changes", "In-app alerts for fee changes", "In-app alerts for rule changes"],
  },
}

function App() {
  const { user, loading } = useUser()
  const [page, setPage] = useState("discover")

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>
  if (!user) return <LoginPage />
  if (!user.onboarded) return <OnboardingPage />

  const comingSoon = COMING_SOON[page]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header page={page} onNavigate={setPage} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {page === "discover" && <DiscoverPage />}
        {page === "profile" && <ProfilePage />}
        {comingSoon && <ComingSoonPage {...comingSoon} />}
      </main>
    </div>
  )
}

export default App
