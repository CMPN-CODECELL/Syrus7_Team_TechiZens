import { useEffect, useState } from "react"
import { ArrowLeft, Check, MapPin } from "lucide-react"
import { getConnectionPosts } from "@/api/connections"
import { getOpportunities } from "@/api/opportunities"
import {
  acceptInvitation,
  getPerson,
  ignoreInvitation,
  removeConnection,
  sendConnectionRequest,
  withdrawConnectionRequest,
} from "@/api/people"
import DeadlineLine from "@/components/DeadlineLine"
import OrganizerLogo from "@/components/OrganizerLogo"
import PersonLink from "@/components/PersonLink"
import ReportButton from "@/components/ReportButton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from "@/context/user-context"
import { formatDate, formatTimeAgo, personInitials } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"

// A section with a small title.
function Section({ title, children }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {children}
      </CardContent>
    </Card>
  )
}

// A list of interests or skills. Ones you share with this person are filled in.
function TagList({ tags, mine }) {
  const lowerMine = mine.map((tag) => tag.toLowerCase())
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant={lowerMine.includes(tag.toLowerCase()) ? "default" : "outline"} className="h-6 px-2.5">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

// Reads everything the page needs. The feed only has posts from connections,
// so someone's activity stays private until you are connected.
async function fetchProfile(personId) {
  const [person, allPosts, opportunities] = await Promise.all([
    getPerson(personId),
    getConnectionPosts(),
    getOpportunities(),
  ])
  return { person, posts: allPosts.filter((post) => post.author.id === personId), opportunities }
}

// Another student's profile: who they are, what you have in common, and (if connected) their activity.
export default function PersonProfilePage({ personId, onBack, onOpen }) {
  const { user } = useUser()
  const [data, setData] = useState(null) // null = still loading
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    fetchProfile(personId).then(setData)
  }, [personId])

  // Runs an action (connect, accept, ...) and then reloads the profile.
  async function act(action) {
    setConfirmingRemove(false)
    await action()
    setData(await fetchProfile(personId))
  }

  const backButton = (
    <Button variant="ghost" onClick={onBack} className="-ml-2">
      <ArrowLeft /> Back
    </Button>
  )

  if (data === null) return <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>

  const { person, posts, opportunities } = data

  if (person === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {backButton}
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          This profile could not be found.
        </p>
      </div>
    )
  }

  const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]))
  const connected = person.relationship === "connected"

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {backButton}

      {/* Header */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="size-20">
              <AvatarFallback className="text-2xl">{personInitials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
              <p className="text-sm">{person.headline}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span>
                  {person.college} · {yearLabel(person.year)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {person.location}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {person.connectionCount} connections
                {person.mutualConnections.length > 0 && ` · ${person.mutualConnections.length} mutual`}
                {connected && ` · Connected since ${formatDate(person.connectedAt, { year: true })}`}
              </p>
            </div>
          </div>

          {/* Actions depend on how you and this person are related */}
          <div className="flex flex-wrap items-center gap-2">
            {person.relationship === "none" && (
              <Button onClick={() => act(() => sendConnectionRequest(person.id))}>Connect</Button>
            )}
            {person.relationship === "pending" && (
              <Button variant="secondary" onClick={() => act(() => withdrawConnectionRequest(person.id))}>
                Pending · Withdraw
              </Button>
            )}
            {person.relationship === "invited" && (
              <>
                <Button onClick={() => act(() => acceptInvitation(person.invitationId))}>Accept</Button>
                <Button variant="outline" onClick={() => act(() => ignoreInvitation(person.invitationId))}>
                  Ignore
                </Button>
              </>
            )}
            {connected &&
              (confirmingRemove ? (
                <>
                  <span className="text-sm text-muted-foreground">Remove this connection?</span>
                  <Button variant="destructive" onClick={() => act(() => removeConnection(person.id))}>
                    Yes, remove
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingRemove(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="h-8 px-3 text-sm">
                    <Check data-icon="inline-start" /> Connected
                  </Badge>
                  <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirmingRemove(true)}>
                    Remove connection
                  </Button>
                </>
              ))}
            <div className="ml-auto">
              <ReportButton contentType="profile" contentId={person.id} label="Report profile" size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Section title="About">
        <p className="text-sm">{person.about}</p>
      </Section>

      <Section title="Interests">
        <TagList tags={person.interests} mine={user.profile.interests} />
      </Section>

      <Section title="Skills">
        <TagList tags={person.skills} mine={user.profile.skills} />
        <p className="text-xs text-muted-foreground">Filled in means you have it too.</p>
      </Section>

      <Section title="Education">
        <p className="text-sm">
          {person.college}
          <span className="text-muted-foreground"> · {yearLabel(person.year)}</span>
        </p>
      </Section>

      {person.mutualConnections.length > 0 && (
        <Section title={`Mutual connections (${person.mutualConnections.length})`}>
          <div className="space-y-2">
            {person.mutualConnections.map((mutual) => (
              <div key={mutual.id} className="flex items-center gap-2.5">
                <Avatar>
                  <AvatarFallback>{personInitials(mutual.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 leading-tight">
                  <PersonLink personId={mutual.id} className="block max-w-full truncate text-sm font-medium">
                    {mutual.name}
                  </PersonLink>
                  <p className="truncate text-xs text-muted-foreground">{mutual.college}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Activity is only visible to connections */}
      <Section title="Activity">
        {!connected ? (
          <p className="text-sm text-muted-foreground">Connect with {person.name.split(" ")[0]} to see their activity.</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const opportunity = post.opportunityId ? byId[post.opportunityId] : undefined
              return (
                <div key={post.id} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt, now)}</p>
                  {post.text && <p className="text-sm break-words whitespace-pre-wrap">{post.text}</p>}
                  {opportunity && (
                    <button
                      type="button"
                      onClick={() => onOpen(opportunity.id)}
                      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-muted"
                    >
                      <OrganizerLogo name={opportunity.organizer.name} logo={opportunity.organizer.logo} />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-medium">{opportunity.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {opportunity.organizer.name} · <DeadlineLine opportunity={opportunity} />
                        </p>
                      </div>
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {post.likeCount} {post.likeCount === 1 ? "like" : "likes"} · {post.commentCount}{" "}
                    {post.commentCount === 1 ? "comment" : "comments"}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}
