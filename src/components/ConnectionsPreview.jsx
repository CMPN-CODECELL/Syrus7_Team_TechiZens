import { useEffect, useState } from "react"
import { getConnections } from "@/api/people"
import PersonLink from "@/components/PersonLink"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { personDetails, personInitials } from "@/lib/format"

const SHOWN = 8

// The student's connections, shown on their Profile next to what they took part in.
// (The full list, search and Remove are on the Connections page.) Contact details are never shown here.
export default function ConnectionsPreview() {
  const [connections, setConnections] = useState(null) // null = still loading

  useEffect(() => {
    getConnections()
      .then(setConnections)
      .catch(() => setConnections([]))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Connections{connections && connections.length > 0 ? ` (${connections.length})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connections === null ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : connections.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No connections yet. Find people in the Connections page.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {connections.slice(0, SHOWN).map((person) => (
              <li key={person.id} className="flex items-center gap-2.5">
                <Avatar>
                  <AvatarFallback>{personInitials(person.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 leading-tight">
                  <PersonLink personId={person.id} className="block max-w-full truncate text-sm font-medium">
                    {person.name}
                  </PersonLink>
                  <p className="truncate text-xs text-muted-foreground">
                    {personDetails(person)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {connections && connections.length > SHOWN && (
          <p className="mt-3 text-xs text-muted-foreground">+ {connections.length - SHOWN} more on the Connections page</p>
        )}
      </CardContent>
    </Card>
  )
}
