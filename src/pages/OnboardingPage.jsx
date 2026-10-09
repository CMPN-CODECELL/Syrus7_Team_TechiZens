import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, Star, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import TagPicker from "@/components/TagPicker"
import { useUser } from "@/context/user-context"
import { INTEREST_OPTIONS } from "@/data/opportunities"
import { YEAR_OPTIONS } from "@/lib/scoring"
import { cn } from "@/lib/utils"

const SKILL_SUGGESTIONS = ["Python", "JavaScript", "React", "HTML", "CSS", "Figma", "SQL", "Linux"]
const HOUR_OPTIONS = [3, 6, 10, 15, 20].map((n) => ({ value: n, label: `${n} hrs` }))
const BUDGET_OPTIONS = [
  { value: 0, label: "Free only" },
  { value: 500, label: "Up to ₹500" },
  { value: 1000, label: "Up to ₹1,000" },
  { value: 5000, label: "Any" },
]

const XP_PER_STEP = 10

// A grid of big buttons where exactly one can be picked.
function ChoiceGrid({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl border p-4 text-left font-medium transition hover:bg-muted",
            value === option.value && "border-primary bg-primary text-primary-foreground hover:bg-primary"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const { user, updateProfile, completeOnboarding } = useUser()
  const { profile } = user
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: "What are you into?",
      hint: "Pick a few. We'll use them to build your feed.",
      canContinue: profile.interests.length > 0,
      content: (
        <TagPicker
          label="Interests"
          selected={profile.interests}
          suggestions={INTEREST_OPTIONS}
          onChange={(interests) => updateProfile({ interests })}
        />
      ),
    },
    {
      title: "What can you already do?",
      hint: "Optional. Add your skills.",
      canContinue: true,
      content: (
        <TagPicker
          label="Skills"
          selected={profile.skills}
          suggestions={SKILL_SUGGESTIONS}
          onChange={(skills) => updateProfile({ skills })}
        />
      ),
    },
    {
      title: "Which year are you in?",
      hint: "Some opportunities are year-restricted.",
      canContinue: true,
      content: (
        <ChoiceGrid
          options={YEAR_OPTIONS}
          value={profile.year}
          onChange={(year) => updateProfile({ year })}
        />
      ),
    },
    {
      title: "Where are you based?",
      hint: "For in-person events near you.",
      canContinue: profile.location.trim().length > 0,
      content: (
        <Input
          value={profile.location}
          onChange={(event) => updateProfile({ location: event.target.value })}
          placeholder="City"
          aria-label="Location"
          className="h-11"
        />
      ),
    },
    {
      title: "How much time do you have?",
      hint: "Hours per week you can spare.",
      canContinue: true,
      content: (
        <ChoiceGrid
          options={HOUR_OPTIONS}
          value={profile.hoursPerWeek}
          onChange={(hoursPerWeek) => updateProfile({ hoursPerWeek })}
        />
      ),
    },
    {
      title: "What's your budget?",
      hint: "Per opportunity.",
      canContinue: true,
      content: (
        <ChoiceGrid
          options={BUDGET_OPTIONS}
          value={profile.budget}
          onChange={(budget) => updateProfile({ budget })}
        />
      ),
    },
  ]

  const isDone = step >= steps.length
  const xp = Math.min(step, steps.length) * XP_PER_STEP
  const current = steps[step]

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(Math.min(step, steps.length) / steps.length) * 100}%` }}
            />
          </div>
          <span className="flex items-center gap-1 text-sm font-medium tabular-nums">
            <Star className="size-4 fill-current" /> {xp} XP
          </span>
        </div>

        <Card>
          <CardContent className="space-y-6">
            {isDone ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Trophy className="size-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Profile complete!</h1>
                  <p className="mt-1 text-muted-foreground">You earned {xp} XP and the Explorer badge.</p>
                </div>
                <Button size="lg" className="h-11 w-full text-base" onClick={completeOnboarding}>
                  See my feed <ArrowRight />
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Step {step + 1} of {steps.length}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">{current.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
                </div>

                {current.content}

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 0}
                  >
                    <ArrowLeft /> Back
                  </Button>
                  <Button size="lg" disabled={!current.canContinue} onClick={() => setStep(step + 1)}>
                    {step === steps.length - 1 ? (
                      <>
                        Finish <Check />
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
