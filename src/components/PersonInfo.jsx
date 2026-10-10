import PersonLink from "@/components/PersonLink"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { personDetails, personInitials } from "@/lib/format"

// Avatar, name and a short description. Used for invitations, requests and suggestions.
// `note` is an extra small line (for example what you have in common).
export default function PersonInfo({ person, note }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PersonLink personId={person.id} aria-label={`${person.name}'s profile`}>
        <Avatar size="lg">
          <AvatarFallback>{personInitials(person.name)}</AvatarFallback>
        </Avatar>
      </PersonLink>
      <div className="min-w-0 leading-tight">
        <PersonLink personId={person.id} className="block max-w-full truncate text-sm font-medium">
          {person.name}
        </PersonLink>
        <p className="truncate text-xs text-muted-foreground">{personDetails(person)}</p>
        {note && <p className="truncate text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  )
}
