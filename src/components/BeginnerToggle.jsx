import { Sprout } from "lucide-react"
import { cn } from "@/lib/utils"

// "I'm a beginner" switch. When on, beginner-friendly opportunities rank higher.
export default function BeginnerToggle({ value, onChange }) {
  return (
    <button
      type="button"
      aria-pressed={value}
      onClick={() => onChange(!value)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:bg-muted",
        value && "border-primary bg-primary text-primary-foreground hover:bg-primary"
      )}
    >
      <Sprout className="size-5 shrink-0" />
      <span className="font-medium">I'm a beginner</span>
    </button>
  )
}
