import { useState } from "react"
import { Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import BeginnerToggle from "@/components/BeginnerToggle"
import LocationPicker from "@/components/LocationPicker"
import TagPicker from "@/components/TagPicker"
import { useUser } from "@/context/user-context"
import { ABOUT_MAX_LENGTH, HEADLINE_MAX_LENGTH, INTEREST_OPTIONS, SKILL_SUGGESTIONS } from "@/data/constants"
import { personInitials } from "@/lib/format"
import { YEAR_OPTIONS, yearLabel } from "@/lib/scoring"

const NAME_MAX_LENGTH = 60

// Everything on this page that can be edited, in one object (older saved profiles may lack headline/about).
function snapshotOf(user) {
  const { profile } = user
  return {
    name: user.name,
    headline: profile.headline ?? "",
    about: profile.about ?? "",
    interests: profile.interests,
    skills: profile.skills,
    isBeginner: profile.isBeginner,
    year: profile.year,
    location: profile.location,
  }
}

// Edits are kept as a draft on this page and only saved (and shared with the rest of the app, which re-ranks
// your feed) when you press "Save changes".
export default function ProfilePage() {
  const { user, saveProfile } = useUser()
  const [draft, setDraft] = useState(() => snapshotOf(user))
  const [status, setStatus] = useState("idle") // idle | saving | saved | error

  const dirty = JSON.stringify(draft) !== JSON.stringify(snapshotOf(user))
  const nameMissing = draft.name.trim() === ""

  function change(changes) {
    setDraft((current) => ({ ...current, ...changes }))
    setStatus("idle")
  }

  async function save() {
    if (nameMissing) return
    const toSave = { ...draft, name: draft.name.trim() }
    setStatus("saving")
    const ok = await saveProfile(toSave)
    setDraft(toSave)
    setStatus(ok ? "saved" : "error")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* How you appear: the same layout as other students' profiles (shows your edits as you type) */}
      <Card>
        <CardContent className="flex items-start gap-4">
          <Avatar className="size-20">
            <AvatarFallback className="text-2xl">{personInitials(draft.name || user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight break-words">
              {draft.name.trim() || <span className="text-muted-foreground">Add your name below</span>}
            </h1>
            <p className="text-sm break-words">
              {draft.headline || <span className="text-muted-foreground">Add a headline below</span>}
            </p>
            <p className="text-sm text-muted-foreground">
              {yearLabel(draft.year)}
              {draft.location && ` · ${draft.location}`}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={draft.name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Your name"
              aria-invalid={nameMissing}
              onChange={(event) => change({ name: event.target.value })}
            />
            {nameMissing ? (
              <p className="text-xs text-destructive">Your name can't be empty.</p>
            ) : (
              <p className="text-xs text-muted-foreground">This is the name other students see.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={draft.headline}
              maxLength={HEADLINE_MAX_LENGTH}
              placeholder="e.g. Second-year student exploring web development"
              onChange={(event) => change({ headline: event.target.value })}
            />
            <p className="text-right text-xs text-muted-foreground">
              {draft.headline.length}/{HEADLINE_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={draft.about}
              maxLength={ABOUT_MAX_LENGTH}
              rows={4}
              placeholder="Tell your connections a little about yourself"
              onChange={(event) => change({ about: event.target.value })}
            />
            <p className="text-right text-xs text-muted-foreground">
              {draft.about.length}/{ABOUT_MAX_LENGTH}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Don't add phone numbers or emails. Contacts are shared only after both sides agree.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <TagPicker
            label="Interests"
            selected={draft.interests}
            suggestions={INTEREST_OPTIONS}
            collapsedCount={16}
            onChange={(interests) => change({ interests })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BeginnerToggle value={draft.isBeginner} onChange={(isBeginner) => change({ isBeginner })} />
          <TagPicker
            label="Skills"
            selected={draft.skills}
            suggestions={SKILL_SUGGESTIONS}
            collapsedCount={16}
            onChange={(skills) => change({ skills })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="year">Year of study</Label>
            <select
              id="year"
              value={draft.year}
              onChange={(event) => change({ year: Number(event.target.value) })}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {YEAR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <LocationPicker id="location" value={draft.location} onChange={(location) => change({ location })} />
          </div>
        </CardContent>
      </Card>

      {/* Stays at the bottom of the screen so Save is always in reach */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
        <p className="text-sm" role="status" aria-live="polite">
          {status === "error" ? (
            <span className="text-destructive">Couldn't save. Check your connection and try again.</span>
          ) : status === "saved" && !dirty ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Check className="size-4" /> All changes saved
            </span>
          ) : dirty ? (
            <span>You have unsaved changes</span>
          ) : (
            <span className="text-muted-foreground">No changes to save</span>
          )}
        </p>
        <Button onClick={save} disabled={(!dirty && status !== "error") || nameMissing || status === "saving"}>
          {status === "saving" ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  )
}
