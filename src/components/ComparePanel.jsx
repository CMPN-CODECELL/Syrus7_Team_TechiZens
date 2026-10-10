import { Crown, ExternalLink, Scale, X } from "lucide-react"
import OrganizerLogo from "@/components/OrganizerLogo"
import SourceBadge from "@/components/SourceBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CRITERIA, compareOpportunities } from "@/lib/compare"
import { formatDate, formatTeamSize } from "@/lib/format"
import { cn } from "@/lib/utils"

// Side-by-side comparison of the chosen hackathons for this student, with a "best for you" pick.
export default function ComparePanel({ opportunities, profile, onRemove, onClose, onOpen }) {
  const { rows, bestId, verdict } = compareOpportunities(opportunities, profile)

  // The best score in a row (so it can be highlighted). Rows with a tie highlight every winner.
  const bestIn = (id) => Math.max(...rows.map((row) => row.criteria[id].score))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Scale className="size-5" /> Compare hackathons
        </h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X /> Close comparison
        </Button>
      </div>

      {rows.length < 2 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Pick at least two hackathons with the scale button on their cards.
        </p>
      ) : (
        <>
          <Card size="sm" className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-start gap-3 text-sm">
              <Crown className="mt-0.5 size-4 shrink-0" />
              <p>
                <span className="font-semibold">Best for you: </span>
                {verdict}
              </p>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40 align-top">
                  <th className="w-32 p-3 text-left text-xs font-medium text-muted-foreground" />
                  {rows.map(({ opportunity }) => (
                    <th key={opportunity.id} className="p-3 text-left font-normal">
                      <div className="flex items-start justify-between gap-2">
                        <OrganizerLogo name={opportunity.organizer.name} logo={opportunity.organizer.logo} />
                        <Button variant="ghost" size="icon-xs" aria-label={`Remove ${opportunity.title}`} onClick={() => onRemove(opportunity.id)}>
                          <X />
                        </Button>
                      </div>
                      <button type="button" onClick={() => onOpen(opportunity.id)} className="mt-2 text-left font-semibold hover:underline">
                        {opportunity.title}
                      </button>
                      <p className="text-xs text-muted-foreground">{opportunity.organizer.name}</p>
                      <SourceBadge opportunity={opportunity} className="mt-1 text-xs text-muted-foreground" />
                      {opportunity.id === bestId && (
                        <div className="mt-2">
                          <Badge>
                            <Crown data-icon="inline-start" /> Best for you
                          </Badge>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                    Overall fit
                  </th>
                  {rows.map((row) => (
                    <td key={row.opportunity.id} className="p-3">
                      <span className={cn("text-2xl font-semibold tabular-nums", row.opportunity.id === bestId && "text-primary")}>{row.total}</span>
                      <span className="text-xs text-muted-foreground"> / 100</span>
                      {row.closed && <p className="text-xs text-destructive">Closed</p>}
                      {!row.eligible && <p className="text-xs text-destructive">{row.eligibilityReason}</p>}
                    </td>
                  ))}
                </tr>

                {CRITERIA.map(({ id, label, weight }) => (
                  <tr key={id} className="border-b">
                    <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                      {label}
                      <span className="block font-normal">{weight}% of the score</span>
                    </th>
                    {rows.map((row) => {
                      const cell = row.criteria[id]
                      const isBest = cell.score === bestIn(id) && rows.length > 1
                      return (
                        <td key={row.opportunity.id} className={cn("p-3 align-top", isBest && "bg-primary/5")}>
                          <p className={cn("font-medium", isBest && "text-primary")}>{cell.note}</p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${cell.score}%` }} />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}

                <tr className="border-b">
                  <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                    Deadline
                  </th>
                  {rows.map(({ opportunity }) => (
                    <td key={opportunity.id} className="p-3">
                      {opportunity.deadline ? formatDate(opportunity.deadline, { year: true }) : <span className="text-muted-foreground italic">Not listed</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground">
                    Team
                  </th>
                  {rows.map(({ opportunity }) => (
                    <td key={opportunity.id} className="p-3">
                      {formatTeamSize(opportunity.teamSize)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 text-left text-xs font-medium text-muted-foreground" />
                  {rows.map(({ opportunity, closed }) => (
                    <td key={opportunity.id} className="p-3">
                      {opportunity.registrationUrl && !closed ? (
                        <a
                          href={opportunity.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
                        >
                          Apply on organizer's site <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">{closed ? "Applications closed" : "Link not listed"}</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Scores are estimates from your profile and the details listed. Fees are shown only when the source states them; an
            unlisted fee is treated as unknown. Always confirm on the organizer's website.
          </p>
        </>
      )}
    </div>
  )
}
