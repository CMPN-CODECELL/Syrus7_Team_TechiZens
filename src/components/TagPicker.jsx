import { useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// A list of toggleable chips (suggestions) with a search box that also adds your own.
// Used for both interests and skills (onboarding and the Profile page).
//  - Typing in the box filters the whole list. Enter picks the match (when there is exactly one, or an exact one);
//    "Add" uses what you typed as your own when it is not on the list.
//  - With a long list, `collapsedCount` shows only the first few suggestions while the box is empty
//    (your picks always show) and a button to see them all.
export default function TagPicker({ label, selected, suggestions = [], collapsedCount, onChange }) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)

  // Suggestions plus anything custom the student already added.
  const allOptions = [...suggestions, ...selected.filter((tag) => !suggestions.includes(tag))]

  const text = query.trim()
  const lower = text.toLowerCase()
  const searching = text !== ""
  const matches = searching ? allOptions.filter((tag) => tag.toLowerCase().includes(lower)) : []
  const exact = allOptions.find((tag) => tag.toLowerCase() === lower)

  const canFold = !searching && collapsedCount !== undefined && allOptions.length > collapsedCount
  const folded = canFold && !expanded
  let options = allOptions
  if (searching) options = matches
  else if (folded) options = allOptions.filter((tag, index) => index < collapsedCount || selected.includes(tag))

  function toggle(tag) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
  }

  function select(tag) {
    if (!selected.includes(tag)) onChange([...selected, tag])
  }

  // Your own interest or skill (when what you typed is not already on the list).
  function addOwn() {
    if (searching && !exact) onChange([...selected, text])
    setQuery("")
  }

  // Enter: pick the exact match, or the only match, or add what you typed when nothing matches.
  function handleSubmit(event) {
    event.preventDefault()
    if (!searching) return
    const target = exact ?? (matches.length === 1 ? matches[0] : null)
    if (target) {
      select(target)
      setQuery("")
    } else if (matches.length === 0) {
      addOwn()
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search or add your own ${label.toLowerCase()}`}
            aria-label={`Search ${label.toLowerCase()}`}
            maxLength={60}
            className="pl-8"
          />
        </div>
        <Button type="button" variant="outline" onClick={addOwn} disabled={!searching || Boolean(exact)}>
          <Plus /> Add
        </Button>
      </form>

      {searching && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {matches.length === 0
            ? `No ${label.toLowerCase()} match "${text}". Press Add to use it as your own.`
            : `${matches.length} ${matches.length === 1 ? "match" : "matches"}${exact ? "" : `. Not on the list? Press Add to use "${text}".`}`}
        </p>
      )}

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

      {canFold && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer" : `Show all ${allOptions.length}`}
        </Button>
      )}
    </div>
  )
}
