import { useRef, useState } from "react"
import Header from "@/components/Header"
import { useUser } from "@/context/user-context"
import AlertsPage from "@/pages/AlertsPage"
import ComingSoonPage from "@/pages/ComingSoonPage"
import DiscoverPage from "@/pages/DiscoverPage"
import LoginPage from "@/pages/LoginPage"
import OnboardingPage from "@/pages/OnboardingPage"
import OpportunityDetailPage from "@/pages/OpportunityDetailPage"
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
}

function App() {
  const { user, loading } = useUser()
  const [page, setPage] = useState("discover")
  const [openId, setOpenId] = useState(null) // id of the opportunity being viewed, if any
  const feedScroll = useRef(0) // where the page was scrolled to, so Back returns there

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>
  if (!user) return <LoginPage />
  if (!user.onboarded) return <OnboardingPage />

  const comingSoon = openId ? null : COMING_SOON[page]

  function goTo(nextPage) {
    setPage(nextPage)
    setOpenId(null)
  }

  function openOpportunity(id) {
    feedScroll.current = window.scrollY
    setOpenId(id)
    window.scrollTo(0, 0)
  }

  function backFromDetail() {
    setOpenId(null)
    requestAnimationFrame(() => window.scrollTo(0, feedScroll.current))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header page={page} onNavigate={goTo} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* The feed stays mounted (just hidden) so search and filters are kept when you come back */}
        {page === "discover" && (
          <div hidden={Boolean(openId)}>
            <DiscoverPage onOpen={openOpportunity} />
          </div>
        )}
        {/* A detail page can be opened from any screen; Back returns to that screen */}
        {openId && <OpportunityDetailPage opportunityId={openId} onBack={backFromDetail} />}
        {!openId && page === "alerts" && <AlertsPage onOpen={openOpportunity} />}
        {!openId && page === "profile" && <ProfilePage />}
        {comingSoon && <ComingSoonPage {...comingSoon} />}
      </main>
    </div>
  )
}

export default App
