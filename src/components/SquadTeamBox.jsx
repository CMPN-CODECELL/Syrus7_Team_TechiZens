import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import PersonLink from "@/components/PersonLink"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { personInitials } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"
import { cn } from "@/lib/utils"

// Plain-text roster for pasting into a chat or the organizer's form.
// Contacts only appear for people who agreed with the student (the api only returns those).
function buildRoster(opportunity, team) {
  const lines = team.members.map(({ person, isMe, contact }, index) => {
    const details = [person.college, yearLabel(person.year)].filter(Boolean).join(", ")
    return `${index + 1}. ${person.name}${isMe ? " (me)" : ""} - ${details}${contact ? ` - ${contact}` : ""}`
  })
  return [`Team roster: ${opportunity.title} (${opportunity.organizer.name})`, ...lines, `Apply at: ${opportunity.registrationUrl}`].join("\n")
}

// The student's team so far. When it is full: Copy Roster and a link to apply on the organizer's site.
export default function SquadTeamBox({ opportunity, team }) {
  const [copied, setCopied] = useState(false)

  async function copyRoster() {
    try {
      await navigator.clipboard.writeText(buildRoster(opportunity, team))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy your roster:", buildRoster(opportunity, team))
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Your team ({team.members.length}/{team.capacity})
          </h2>
          {team.full && <Badge variant="secondary">Team is full</Badge>}
        </div>

        <div className="space-y-2">
          {team.members.map(({ person, isMe, contact }) => (
            <div key={person.id} className="flex items-center gap-2.5">
              <Avatar>
                <AvatarFallback>{personInitials(person.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                {isMe ? (
                  <p className="text-sm font-medium">{person.name} (you)</p>
                ) : (
                  <PersonLink personId={person.id} className="block max-w-full truncate text-sm font-medium">
                    {person.name}
                  </PersonLink>
                )}
                <p className="truncate text-xs text-muted-foreground">
                  {[person.college, yearLabel(person.year)].filter(Boolean).join(" · ")}
                  {contact && ` · ${contact}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {team.full ? (
          <div className="space-y-2 border-t pt-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyRoster}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy Roster"}
              </Button>
              <a
                href={opportunity.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants())}
              >
                Apply on organizer's website <ExternalLink />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">You apply on their site. Nexus never applies for you.</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {team.capacity - team.members.length} more {team.capacity - team.members.length === 1 ? "spot" : "spots"} to fill.
            Contacts are shown only for people who agreed with you.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
