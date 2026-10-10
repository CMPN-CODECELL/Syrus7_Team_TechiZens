import { useEffect, useState } from "react"
import { Bell, BookmarkX, Clock } from "lucide-react"
import { getOpportunities } from "@/api/opportunities"
import DeadlineLine from "@/components/DeadlineLine"
import OrganizerLogo from "@/components/OrganizerLogo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSaved } from "@/context/saved-context"
import { daysSince, formatDate, formatDaysAgo } from "@/lib/format"
import { reminderText } from "@/lib/reminders"
import { cn } from "@/lib/utils"

const FIELD_LABELS = { deadline: "Deadline", fee: "Fee", rules: "Rules" }

// Two tabs: Alerts (what changed in saved opportunities) and Saved (the saved opportunities).
export default function AlertsPage({ onOpen }) {
  const { savedIds, alerts, reminders, unreadCount, toggleSave, markRead, markAllRead, markReminderRead } = useSaved()
  const [tab, setTab] = useState("alerts")
  const [opportunities, setOpportunities] = useState([])
  const [now] = useState(() => Date.now())

  useEffect(() => {
    getOpportunities().then(setOpportunities)
  }, [])

  const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]))
  const savedOpportunities = savedIds.map((id) => byId[id]).filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="sr-only">Alerts and saved opportunities</h1>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="alerts" className="px-3">
              Alerts
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[0.65rem] leading-4 text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved" className="px-3">
              Saved
              {savedIds.length > 0 && (
                <span className="text-xs text-muted-foreground">{savedIds.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {tab === "alerts" && unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {/* Alerts */}
        <TabsContent value="alerts">
          {alerts.length === 0 && reminders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              <Bell className="size-5" />
              <p>
                No alerts yet. Save an opportunity and we'll remind you in the last week before its deadline, and tell
                you when its deadline or rules change.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Deadline reminders: saved opportunities that close within a week */}
              {reminders.map((reminder) => {
                const opportunity = byId[reminder.opportunityId]
                if (!opportunity) return null
                return (
                  <Card key={reminder.key} size="sm" className={cn(!reminder.read && "ring-foreground/30")}>
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            markReminderRead(reminder.key)
                            onOpen(opportunity.id)
                          }}
                          className="min-w-0 text-left text-sm font-medium hover:underline"
                        >
                          {!reminder.read && (
                            <span className="mr-2 inline-block size-2 rounded-full bg-primary align-middle" aria-label="Unread" />
                          )}
                          {opportunity.title}
                        </button>
                        <Badge variant={reminder.daysLeft <= 1 ? "destructive" : "outline"} className="shrink-0">
                          <Clock data-icon="inline-start" /> {reminderText(reminder.daysLeft)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Deadline reminder · {formatDate(reminder.deadline, { year: true })}</span>
                        {!reminder.read && (
                          <Button variant="ghost" size="xs" onClick={() => markReminderRead(reminder.key)}>
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
                          className="min-w-0 text-left text-sm font-medium hover:underline"
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
        </TabsContent>

        {/* Saved */}
        <TabsContent value="saved">
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
                      <p className="truncate text-sm font-medium">{opportunity.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {opportunity.organizer.name} · <DeadlineLine opportunity={opportunity} />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
