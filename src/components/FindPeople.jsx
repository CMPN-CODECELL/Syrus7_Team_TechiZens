import { useState } from "react"
import { Search } from "lucide-react"
import PersonInfo from "@/components/PersonInfo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/user-context"
import { rankPeople } from "@/lib/peopleRank"

const PAGE_SIZE = 20

// "Find people" tab: every student you are not connected to yet, with search.
// Students with the most in common come first. Only name, college, year, headline, interests and skills are
// shown here (never contact details).
export default function FindPeople({ suggestions, onConnect, onWithdraw }) {
  const { user } = useUser()
  const [search, setSearch] = useState("")
  const [similarOnly, setSimilarOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const query = search.trim().toLowerCase()
  const ranked = rankPeople(suggestions, user.profile)
    .filter(({ shared }) => !similarOnly || shared.length > 0)
    .filter(
      ({ person }) =>
        !query ||
        [person.name, person.college, person.headline, ...person.interests, ...person.skills]
          .join(" ")
          .toLowerCase()
          .includes(query)
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            placeholder="Search by name, college, skill or interest"
            aria-label="Search students"
            className="h-8 pl-8"
          />
        </div>
        <Button
          size="sm"
          variant={similarOnly ? "default" : "outline"}
          aria-pressed={similarOnly}
          onClick={() => {
            setSimilarOnly((on) => !on)
            setVisibleCount(PAGE_SIZE)
          }}
        >
          Shared interests or skills
        </Button>
        <p className="ml-auto text-sm text-muted-foreground">
          {ranked.length} {ranked.length === 1 ? "student" : "students"}
        </p>
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No one else is here yet. Students who finish setting up their profile appear here, so share Nexus with your
          friends.
        </p>
      ) : ranked.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No one matches that. Try a different word, or turn off the filter.
        </p>
      ) : (
        <>
          {ranked.slice(0, visibleCount).map(({ person, shared }) => (
            <Card key={person.id} size="sm">
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <PersonInfo person={person} />
                  <Button
                    size="sm"
                    variant={person.requestSent ? "secondary" : "outline"}
                    className="shrink-0"
                    title={person.requestSent ? "Withdraw request" : undefined}
                    onClick={() => (person.requestSent ? onWithdraw(person.id) : onConnect(person.id))}
                  >
                    {person.requestSent ? "Pending" : "Connect"}
                  </Button>
                </div>
                {person.headline && <p className="text-sm">{person.headline}</p>}
                {shared.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">In common:</span>
                    {shared.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {ranked.length > visibleCount && (
            <Button variant="outline" className="w-full" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Show more
            </Button>
          )}
        </>
      )}
    </div>
  )
}
