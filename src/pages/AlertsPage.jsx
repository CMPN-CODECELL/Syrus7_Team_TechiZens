import { useEffect, useState } from "react"
import { Bell, BookmarkX } from "lucide-react"
import { getOpportunities } from "@/api/opportunities"
import OrganizerLogo from "@/components/OrganizerLogo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSaved } from "@/context/saved-context"
import { daysSince, formatDate, formatDaysAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

const FIELD_LABELS = { deadline: "Deadline", fee: "Fee", rules: "Rules" }

export default function AlertsPage({ onOpen }) {
  const { savedIds, alerts, unreadCount, toggleSave, markRead, markAllRead } = useSaved()
  const [opportunities, setOpportunities] = useState([])
  const [now] = useState(() => Date.now())

  useEffect(() => {
    getOpportunities().then(setOpportunities)
  }, [])

  const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]))
  const savedOpportunities = savedIds.map((id) => byId[id]).filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Alerts</h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            <Bell className="size-5" />
            <p>No alerts yet. Save an opportunity and we'll tell you when its deadline, fee or rules change.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const opportunity = byId[alert.opportunityId]
              if (!opportunity) return null
              return (
                <Card key={alert.id} size="sm" className={cn(!alert.read && "ring-foreground/30")}>
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          markRead(alert.id)
                          onOpen(opportunity.id)
                        }}
                        className="min-w-0 text-left font-medium hover:underline"
                      >
                        {!alert.read && (
                          <span className="mr-2 inline-block size-2 rounded-full bg-primary align-middle" aria-label="Unread" />
                        )}
                        {opportunity.title}
                      </button>
                      <Badge variant="outline" className="shrink-0">
                        {FIELD_LABELS[alert.field]} changed
                      </Badge>
                    </div>

                    <p className="text-sm">
                      <span className="text-muted-foreground line-through">{alert.oldValue}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="font-medium">{alert.newValue}</span>
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDaysAgo(daysSince(alert.changedAt, now))}</span>
                      {!alert.read && (
                        <Button variant="ghost" size="xs" onClick={() => markRead(alert.id)}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Saved */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Saved</h2>

        {savedOpportunities.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nothing saved yet. Use the bookmark on any opportunity.
          </p>
        ) : (
          <div className="space-y-3">
            {savedOpportunities.map((opportunity) => (
              <Card key={opportunity.id} size="sm">
                <CardContent className="flex items-center gap-3">
                  <OrganizerLogo name={opportunity.organizer.name} logo={opportunity.organizer.logo} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate font-medium">{opportunity.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {opportunity.organizer.name} · Deadline {formatDate(opportunity.deadline)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => onOpen(opportunity.id)}>
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${opportunity.title} from saved`}
                    onClick={() => toggleSave(opportunity.id)}
                  >
                    <BookmarkX />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
