import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Header from "@/components/Header"
import { NavContext } from "@/context/nav-context"
import { useUser } from "@/context/user-context"
import AlertsPage from "@/pages/AlertsPage"
import ConnectionsPage from "@/pages/ConnectionsPage"
import DiscoverPage from "@/pages/DiscoverPage"
import LoginPage from "@/pages/LoginPage"
import OnboardingPage from "@/pages/OnboardingPage"
import OpportunityDetailPage from "@/pages/OpportunityDetailPage"
import PersonProfilePage from "@/pages/PersonProfilePage"
import ProfilePage from "@/pages/ProfilePage"
import SquadHubPage from "@/pages/SquadHubPage"

function App() {
  const { user, loading, saveError, retrySave } = useUser()
  const [page, setPage] = useState("discover")
  const [openId, setOpenId] = useState(null) // id of the opportunity being viewed, if any
  const [personId, setPersonId] = useState(null) // id of the student whose profile is being viewed, if any
  const [connectionsTab, setConnectionsTab] = useState("feed") // kept here so Back returns to the same tab
  const [squadId, setSquadId] = useState(null) // opportunity selected in the Squad Hub, kept so Back returns to it
  const scrollStack = useRef([]) // where each screen was scrolled to, so Back returns there
  const personHistory = useRef([]) // profiles visited before the current one, so Back goes through them

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>
  if (!user) return <LoginPage />
  if (!user.onboarded) return <OnboardingPage />

  const showingSubPage = Boolean(openId || personId)

  function goTo(nextPage) {
    setPage(nextPage)
    setOpenId(null)
    setPersonId(null)
    scrollStack.current = []
    personHistory.current = []
  }

  function remember() {
    scrollStack.current.push(window.scrollY)
    window.scrollTo(0, 0)
  }

  function restore() {
    const y = scrollStack.current.pop() ?? 0
    requestAnimationFrame(() => window.scrollTo(0, y))
  }

  function openOpportunity(id) {
    remember()
    setOpenId(id)
  }

  function openPerson(id) {
    if (id === "me") return goTo("profile") // your own profile is the Profile page
    if (personId) personHistory.current.push(personId) // coming from another profile
    else remember()
    setPersonId(id)
    window.scrollTo(0, 0)
  }

  // "Find teammates" on an opportunity: open the Squad Hub with it selected.
  function openSquad(opportunityId) {
    setSquadId(opportunityId)
    goTo("squads")
    window.scrollTo(0, 0)
  }

  function backFromOpportunity() {
    setOpenId(null)
    restore()
  }

  function backFromPerson() {
    const previous = personHistory.current.pop()
    if (previous) {
      setPersonId(previous)
      window.scrollTo(0, 0)
    } else {
      setPersonId(null)
      restore()
    }
  }

  return (
    <NavContext.Provider value={{ openPerson, openSquad }}>
      <div className="min-h-screen bg-background text-foreground">
        <Header page={page} onNavigate={goTo} />
        {saveError && (
          <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Your last change was not saved. Check your connection.
            <Button size="sm" variant="outline" onClick={retrySave}>
              Try again
            </Button>
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* The feed stays mounted (just hidden) so search and filters are kept when you come back */}
          {page === "discover" && (
            <div hidden={showingSubPage}>
              <DiscoverPage onOpen={openOpportunity} />
            </div>
          )}
          {/* An opportunity or a person can be opened from any screen; Back returns to the previous one */}
          {openId && <OpportunityDetailPage opportunityId={openId} onBack={backFromOpportunity} />}
          {!openId && personId && (
            <PersonProfilePage key={personId} personId={personId} onBack={backFromPerson} onOpen={openOpportunity} />
          )}
          {!showingSubPage && page === "alerts" && <AlertsPage onOpen={openOpportunity} />}
          {!showingSubPage && page === "connections" && (
            <ConnectionsPage onOpen={openOpportunity} tab={connectionsTab} onTabChange={setConnectionsTab} />
          )}
          {!showingSubPage && page === "squads" && (
            <SquadHubPage selectedId={squadId} onSelect={setSquadId} onOpen={openOpportunity} />
          )}
          {!showingSubPage && page === "profile" && <ProfilePage />}
        </main>
      </div>
    </NavContext.Provider>
  )
}

export default App
