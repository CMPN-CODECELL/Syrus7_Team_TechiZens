import { useState } from "react"
import { MessageCircle, ThumbsUp, Trash2 } from "lucide-react"
import CommentSection from "@/components/CommentSection"
import OrganizerLogo from "@/components/OrganizerLogo"
import PersonLink from "@/components/PersonLink"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatTimeAgo, personInitials } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"

// What each post type says next to the author's name.
const ACTIONS = {
  saved: "saved an opportunity",
  recommended: "recommends an opportunity",
  looking_for_team: "is looking for teammates",
  update: "shared an update",
}

// One post in the Connections feed. `opportunity` is the opportunity the post is about (or undefined).
export default function ConnectionPost({
  post,
  opportunity,
  now,
  onLike,
  onOpen,
  onDelete,
  onCommentCountChange,
}) {
  const { author } = post
  const [showComments, setShowComments] = useState(false)
  const isMine = author.id === "me"
  const details = [author.college, yearLabel(author.year), formatTimeAgo(post.createdAt, now)]
    .filter(Boolean)
    .join(" · ")

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Who and when */}
        <div className="flex items-start gap-3">
          <PersonLink personId={author.id} aria-label={`${author.name}'s profile`}>
            <Avatar size="lg">
              <AvatarFallback>{personInitials(author.name)}</AvatarFallback>
            </Avatar>
          </PersonLink>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm">
              <PersonLink personId={author.id} className="font-medium">
                {isMine ? "You" : author.name}
              </PersonLink>{" "}
              <span className="text-muted-foreground">{ACTIONS[post.type]}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">{details}</p>
          </div>
          {isMine && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete post"
              title="Delete post"
              className="text-muted-foreground"
              onClick={() => onDelete(post.id)}
            >
              <Trash2 />
            </Button>
          )}
        </div>

        {post.text && <p className="text-sm break-words whitespace-pre-wrap">{post.text}</p>}

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

        {/* Like and comment */}
        <div className="flex gap-1">
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
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showComments}
            onClick={() => setShowComments((open) => !open)}
            className={showComments ? "font-semibold text-foreground" : "text-muted-foreground"}
          >
            <MessageCircle />
            {post.commentCount}
          </Button>
        </div>

        {showComments && (
          <CommentSection
            postId={post.id}
            now={now}
            onCountChange={(delta) => onCommentCountChange(post.id, delta)}
          />
        )}
      </CardContent>
    </Card>
  )
}
