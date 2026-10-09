import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { getConnections, removeConnection } from "@/api/people"
import PersonLink from "@/components/PersonLink"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNav } from "@/context/nav-context"
import { formatDate, personInitials } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"

// "Connections" tab: everyone you are connected to, with search, sorting and remove.
// `onChange` is called after a connection is removed (the feed needs to refresh).
export default function ConnectionsList({ onChange }) {
  const { openPerson } = useNav()
  const [connections, setConnections] = useState(null) // null = still loading
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("recent")
  const [confirmingId, setConfirmingId] = useState(null) // the connection being asked "Remove?"

  useEffect(() => {
    getConnections().then(setConnections)
  }, [])

  if (connections === null) return <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>

  async function handleRemove(personId) {
    setConnections((current) => current.filter((person) => person.id !== personId))
    setConfirmingId(null)
    await removeConnection(personId)
    onChange()
  }

  const query = search.trim().toLowerCase()
  const visible = connections
    .filter(
      (person) =>
        !query || [person.name, person.college, person.headline].join(" ").toLowerCase().includes(query)
    )
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : 0)) // "recent" keeps the order from the api

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm font-medium">
          {connections.length} {connections.length === 1 ? "connection" : "connections"}
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search connections"
            aria-label="Search connections"
            className="h-8 w-44 pl-8"
          />
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort connections"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="recent">Recently added</option>
          <option value="name">Name</option>
        </select>
      </div>

      {connections.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No connections yet. Connect with people you may know.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No one matches that search.
        </p>
      ) : (
        visible.map((person) => (
          <Card key={person.id} size="sm">
            <CardContent className="flex items-center gap-3">
              <PersonLink personId={person.id} aria-label={`${person.name}'s profile`}>
                <Avatar size="lg">
                  <AvatarFallback>{personInitials(person.name)}</AvatarFallback>
                </Avatar>
              </PersonLink>

              <div className="min-w-0 flex-1 leading-tight">
                <PersonLink personId={person.id} className="block max-w-full truncate text-sm font-medium">
                  {person.name}
                </PersonLink>
                <p className="truncate text-sm text-muted-foreground">{person.headline}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {person.college} · {yearLabel(person.year)} · Connected{" "}
                  {formatDate(person.connectedAt, { year: true })}
                </p>
              </div>

              {confirmingId === person.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-xs text-muted-foreground">Remove?</span>
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(person.id)}>
                    Yes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                    No
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => openPerson(person.id)}>
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setConfirmingId(person.id)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
