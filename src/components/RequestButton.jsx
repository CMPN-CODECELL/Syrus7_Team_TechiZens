import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// The button for asking someone to team up or connect. Both sides must agree (double opt-in):
// none -> action button, pending -> "Pending" (click to withdraw), mutual -> done badge,
// incoming -> they asked this student: Accept / Decline.
export default function RequestButton({ status, actionLabel, doneLabel, disabled, onSend, onWithdraw, onAccept, onDecline }) {
  if (status === "incoming") {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" disabled={disabled} onClick={onAccept}>
          Accept
        </Button>
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onDecline}>
          Decline
        </Button>
      </div>
    )
  }
  if (status === "mutual") {
    return (
      <Badge variant="secondary" className="h-7 shrink-0 px-2.5 text-sm">
        <Check data-icon="inline-start" /> {doneLabel}
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Button size="sm" variant="secondary" className="shrink-0" title="Withdraw request" onClick={onWithdraw}>
        Pending
      </Button>
    )
  }
  return (
    <Button size="sm" variant="outline" className="shrink-0" disabled={disabled} onClick={onSend}>
      {actionLabel}
    </Button>
  )
}
