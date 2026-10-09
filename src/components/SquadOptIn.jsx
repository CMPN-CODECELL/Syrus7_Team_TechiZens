import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HOUR_OPTIONS } from "@/lib/squadMatching"
import { cn } from "@/lib/utils"

const ROLES = [
  { id: "leader", title: "I'm leading a team", text: "See people who want a team" },
  { id: "seeker", title: "I'm looking for a team", text: "See squads with a free spot" },
]

// A row of big buttons where exactly one is picked.
function Choice({ selected, onClick, children, className }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition hover:bg-muted",
        selected && "border-primary bg-primary text-primary-foreground hover:bg-primary",
        className
      )}
    >
      {children}
    </button>
  )
}

// Opting in is voluntary. Team opportunities ask for a role and weekly hours; others just ask to connect.
export default function SquadOptIn({ isTeam, onSubmit }) {
  const [role, setRole] = useState("leader")
  const [hours, setHours] = useState(6)

  return (
    <Card>
      <CardContent className="space-y-5">
        {isTeam ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">What are you doing?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLES.map((item) => (
                  <Choice key={item.id} selected={role === item.id} onClick={() => setRole(item.id)}>
                    <p className="font-medium">{item.title}</p>
                    <p className={cn("text-xs", role === item.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {item.text}
                    </p>
                  </Choice>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Hours per week you can give</p>
              <div className="flex flex-wrap gap-2">
                {HOUR_OPTIONS.map((option) => (
                  <Choice key={option} selected={hours === option} onClick={() => setHours(option)} className="px-4 py-2">
                    {option} hrs
                  </Choice>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm">
            This one has no teams. Opt in to see other students interested in it and connect with them.
          </p>
        )}

        <div className="space-y-2">
          <Button size="lg" onClick={() => onSubmit(isTeam ? role : "connect", isTeam ? hours : null)}>
            {isTeam ? "Opt in" : "Find people"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Opting in shows your name, college, year and skills to other students who opt in. Contacts are shared
            only when both sides agree. You can opt out any time.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
