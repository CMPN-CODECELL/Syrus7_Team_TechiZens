import { useState } from "react"
import { Search } from "lucide-react"
import PersonInfo from "@/components/PersonInfo"
import PersonLink from "@/components/PersonLink"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNav } from "@/context/nav-context"
import { formatDate, formatTimeAgo, personDetails, personInitials } from "@/lib/format"

// "Connections" tab: invitations waiting for you, everyone you are connected to (search, sort, remove),
// and the requests you sent that nobody answered yet.
// The data and actions come from ConnectionsPage.
export default function ConnectionsList({ connections, invitations, sent, now, onAccept, onIgnore, onWithdraw, onRemove, onFind }) {
  const { openPerson } = useNav()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("recent")
  const [confirmingId, setConfirmingId] = useState(null) // the connection being asked "Remove?"

  const query = search.trim().toLowerCase()
  const visible = connections
    .filter(
      (person) =>
        !query || [person.name, person.college, person.headline].join(" ").toLowerCase().includes(query)
    )
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : 0)) // "recent" keeps the order from the api

  async function handleRemove(personId) {
    setConfirmingId(null)
    await onRemove(personId)
  }

  return (
    <div className="space-y-6">
      {/* Invitations: also on small screens, where the side panel sits far below */}
      {invitations.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Invitations ({invitations.length})</h2>
          {invitations.map((invitation) => (
            <Card key={invitation.id} size="sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <PersonInfo person={invitation.person} note={`Asked ${formatTimeAgo(invitation.createdAt, now)}`} />
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => onAccept(invitation.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onIgnore(invitation.id)}>
                    Ignore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-4">
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
          <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No connections yet. Connect with students who share your interests, and their posts will show up in your
              feed.
            </p>
            <Button onClick={onFind}>Find people</Button>
          </div>
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
                  {person.headline && <p className="truncate text-sm text-muted-foreground">{person.headline}</p>}
                  <p className="truncate text-xs text-muted-foreground">
                    {personDetails(person)} · Connected {formatDate(person.connectedAt, { year: true })}
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
      </section>

      {sent.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Sent requests ({sent.length})</h2>
          {sent.map((request) => (
            <Card key={request.id} size="sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <PersonInfo person={request.person} note={`Sent ${formatTimeAgo(request.createdAt, now)}`} />
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => onWithdraw(request.id)}>
                  Withdraw
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}
