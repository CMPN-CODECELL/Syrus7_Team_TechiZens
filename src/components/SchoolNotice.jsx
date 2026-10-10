import { ShieldAlert } from "lucide-react"
import { MINORS_RULE } from "@/data/legal"

// Shown when the student picks a school year (Class 10th to 12th). `children` can hold a checkbox.
export default function SchoolNotice({ children }) {
  return (
    <div role="status" className="space-y-2 rounded-lg border bg-muted/50 p-3 text-sm">
      <p className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <span>{MINORS_RULE}</span>
      </p>
      {children}
    </div>
  )
}
