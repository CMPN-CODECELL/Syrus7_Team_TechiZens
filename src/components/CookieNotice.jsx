import { useState } from "react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "nexus-notice-dismissed"

function alreadyDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

// A short notice that Nexus uses browser storage. It only uses what the site needs (sign-in, your choices),
// no advertising or analytics, so this is a notice with an OK button, not a consent form.
export default function CookieNotice({ onOpenPrivacy }) {
  const [hidden, setHidden] = useState(alreadyDismissed)
  if (hidden) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // Storage unavailable: the notice simply shows again next time.
    }
    setHidden(true)
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-lg border bg-background p-3 text-xs shadow-lg sm:bottom-4 sm:text-sm md:left-4 md:mx-0"
    >
      <p className="min-w-0 flex-1 text-muted-foreground">
        Nexus uses browser storage to keep you signed in and remember your choices. No ads, no analytics.{" "}
        <button type="button" onClick={onOpenPrivacy} className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </button>
      </p>
      <Button size="sm" onClick={dismiss}>
        OK
      </Button>
    </div>
  )
}
