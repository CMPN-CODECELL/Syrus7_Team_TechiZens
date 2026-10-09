import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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


// Changes are saved immediately and shared with the rest of the app through UserProvider.
export default function ProfilePage() {
  const { user, updateProfile } = useUser()
  const { profile } = user
  // Older saved profiles do not have these two fields yet.
  const headline = profile.headline ?? ""
  const about = profile.about ?? ""

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* How you appear: the same layout as other students' profiles */}
      <Card>
        <CardContent className="flex items-start gap-4">
          <Avatar className="size-20">
            <AvatarFallback className="text-2xl">{personInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
            <p className="text-sm break-words">
              {headline || <span className="text-muted-foreground">Add a headline below</span>}
            </p>
            <p className="text-sm text-muted-foreground">
              {yearLabel(profile.year)}
              {profile.location && ` · ${profile.location}`}
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
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              maxLength={HEADLINE_MAX_LENGTH}
              placeholder="e.g. Second-year student exploring web development"
              onChange={(event) => updateProfile({ headline: event.target.value })}
            />
            <p className="text-right text-xs text-muted-foreground">
              {headline.length}/{HEADLINE_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={about}
              maxLength={ABOUT_MAX_LENGTH}
              rows={4}
              placeholder="Tell your connections a little about yourself"
              onChange={(event) => updateProfile({ about: event.target.value })}
            />
            <p className="text-right text-xs text-muted-foreground">
              {about.length}/{ABOUT_MAX_LENGTH}
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
            selected={profile.interests}
            suggestions={INTEREST_OPTIONS}
            collapsedCount={16}
            onChange={(interests) => updateProfile({ interests })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BeginnerToggle
            value={profile.isBeginner}
            onChange={(isBeginner) => updateProfile({ isBeginner })}
          />
          <TagPicker
            label="Skills"
            selected={profile.skills}
            suggestions={SKILL_SUGGESTIONS}
            collapsedCount={16}
            onChange={(skills) => updateProfile({ skills })}
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
              value={profile.year}
              onChange={(event) => updateProfile({ year: Number(event.target.value) })}
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
            <LocationPicker
              id="location"
              value={profile.location}
              onChange={(location) => updateProfile({ location })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
