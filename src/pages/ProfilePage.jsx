import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import TagPicker from "@/components/TagPicker"
import { useUser } from "@/context/user-context"
import { INTEREST_OPTIONS } from "@/data/opportunities"
import { YEAR_OPTIONS } from "@/lib/scoring"

const SKILL_SUGGESTIONS = ["Python", "JavaScript", "React", "HTML", "CSS", "Figma", "SQL", "Linux"]

// Changes are saved immediately and shared with the rest of the app through UserProvider.
export default function ProfilePage() {
  const { user, updateProfile } = useUser()
  const { profile } = user

  // Number inputs: keep the field empty-friendly, store a number.
  function setNumber(field) {
    return (event) => updateProfile({ [field]: Number(event.target.value) || 0 })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <TagPicker
            label="Interests"
            selected={profile.interests}
            suggestions={INTEREST_OPTIONS}
            onChange={(interests) => updateProfile({ interests })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <TagPicker
            label="Skills"
            selected={profile.skills}
            suggestions={SKILL_SUGGESTIONS}
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
            <Input
              id="location"
              value={profile.location}
              onChange={(event) => updateProfile({ location: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Weekly hours</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              max="80"
              value={profile.hoursPerWeek}
              onChange={setNumber("hoursPerWeek")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="50"
              value={profile.budget}
              onChange={setNumber("budget")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
