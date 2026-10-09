import { useEffect, useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { getOpportunities } from "@/api/opportunities"
import { searchWithAI } from "@/api/search"
import AiSearchPanel from "@/components/AiSearchPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CategoryCards from "@/components/CategoryCards"
import OpportunityCard from "@/components/OpportunityCard"
import { useSaved } from "@/context/saved-context"
import { useUser } from "@/context/user-context"
import { CATEGORIES } from "@/data/constants"
import { getEligibility, getRelevance, isLowCost, isSustainability } from "@/lib/scoring"

// The four POC filters.
const FILTERS = [
  { id: "beginner", label: "Beginner-Friendly", test: (o) => o.level === "Beginner" },
  { id: "online", label: "Online", test: (o) => o.format === "Online" },
  { id: "lowCost", label: "Free / Low-Cost", test: isLowCost },
  { id: "sustainability", label: "Sustainability & Social Impact", test: isSustainability },
]

export default function DiscoverPage({ onOpen }) {
  const { user } = useUser()
  const { profile } = user
  const { savedIds, toggleSave } = useSaved()

  const [opportunities, setOpportunities] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState(null)
  const [activeFilters, setActiveFilters] = useState([])
  // AI search: null = not used, otherwise { query, data } (data is null while it is thinking).
  const [ai, setAi] = useState(null)

  useEffect(() => {
    getOpportunities().then(setOpportunities).catch(() => setLoadError(true))
  }, [])

  function toggleFilter(id) {
    setActiveFilters((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
    )
  }

  // Enter or the Ask AI button: send the text as a plain-English request.
  async function handleAsk(event) {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) return
    setAi({ query, data: null })
    try {
      const data = await searchWithAI({ query, profile })
      setAi((current) => (current?.query === query ? { query, data } : current))
    } catch {
      setAi({ query, data: { understood: [], message: "The AI search could not run. Please try again.", results: [] } })
    }
  }

  function handleCategory(id) {
    setAi(null) // choosing a type goes back to the normal feed
    setCategory(id)
  }

  const search = searchTerm.trim().toLowerCase()
  const byId = Object.fromEntries((opportunities ?? []).map((o) => [o.id, o]))

  // Normal feed: score every opportunity against the profile, filter, then rank by relevance.
  const feed = (opportunities ?? [])
    .map((opportunity) => ({
      opportunity,
      ...getRelevance(opportunity, profile),
      eligibility: getEligibility(opportunity, profile),
    }))
    .filter(({ opportunity }) => !category || opportunity.category === category)
    .filter(({ opportunity }) =>
      FILTERS.filter((f) => activeFilters.includes(f.id)).every((f) => f.test(opportunity))
    )
    .filter(
      ({ opportunity }) =>
        !search ||
        [opportunity.title, opportunity.organizer.name, ...opportunity.interests, ...opportunity.skills]
          .join(" ")
          .toLowerCase()
          .includes(search)
    )
    .sort((a, b) => b.relevance - a.relevance)

  // AI results use the AI's own reason on each card.
  const aiCards = (ai?.data?.results ?? [])
    .map((result) => ({ result, opportunity: byId[result.opportunityId] }))
    .filter(({ opportunity }) => opportunity)
    .map(({ result, opportunity }) => ({
      opportunity,
      relevance: result.relevance,
      reason: result.reason,
      eligibility: getEligibility(opportunity, profile),
    }))

  const firstName = user.name.split(" ")[0]
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label

  function renderCards(cards) {
    return (
      <div className="grid gap-x-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Each card spans 5 rows (subgrid) so sections line up across a row */}
        {cards.map(({ opportunity, relevance, reason, eligibility }) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            relevance={relevance}
            reason={reason}
            eligibility={eligibility}
            onOpen={onOpen}
            saved={savedIds.includes(opportunity.id)}
            onToggleSave={toggleSave}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Hi, {firstName}</h1>

      {/* Typing searches by keyword. Enter or Ask AI reads it as a plain-English request. */}
      <form onSubmit={handleAsk} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search, or ask: free online coding workshops this weekend"
          aria-label="Search opportunities or ask the AI"
          className="h-11 pr-28 pl-9"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={!searchTerm.trim()}
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          <Sparkles /> Ask AI
        </Button>
      </form>

      <CategoryCards selected={category} onSelect={handleCategory} />

      <section className="space-y-4">
        {ai ? (
          <>
            <AiSearchPanel query={ai.query} data={ai.data} onClear={() => setAi(null)} />
            {ai.data && aiCards.length > 0 && (
              <>
                <h2 className="text-xl font-semibold">
                  {aiCards.length} {aiCards.length === 1 ? "result" : "results"}
                </h2>
                {renderCards(aiCards)}
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">{categoryLabel ?? "For you"}</h2>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
              {FILTERS.map((filter) => {
                const isOn = activeFilters.includes(filter.id)
                return (
                  <Button
                    key={filter.id}
                    size="sm"
                    variant={isOn ? "default" : "outline"}
                    aria-pressed={isOn}
                    onClick={() => toggleFilter(filter.id)}
                  >
                    {filter.label}
                  </Button>
                )
              })}
            </div>

            {loadError ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Could not load opportunities. Please try again.
              </p>
            ) : opportunities === null ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : feed.length > 0 ? (
              renderCards(feed)
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                <p>{search ? "No keyword matches." : "Nothing matches these filters."}</p>
                {search && (
                  <Button size="sm" variant="outline" onClick={handleAsk}>
                    <Sparkles /> Ask AI instead
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
