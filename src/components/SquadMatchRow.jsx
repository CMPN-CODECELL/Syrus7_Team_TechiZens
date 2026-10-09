import PersonLink from "@/components/PersonLink"
import RequestButton from "@/components/RequestButton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { personInitials } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"

// One person in a ranked list (leader's candidates, or connect mode). `item` comes from the
// matching functions: { person, score, reason, status, contact }.
export default function SquadMatchRow({ item, actionLabel, doneLabel, disabled, onSend, onWithdraw }) {
  const { person, score, reason, status, contact } = item

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{personInitials(person.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <PersonLink personId={person.id} className="block max-w-full truncate text-sm font-medium">
              {person.name}
            </PersonLink>
            <p className="truncate text-xs text-muted-foreground">
              {person.college} · {yearLabel(person.year)}
            </p>
          </div>
          {score > 0 && (
            <Badge variant="outline" className="shrink-0 tabular-nums" title="How well they fit">
              {score}%
            </Badge>
          )}
          <RequestButton
            status={status}
            actionLabel={actionLabel}
            doneLabel={doneLabel}
            disabled={disabled}
            onSend={() => onSend(person.id)}
            onWithdraw={() => onWithdraw(person.id)}
          />
        </div>

        <p className="text-xs text-muted-foreground">{reason}</p>

        {/* Shown only after both sides agreed */}
        {contact && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs">
            Contact shared: <span className="font-medium">{contact}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
