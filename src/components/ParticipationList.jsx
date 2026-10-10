import { useEffect, useState } from "react"
import { Plus, Trophy, X } from "lucide-react"
import {
  PARTICIPATION_CATEGORIES,
  PARTICIPATION_RESULTS,
  addParticipation,
  getParticipations,
  removeParticipation,
} from "@/api/participation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const categoryLabel = (id) => PARTICIPATION_CATEGORIES.find((c) => c.id === id)?.label ?? "Other"
const resultLabel = (id) => PARTICIPATION_RESULTS.find((r) => r.id === id)?.label ?? "Participated"
const formatMonth = (isoDate) =>
  isoDate ? new Date(isoDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : null

// The events and hackathons the student took part in (self-declared), with a small form to add one by hand.
export default function ParticipationList() {
  const [items, setItems] = useState(null) // null = still loading
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: "", organizer: "", category: "hackathons", result: "participated", month: "" })
  const [error, setError] = useState(false)

  useEffect(() => {
    getParticipations().then(setItems)
  }, [])

  async function handleAdd(event) {
    event.preventDefault()
    setError(false)
    const { ok } = await addParticipation({
      title: form.title,
      organizer: form.organizer,
      category: form.category,
      result: form.result,
      eventDate: form.month ? `${form.month}-01` : null,
    })
    if (!ok) {
      setError(true)
      return
    }
    setItems(await getParticipations())
    setForm({ title: "", organizer: "", category: form.category, result: "participated", month: "" })
    setAdding(false)
  }

  async function handleRemove(id) {
    setItems((current) => current.filter((item) => item.id !== id))
    await removeParticipation(id)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Events and hackathons</CardTitle>
            <p className="text-xs text-muted-foreground">What you took part in. You add this yourself; Nexus doesn't verify it.</p>
          </div>
          {!adding && (
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => setAdding(true)}>
              <Plus /> Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <form onSubmit={handleAdd} className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Event name</Label>
              <Input
                id="p-title"
                value={form.title}
                maxLength={120}
                required
                placeholder="e.g. Smart India Hackathon"
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-org">Organizer (optional)</Label>
                <Input id="p-org" value={form.organizer} maxLength={80} onChange={(event) => setForm({ ...form, organizer: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-month">When (optional)</Label>
                <Input id="p-month" type="month" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-category">Type</Label>
                <select id="p-category" value={form.category} className={SELECT_CLASS} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {PARTICIPATION_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-result">Result</Label>
                <select id="p-result" value={form.result} className={SELECT_CLASS} onChange={(event) => setForm({ ...form, result: event.target.value })}>
                  {PARTICIPATION_RESULTS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                Could not add it. Check the name and try again.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Add to my profile
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {items === null ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing here yet. Add events you took part in, or press "I participated" on an opportunity's page.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium break-words">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.organizer, formatMonth(item.eventDate)].filter(Boolean).join(" · ") || "No details added"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{categoryLabel(item.category)}</Badge>
                    <Badge variant={item.result === "participated" ? "secondary" : "default"} className={cn(item.result !== "participated" && "gap-1")}>
                      {item.result === "winner" && <Trophy data-icon="inline-start" />}
                      {resultLabel(item.result)}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${item.title}`} onClick={() => handleRemove(item.id)}>
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
