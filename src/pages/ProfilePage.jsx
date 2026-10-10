import { useState } from "react"
import { Check, Eye, Lock } from "lucide-react"
import ConnectionsPreview from "@/components/ConnectionsPreview"
import DeleteAccountCard from "@/components/DeleteAccountCard"
import ParticipationList from "@/components/ParticipationList"
import SchoolNotice from "@/components/SchoolNotice"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import BeginnerToggle from "@/components/BeginnerToggle"
import LocationPicker from "@/components/LocationPicker"
import TagPicker from "@/components/TagPicker"
import { useUser } from "@/context/user-context"
import { ABOUT_MAX_LENGTH, COLLEGE_MAX_LENGTH, HEADLINE_MAX_LENGTH, INTEREST_OPTIONS, SKILL_SUGGESTIONS } from "@/data/constants"
import { isSchoolStudent } from "@/lib/age"
import { personInitials } from "@/lib/format"
import { cityOf } from "@/lib/location"
import { YEAR_OPTIONS, yearLabel } from "@/lib/scoring"

const NAME_MAX_LENGTH = 60

// Everything on this page that can be edited, in one object (older saved profiles may lack headline/about).
function snapshotOf(user) {
  const { profile } = user
  return {
    name: user.name,
    headline: profile.headline ?? "",
    about: profile.about ?? "",
    college: profile.college ?? "",
    interests: profile.interests,
    skills: profile.skills,
    isBeginner: profile.isBeginner,
    year: profile.year,
    location: profile.location,
  }
}

// Two profiles in one place:
//   "About you"       private: what Nexus uses to rank opportunities for you (and your email). Only you see it.
//   "Public profile"  what other students see in Connections and the Squad Hub, with a live preview.
// A third tab, "Activity", lists what you took part in and your connections.
// Edits to the first two are kept as a draft and only saved (and shared with the rest of the app, which re-ranks
// your feed) when you press "Save changes".
export default function ProfilePage() {
  const { user, saveProfile } = useUser()
  const [draft, setDraft] = useState(() => snapshotOf(user))
  const [status, setStatus] = useState("idle") // idle | saving | saved | error
  const [tab, setTab] = useState("private")

  const dirty = JSON.stringify(draft) !== JSON.stringify(snapshotOf(user))
  const nameMissing = draft.name.trim() === ""
  const isSchool = isSchoolStudent({ year: draft.year })

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
      {isSchool && <SchoolNotice />}

      {/* Who you are (shows your edits as you type) */}
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
              {draft.headline || <span className="text-muted-foreground">Add a headline in the Public profile tab</span>}
            </p>
            <p className="text-sm text-muted-foreground">
              {yearLabel(draft.year)}
              {draft.location && ` · ${draft.location}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList>
          <TabsTrigger value="private" className="px-3">
            <Lock /> About you
          </TabsTrigger>
          <TabsTrigger value="public" className="px-3">
            <Eye /> Public profile
          </TabsTrigger>
          <TabsTrigger value="activity" className="px-3">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* ---- Private: used to rank opportunities for you ---- */}
        <TabsContent value="private" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Only you see this tab. Nexus uses it to rank opportunities for you and to check your eligibility.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
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
                  <p className="text-xs text-muted-foreground">This is also the name other students see.</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <p className="text-sm">{user.email}</p>
                <p className="text-xs text-muted-foreground">From your Google account. It is never shown on your public profile.</p>
              </div>

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

          <DeleteAccountCard />
        </TabsContent>

        {/* ---- Public: what other students see ---- */}
        <TabsContent value="public" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            This is what other students see in Connections and the Squad Hub. Your email is never shown. Contact details are
            shared only after both of you agree.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Write your public profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="college">College</Label>
                <Input
                  id="college"
                  value={draft.college}
                  maxLength={COLLEGE_MAX_LENGTH}
                  placeholder="e.g. BITS Pilani"
                  onChange={(event) => change({ college: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  value={draft.about}
                  maxLength={ABOUT_MAX_LENGTH}
                  rows={4}
                  placeholder="Tell other students a little about yourself"
                  onChange={(event) => change({ about: event.target.value })}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {draft.about.length}/{ABOUT_MAX_LENGTH}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="size-4" /> Preview: how others see you
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="size-14">
                  <AvatarFallback className="text-lg">{personInitials(draft.name || user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-lg font-semibold break-words">{draft.name.trim() || "Your name"}</p>
                  <p className="text-sm break-words">{draft.headline || <span className="text-muted-foreground">No headline yet</span>}</p>
                  <p className="text-sm text-muted-foreground">
                    {[draft.college.trim(), yearLabel(draft.year), cityOf(draft.location)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              {draft.about && <p className="text-sm break-words whitespace-pre-wrap">{draft.about}</p>}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.interests.length > 0 ? (
                    draft.interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None yet</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.skills.length > 0 ? (
                    draft.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None yet</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your interests, skills, year and city come from the "About you" tab. Your email and your beginner setting stay private.
                {isSchool && " School students are not shown to other students at all."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Activity: what you took part in, and who you know ---- */}
        <TabsContent value="activity" className="space-y-6">
          <ParticipationList />
          {!isSchool && <ConnectionsPreview />}
        </TabsContent>
      </Tabs>

      {/* Stays at the bottom of the screen so Save is always in reach (the Activity tab saves by itself) */}
      {tab !== "activity" && (
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
      )}
    </div>
  )
}
