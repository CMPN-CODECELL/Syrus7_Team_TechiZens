import { useEffect, useState } from "react"
import { ArrowLeft, Bookmark, BookmarkCheck, CircleCheck, CircleX, ExternalLink, ShieldCheck, TriangleAlert, Users } from "lucide-react"
import { getOpportunities } from "@/api/opportunities"
import OrganizerLogo from "@/components/OrganizerLogo"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNav } from "@/context/nav-context"
import { useSaved } from "@/context/saved-context"
import { useUser } from "@/context/user-context"
import { CATEGORIES } from "@/data/constants"
import {
  STALE_AFTER_DAYS,
  daysSince,
  formatDate,
  formatDateRange,
  formatDaysAgo,
  formatTeamSize,
} from "@/lib/format"
import { costLabel, getEligibility, getRelevance } from "@/lib/scoring"
import { cn } from "@/lib/utils"

// One label + value in the facts grid.
function Fact({ label, value }) {
  return (
    <div>
      <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

export default function OpportunityDetailPage({ opportunityId, onBack }) {
  const { user } = useUser()
  const { savedIds, toggleSave } = useSaved()
  const { openSquad } = useNav()
  const [opportunity, setOpportunity] = useState(undefined) // undefined = loading, null = not found
  const [now] = useState(() => Date.now()) // fixed when the page opens

  useEffect(() => {
    getOpportunities()
      .then((list) => setOpportunity(list.find((item) => item.id === opportunityId) ?? null))
      .catch(() => setOpportunity(null))
  }, [opportunityId])

  const backButton = (
    <Button variant="ghost" onClick={onBack} className="-ml-2">
      <ArrowLeft /> Back
    </Button>
  )

  if (opportunity === undefined) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
  }

  if (opportunity === null) {
    return (
      <div className="space-y-4">
        {backButton}
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          This opportunity could not be found.
        </p>
      </div>
    )
  }

  const { relevance, reason } = getRelevance(opportunity, user.profile)
  const eligibility = getEligibility(opportunity, user.profile)
  const categoryLabel = CATEGORIES.find((c) => c.id === opportunity.category)?.singular

  const isSaved = savedIds.includes(opportunity.id)
  const age = daysSince(opportunity.lastVerified, now)
  const isStale = age > STALE_AFTER_DAYS

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {backButton}

      {/* Title block */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <OrganizerLogo name={opportunity.organizer.name} logo={opportunity.organizer.logo} />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium">{opportunity.organizer.name}</p>
              <p className="text-sm text-muted-foreground">
                {categoryLabel} · {opportunity.organizer.type}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 tabular-nums" title="Relevance to you">
            {relevance}% match
          </Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">{opportunity.title}</h1>
        <p className="text-muted-foreground">{opportunity.description}</p>
      </div>

      {/* Trust layer: conflict warning */}
      {!opportunity.verified && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Check these details before applying</p>
            <p className="mt-0.5 text-muted-foreground">{opportunity.warning}</p>
          </div>
        </div>
      )}

      {/* Facts */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          <Fact label="Deadline" value={formatDate(opportunity.deadline, { year: true })} />
          <Fact label="Dates" value={formatDateRange(opportunity.startDate, opportunity.endDate)} />
          <Fact label="Format" value={opportunity.format} />
          <Fact label="Location" value={opportunity.location} />
          <Fact label="Fee" value={costLabel(opportunity.fee)} />
          <Fact label="Team" value={formatTeamSize(opportunity.teamSize)} />
          <Fact label="Level" value={opportunity.level} />
          <Fact label="Theme" value={opportunity.theme} />
        </CardContent>
      </Card>

      {/* Why it fits you, and eligibility */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium">Why it fits you</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </CardContent>
        </Card>

        <Card className={cn(!eligibility.qualified && "bg-destructive/10")}>
          <CardContent className="space-y-1">
            {eligibility.qualified ? (
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <CircleCheck className="size-4" /> Eligible
              </p>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <CircleX className="size-4" /> Not eligible
                </p>
                <p className="text-sm text-muted-foreground">{eligibility.reason}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trust layer: source and last verified */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            isStale ? "font-medium text-destructive" : "text-muted-foreground"
          )}
        >
          {isStale ? <TriangleAlert className="size-4" /> : <ShieldCheck className="size-4" />}
          Last verified {formatDaysAgo(age)}
          {isStale && " (may be out of date)"}
        </span>
        <a
          href={opportunity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline"
        >
          Source <ExternalLink className="size-3.5" />
        </a>
      </div>

      {/* Handoff: Nexus never applies for the student */}
      <div className="space-y-2 border-t pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={opportunity.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "h-11 flex-1 text-base sm:flex-none sm:px-6")}
          >
            Apply on organizer's website <ExternalLink />
          </a>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-4 text-base"
            aria-pressed={isSaved}
            onClick={() => toggleSave(opportunity.id)}
          >
            {isSaved ? <BookmarkCheck /> : <Bookmark />}
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="lg" className="h-11 px-4 text-base" onClick={() => openSquad(opportunity.id)}>
            <Users />
            {opportunity.teamSize ? "Find teammates" : "Connect with others"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          You apply on their site. Nexus never applies for you.
          {isSaved && " We'll alert you if the deadline, fee or rules change."}
        </p>
      </div>
    </div>
  )
}
