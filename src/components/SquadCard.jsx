import PersonLink from "@/components/PersonLink"
import RequestButton from "@/components/RequestButton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { personDetails, personInitials } from "@/lib/format"
import { overlap } from "@/lib/scoring"

// One squad with a free spot (shown to a solo seeker). `squad` comes from rankSquads:
// { leader, members, capacity, lookingForSkills, hoursPerWeek, score, reason, status, contact }.
export default function SquadCard({ squad, mySkills, disabled, onSend, onWithdraw, onAccept, onDecline }) {
  const { leader, members, capacity, lookingForSkills, score, reason, status, contact, requestId } = squad
  const have = overlap(lookingForSkills, mySkills).map((skill) => skill.toLowerCase())
  const spots = capacity - members.length

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{personInitials(leader.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm">
              <PersonLink personId={leader.id} className="font-medium">
                {leader.name}
              </PersonLink>
              <span className="text-muted-foreground">'s squad</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {personDetails(leader)}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 tabular-nums" title="How well it fits you">
            {score}%
          </Badge>
          <RequestButton
            status={status}
            actionLabel="Request to join"
            doneLabel="Joined"
            disabled={disabled}
            onSend={() => onSend(leader.id)}
            onWithdraw={() => onWithdraw(leader.id)}
            onAccept={() => onAccept(requestId)}
            onDecline={() => onDecline(requestId)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">
            {members.length}/{capacity} members{spots > 0 ? ` · ${spots} ${spots === 1 ? "spot" : "spots"} left` : ""}
            {lookingForSkills.length > 0 ? " · Looking for:" : " · No specific skills asked for"}
          </span>
          {lookingForSkills.map((skill) => (
            <Badge key={skill} variant={have.includes(skill.toLowerCase()) ? "default" : "outline"}>
              {skill}
            </Badge>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {status === "incoming" ? "Invited you to join. " : ""}
          {reason}
        </p>

        {contact && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs">
            Contact shared: <span className="font-medium">{contact}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
