import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// A list of toggleable chips (suggestions) plus a box to add your own.
// Used for both interests and skills on the Profile page.
export default function TagPicker({ label, selected, suggestions = [], onChange }) {
  const [draft, setDraft] = useState("")

  // Suggestions plus anything custom the student already added.
  const options = [...suggestions, ...selected.filter((tag) => !suggestions.includes(tag))]

  function toggle(tag) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
  }

  function addDraft(event) {
    event.preventDefault()
    const tag = draft.trim()
    if (tag && !selected.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...selected, tag])
    }
    setDraft("")
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((tag) => {
          const isOn = selected.includes(tag)
          return (
            <button key={tag} type="button" aria-pressed={isOn} onClick={() => toggle(tag)}>
              <Badge
                variant={isOn ? "default" : "outline"}
                className={cn("h-7 cursor-pointer px-3 text-sm", !isOn && "hover:bg-muted")}
              >
                {tag}
                {isOn && <X data-icon="inline-end" />}
              </Badge>
            </button>
          )
        })}
      </div>

      <form onSubmit={addDraft} className="flex max-w-sm gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Add your own ${label.toLowerCase()}`}
          aria-label={`Add ${label.toLowerCase()}`}
        />
        <Button type="submit" variant="outline">
          <Plus /> Add
        </Button>
      </form>
    </div>
  )
}
