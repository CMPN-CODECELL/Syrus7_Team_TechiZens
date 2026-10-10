import { Scale, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MAX_COMPARE } from "@/lib/compare"

// A small bar that appears once hackathons are picked for comparison.
export default function CompareTray({ count, onCompare, onClear }) {
  if (count === 0) return null
  return (
    <div
      role="region"
      aria-label="Compare tray"
      className="fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-lg md:right-4 md:bottom-4 md:left-auto md:mx-0"
    >
      <p className="flex items-center gap-2 text-sm">
        <Scale className="size-4" />
        {count} of {MAX_COMPARE} picked
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onCompare} disabled={count < 2}>
          Compare
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Clear comparison picks" onClick={onClear}>
          <X />
        </Button>
      </div>
    </div>
  )
}
