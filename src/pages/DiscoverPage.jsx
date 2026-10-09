import { useEffect, useMemo, useState } from "react"
import { ChevronDown, RefreshCw, Search, Sparkles, X } from "lucide-react"
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
import { ALL_FILTERS, FILTERS, MORE_FILTERS, SORTS } from "@/lib/discoverOptions"
import { isClosed } from "@/lib/ingestion"
import { getEligibility, getRelevance } from "@/lib/scoring"

const PAGE_SIZE = 24 // cards shown at first; "Show more" adds this many

// The long example does not fit on a phone, where it was cut off mid-word.
const SEARCH_PLACEHOLDER = window.matchMedia("(max-width: 639px)").matches
  ? "Search or ask AI"
  : "Search, or ask: online coding workshops this weekend"

export default function DiscoverPage({ onOpen }) {
  const { user } = useUser()
  const { profile } = user
  const { savedIds, toggleSave } = useSaved()

  const [opportunities, setOpportunities] = useState(null) // null = still loading
  const [loadError, setLoadError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState(null)
  const [activeFilters, setActiveFilters] = useState([])
  const [sortId, setSortId] = useState("match")
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [refreshing, setRefreshing] = useState(false)
  // AI search: null = not used, otherwise { query, data } (data is null while it is thinking).
  const [ai, setAi] = useState(null)

  useEffect(() => {
    getOpportunities().then(setOpportunities).catch(() => setLoadError(true))
  }, [])

  // Refresh button: load the latest listings again. If the new list comes back empty (for example the
  // connection failed), keep showing the old one instead of wiping the page.
  function refresh() {
    setRefreshing(true)
    setLoadError(false)
    getOpportunities({ force: true })
      .then((latest) => setOpportunities((old) => (latest.length === 0 && old?.length ? old : latest)))
      .catch(() => setLoadError(true))
      .finally(() => setRefreshing(false))
  }

  function toggleFilter(id) {
    setActiveFilters((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
    )
    setVisibleCount(PAGE_SIZE)
  }

  function handleSort(event) {
    setSortId(event.target.value)
    setVisibleCount(PAGE_SIZE)
  }

  function clearFilters() {
    setActiveFilters([])
    setVisibleCount(PAGE_SIZE)
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
    setVisibleCount(PAGE_SIZE)
  }

  const search = searchTerm.trim().toLowerCase()
  const byId = useMemo(() => Object.fromEntries((opportunities ?? []).map((o) => [o.id, o])), [opportunities])

  // Scoring is the slow part, so it only reruns when the listings or the profile change (not on every keystroke).
  // Closed ones (deadline passed) stay out of the feed; they still open from saved items and posts.
  const scored = useMemo(
    () =>
      (opportunities ?? [])
        .filter((opportunity) => !isClosed(opportunity))
        .map((opportunity) => ({
          opportunity,
          ...getRelevance(opportunity, profile),
          eligibility: getEligibility(opportunity, profile),
        })),
    [opportunities, profile]
  )

  // Types that have at least one open opportunity (empty types are hidden from the cards).
  const availableCategories = useMemo(
    () => (opportunities ? new Set(opportunities.filter((o) => !isClosed(o)).map((o) => o.category)) : null),
    [opportunities]
  )

  // Normal feed: filter the scored list, then rank by relevance.
  const feed = scored
    .filter(({ opportunity }) => !category || opportunity.category === category)
    .filter(({ opportunity }) =>
      ALL_FILTERS.filter((f) => activeFilters.includes(f.id)).every((f) => f.test(opportunity, profile))
    )
    .filter(
      ({ opportunity }) =>
        !search ||
        [opportunity.title, opportunity.organizer.name, ...opportunity.interests, ...opportunity.skills]
          .join(" ")
          .toLowerCase()
          .includes(search)
    )
    .sort(SORTS.find((s) => s.id === sortId).compare)

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

  // When the newest listing was last verified, e.g. "9 Oct, 4:40 pm" (empty while loading or with no listings).
  const newestCheck = (opportunities ?? []).reduce((newest, o) => (o.lastVerified > newest ? o.lastVerified : newest), "")
  const lastChecked = newestCheck
    ? new Date(newestCheck).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : ""

  // "More filters" stays open while one of them is on, so an active filter is never hidden.
  const activeMoreCount = MORE_FILTERS.filter((f) => activeFilters.includes(f.id)).length
  const moreOpen = showMoreFilters || activeMoreCount > 0

  function renderFilterButton(filter) {
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
  }

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
          onChange={(event) => {
            setSearchTerm(event.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
          placeholder={SEARCH_PLACEHOLDER}
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

      <CategoryCards selected={category} onSelect={handleCategory} available={availableCategories} />

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{categoryLabel ?? "For you"}</h2>
              <div className="flex items-center gap-3">
                {lastChecked && (
                  <span className="text-xs text-muted-foreground" title="When the newest listing was last verified">
                    Listings checked {lastChecked}
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing || opportunities === null}>
                  <RefreshCw className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
                {FILTERS.map(renderFilterButton)}
                <Button size="sm" variant="ghost" aria-expanded={moreOpen} onClick={() => setShowMoreFilters(!moreOpen)}>
                  More filters{activeMoreCount > 0 ? ` (${activeMoreCount})` : ""}
                  <ChevronDown className={moreOpen ? "rotate-180" : ""} />
                </Button>
                {activeFilters.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    <X /> Clear
                  </Button>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Sort by
                <select
                  value={sortId}
                  onChange={handleSort}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {SORTS.map((sort) => (
                    <option key={sort.id} value={sort.id}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {moreOpen && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="More filters">
                {MORE_FILTERS.map(renderFilterButton)}
              </div>
            )}

            {loadError ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Could not load opportunities. Please try again.
              </p>
            ) : opportunities === null ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
            ) : feed.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {feed.length} {feed.length === 1 ? "opportunity" : "opportunities"}
                </p>
                {renderCards(feed.slice(0, visibleCount))}
                {feed.length > visibleCount && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}>
                      Show more ({feed.length - visibleCount} left)
                    </Button>
                  </div>
                )}
              </>
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
