import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import CookieNotice from "@/components/CookieNotice"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { NavContext } from "@/context/nav-context"
import { useUser } from "@/context/user-context"
import { isSchoolStudent } from "@/lib/age"
import AlertsPage from "@/pages/AlertsPage"
import ConnectionsPage from "@/pages/ConnectionsPage"
import DiscoverPage from "@/pages/DiscoverPage"
import LegalPage from "@/pages/LegalPage"
import LoginPage from "@/pages/LoginPage"
import OnboardingPage from "@/pages/OnboardingPage"
import OpportunityDetailPage from "@/pages/OpportunityDetailPage"
import PersonProfilePage from "@/pages/PersonProfilePage"
import ProfilePage from "@/pages/ProfilePage"
import SquadHubPage from "@/pages/SquadHubPage"

// Screens that are switched off for school students (under 18).
const SOCIAL_PAGES = ["connections", "squads"]

function App() {
  const { user, loading, saveError, retrySave } = useUser()
  const [page, setPage] = useState("discover")
  const [openId, setOpenId] = useState(null) // id of the opportunity being viewed, if any
  const [personId, setPersonId] = useState(null) // id of the student whose profile is being viewed, if any
  const [connectionsTab, setConnectionsTab] = useState("feed") // kept here so Back returns to the same tab
  const [squadId, setSquadId] = useState(null) // opportunity selected in the Squad Hub, kept so Back returns to it
  const [legalPage, setLegalPage] = useState(null) // "privacy" | "terms" | "sources" | "contact" while a legal page is open
  const scrollStack = useRef([]) // where each screen was scrolled to, so Back returns there
  const personHistory = useRef([]) // profiles visited before the current one, so Back goes through them

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>

  // Legal pages can be opened before signing in (from the login page) and while signed in (from the footer).
  if (!user) {
    return (
      <>
        {legalPage ? (
          <div className="min-h-screen bg-background px-4 py-6 text-foreground">
            <LegalPage page={legalPage} onBack={() => setLegalPage(null)} onNavigate={setLegalPage} />
          </div>
        ) : (
          <LoginPage onOpenLegal={setLegalPage} />
        )}
        <CookieNotice onOpenPrivacy={() => setLegalPage("privacy")} />
      </>
    )
  }
  if (!user.onboarded) return <OnboardingPage />

  // School students (Class 10th to 12th) are treated as under 18: no Connections, no Squad Hub.
  const socialOff = isSchoolStudent(user.profile)
  const activePage = socialOff && SOCIAL_PAGES.includes(page) ? "discover" : page
  const showingSubPage = Boolean(legalPage || openId || personId)

  function openLegal(id) {
    if (!legalPage) remember()
    setLegalPage(id)
  }

  function backFromLegal() {
    setLegalPage(null)
    restore()
  }

  function goTo(nextPage) {
    setPage(nextPage)
    setLegalPage(null)
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
    if (socialOff) return
    if (id === "me") return goTo("profile") // your own profile is the Profile page
    if (personId) personHistory.current.push(personId) // coming from another profile
    else remember()
    setPersonId(id)
    window.scrollTo(0, 0)
  }

  // "Find teammates" on an opportunity: open the Squad Hub with it selected.
  function openSquad(opportunityId) {
    if (socialOff) return
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
        <Header page={activePage} onNavigate={goTo} />
        {saveError && (
          <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Your last change was not saved. Check your connection.
            <Button size="sm" variant="outline" onClick={retrySave}>
              Try again
            </Button>
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 pt-8 pb-8 sm:px-6">
          {/* The feed stays mounted (just hidden) so search and filters are kept when you come back */}
          {activePage === "discover" && (
            <div hidden={showingSubPage}>
              <DiscoverPage onOpen={openOpportunity} />
            </div>
          )}
          {/* An opportunity or a person can be opened from any screen; Back returns to the previous one */}
          {legalPage && <LegalPage page={legalPage} onBack={backFromLegal} onNavigate={setLegalPage} />}
          {!legalPage && openId && <OpportunityDetailPage opportunityId={openId} onBack={backFromOpportunity} />}
          {!legalPage && !openId && personId && (
            <PersonProfilePage key={personId} personId={personId} onBack={backFromPerson} onOpen={openOpportunity} />
          )}
          {!showingSubPage && activePage === "alerts" && <AlertsPage onOpen={openOpportunity} />}
          {!showingSubPage && activePage === "connections" && (
            <ConnectionsPage onOpen={openOpportunity} tab={connectionsTab} onTabChange={setConnectionsTab} />
          )}
          {!showingSubPage && activePage === "squads" && (
            <SquadHubPage selectedId={squadId} onSelect={setSquadId} onOpen={openOpportunity} />
          )}
          {!showingSubPage && activePage === "profile" && <ProfilePage />}
        </main>
        {/* Room at the bottom for the fixed mobile tab bar */}
        <Footer onOpen={openLegal} className="pb-24 md:pb-6" />
        <CookieNotice onOpenPrivacy={() => openLegal("privacy")} />
      </div>
    </NavContext.Provider>
  )
}

export default App
