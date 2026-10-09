import { useEffect, useState } from "react"
import {
  acceptInvitation,
  getInvitations,
  getSuggestions,
  ignoreInvitation,
  sendConnectionRequest,
  withdrawConnectionRequest,
} from "@/api/people"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/context/user-context"
import { personInitials } from "@/lib/format"
import { getSharedWithProfile, yearLabel } from "@/lib/scoring"

// Avatar, name and a one-line description. Used for both invitations and suggestions.
function PersonInfo({ person, note }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar size="lg">
        <AvatarFallback>{personInitials(person.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {person.college} · {yearLabel(person.year)}
        </p>
        {note && <p className="truncate text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  )
}

// Side panel next to the feed: invitations you can answer, and people you may know.
// `onConnectionsChange` is called when accepting an invitation, because that adds posts to the feed.
export default function PeoplePanel({ onConnectionsChange }) {
  const { user } = useUser()
  const [invitations, setInvitations] = useState(null) // null = still loading
  const [suggestions, setSuggestions] = useState(null)

  useEffect(() => {
    Promise.all([getInvitations(), getSuggestions()]).then(([loadedInvitations, loadedSuggestions]) => {
      setInvitations(loadedInvitations)
      setSuggestions(loadedSuggestions)
    })
  }, [])

  if (invitations === null || suggestions === null) return null

  async function handleAccept(invitation) {
    setInvitations((current) => current.filter((item) => item.id !== invitation.id))
    await acceptInvitation(invitation.id)
    onConnectionsChange()
  }

  async function handleIgnore(invitation) {
    setInvitations((current) => current.filter((item) => item.id !== invitation.id))
    await ignoreInvitation(invitation.id)
  }

  // "Connect" turns into "Pending"; clicking Pending withdraws the request.
  async function toggleRequest(person) {
    setSuggestions((current) =>
      current.map((item) => (item.id === person.id ? { ...item, requestSent: !item.requestSent } : item))
    )
    await (person.requestSent ? withdrawConnectionRequest(person.id) : sendConnectionRequest(person.id))
  }

  // Most in common first.
  const ranked = suggestions
    .map((person) => ({ person, shared: getSharedWithProfile(person, user.profile) }))
    .sort((a, b) => b.shared.length - a.shared.length || a.person.name.localeCompare(b.person.name))

  return (
    <aside className="space-y-4">
      {invitations.length > 0 && (
        <Card size="sm">
          <CardContent className="space-y-3">
            <h2 className="text-sm font-semibold">Invitations ({invitations.length})</h2>
            {invitations.map((invitation) => (
              <div key={invitation.id} className="space-y-2">
                <PersonInfo person={invitation.person} />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAccept(invitation)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleIgnore(invitation)}>
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardContent className="space-y-3">
          <h2 className="text-sm font-semibold">People you may know</h2>
          {ranked.length === 0 ? (
            <p className="text-xs text-muted-foreground">No suggestions right now.</p>
          ) : (
            ranked.map(({ person, shared }) => (
              <div key={person.id} className="flex items-center justify-between gap-2">
                <PersonInfo
                  person={person}
                  note={shared.length > 0 ? `Shared: ${shared.join(", ")}` : undefined}
                />
                <Button
                  size="sm"
                  variant={person.requestSent ? "secondary" : "outline"}
                  className="shrink-0"
                  title={person.requestSent ? "Withdraw request" : undefined}
                  onClick={() => toggleRequest(person)}
                >
                  {person.requestSent ? "Pending" : "Connect"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
