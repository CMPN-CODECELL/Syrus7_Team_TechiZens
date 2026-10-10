import { useEffect, useState } from "react"
import { Check, Trophy } from "lucide-react"
import { addParticipation, getParticipations, removeParticipation } from "@/api/participation"
import { Button } from "@/components/ui/button"

// "I participated" on an opportunity's page. It adds the event to the student's Profile (Activity tab).
// Self-declared: Nexus does not check it.
export default function ParticipationButton({ opportunity }) {
  const [entry, setEntry] = useState(undefined) // undefined = loading, null = not marked, otherwise the saved item
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getParticipations().then((items) => {
      if (!cancelled) setEntry(items.find((item) => item.opportunityId === opportunity.id) ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [opportunity.id])

  async function toggle() {
    setBusy(true)
    if (entry) {
      await removeParticipation(entry.id)
      setEntry(null)
    } else {
      const { ok, item } = await addParticipation({
        opportunityId: opportunity.id,
        title: opportunity.title,
        organizer: opportunity.organizer.name,
        category: opportunity.category,
        eventDate: opportunity.startDate ?? opportunity.endDate ?? null,
      })
      if (ok) setEntry(item)
    }
    setBusy(false)
  }

  if (entry === undefined) return null

  return (
    <Button
      variant={entry ? "secondary" : "outline"}
      size="lg"
      className="h-11 px-4 text-base"
      aria-pressed={Boolean(entry)}
      disabled={busy}
      title="Adds this to the Activity tab of your Profile. Nexus does not verify it."
      onClick={toggle}
    >
      {entry ? <Check /> : <Trophy />}
      {entry ? "Participated" : "I participated"}
    </Button>
  )
}
