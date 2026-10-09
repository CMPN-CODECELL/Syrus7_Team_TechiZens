import { ThumbsUp } from "lucide-react"
import OrganizerLogo from "@/components/OrganizerLogo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { daysSince, formatDate, formatDaysAgo } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"

// What each post type says next to the author's name.
const ACTIONS = {
  saved: "saved an opportunity",
  recommended: "recommends an opportunity",
  looking_for_team: "is looking for teammates",
  update: "shared an update",
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

// One post in the Connections feed. `opportunity` is the opportunity the post is about (or undefined).
export default function ConnectionPost({ post, opportunity, now, onLike, onOpen }) {
  const { author } = post

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Who and when */}
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials(author.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="text-sm">
              <span className="font-medium">{author.name}</span>{" "}
              <span className="text-muted-foreground">{ACTIONS[post.type]}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {author.college} · {yearLabel(author.year)} · {formatDaysAgo(daysSince(post.createdAt, now))}
            </p>
          </div>
        </div>

        {post.text && <p className="text-sm">{post.text}</p>}

        {/* The opportunity the post is about */}
        {opportunity && (
          <button
            type="button"
            onClick={() => onOpen(opportunity.id)}
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-muted"
          >
            <OrganizerLogo name={opportunity.organizer.name} logo={opportunity.organizer.logo} />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium">{opportunity.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {opportunity.organizer.name} · Deadline {formatDate(opportunity.deadline)}
              </p>
            </div>
          </button>
        )}

        <div>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={post.likedByMe}
            onClick={() => onLike(post.id)}
            className={post.likedByMe ? "font-semibold text-foreground" : "text-muted-foreground"}
          >
            <ThumbsUp className={post.likedByMe ? "fill-current" : ""} />
            {post.likeCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
