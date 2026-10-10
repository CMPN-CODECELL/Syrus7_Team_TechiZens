import PersonInfo from "@/components/PersonInfo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/context/user-context"
import { rankPeople } from "@/lib/peopleRank"

const SHOWN = 5

// Side panel next to the feed: invitations you can answer, and a few people you may know.
// The data and the actions come from ConnectionsPage, so every part of the page stays in step.
export default function PeoplePanel({ invitations, suggestions, onAccept, onIgnore, onConnect, onWithdraw, onSeeAll }) {
  const { user } = useUser()
  const ranked = rankPeople(suggestions, user.profile)

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
                  <Button size="sm" className="flex-1" onClick={() => onAccept(invitation.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onIgnore(invitation.id)}>
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
            <p className="text-xs text-muted-foreground">
              No one else has joined yet. Students who finish setting up their profile appear here.
            </p>
          ) : (
            ranked.slice(0, SHOWN).map(({ person, shared }) => (
              <div key={person.id} className="flex items-center justify-between gap-2">
                <PersonInfo person={person} note={shared.length > 0 ? `Shared: ${shared.join(", ")}` : undefined} />
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
            ))
          )}
          {ranked.length > SHOWN && (
            <Button variant="ghost" size="sm" className="w-full" onClick={onSeeAll}>
              See all {ranked.length} students
            </Button>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
