import { useState } from "react"
import { Flag } from "lucide-react"
import { REPORT_REASONS, reportContent } from "@/api/reports"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CONTACT } from "@/data/legal"

// "Report" for a post, a comment or a profile. Opens a small form in place (no popup):
// pick a reason, add an optional note, send. `contentType` is "post", "comment" or "profile".
export default function ReportButton({ contentType, contentId, label = "Report", size = "xs" }) {
  const [step, setStep] = useState("closed") // closed | form | sending | sent | failed
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [note, setNote] = useState("")
  const [local, setLocal] = useState(false)

  async function send(event) {
    event.preventDefault()
    setStep("sending")
    const result = await reportContent({ contentType, contentId, reason, note })
    setLocal(result.local)
    setStep(result.ok ? "sent" : "failed")
  }

  if (step === "sent") {
    return (
      <p role="status" className="text-xs text-muted-foreground">
        Thanks, your report was {local ? "noted in this browser (demo mode, nobody reads it)" : "sent"}.
      </p>
    )
  }

  if (step === "closed") {
    return (
      <Button variant="ghost" size={size} className="text-muted-foreground" onClick={() => setStep("form")}>
        <Flag /> {label}
      </Button>
    )
  }

  return (
    <form onSubmit={send} className="w-80 max-w-full space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
      <label htmlFor={`report-reason-${contentType}-${contentId}`} className="text-xs font-medium">
        Why are you reporting this?
      </label>
      <select
        id={`report-reason-${contentType}-${contentId}`}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {REPORT_REASONS.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <Input
        value={note}
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Anything else we should know? (optional)"
        aria-label="Details (optional)"
      />
      {step === "failed" && (
        <p role="alert" className="text-xs text-destructive">
          Could not send the report. Please try again, or write to {CONTACT.email}.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={step === "sending"}>
          {step === "sending" ? "Sending..." : "Send report"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setStep("closed")}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
