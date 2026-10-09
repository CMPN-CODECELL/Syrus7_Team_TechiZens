import { formatDate } from "@/lib/format"
import { isClosed } from "@/lib/ingestion"

// "Deadline 25 Nov", "Closed 30 Sep" (in red) or "Deadline not listed", for the small lists
// where an opportunity is shown as a single line (saved list, posts, profile activity).
export default function DeadlineLine({ opportunity }) {
  if (isClosed(opportunity)) {
    return (
      <span className="text-destructive">
        Closed{opportunity.deadline && ` ${formatDate(opportunity.deadline)}`}
      </span>
    )
  }
  if (!opportunity.deadline) return <span>Deadline not listed</span>
  return <span>Deadline {formatDate(opportunity.deadline)}</span>
}
