import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// The button for asking someone to team up or connect. Both sides must agree (double opt-in):
// none -> action button, pending -> "Pending" (click to withdraw), mutual -> done badge.
export default function RequestButton({ status, actionLabel, doneLabel, disabled, onSend, onWithdraw }) {
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
