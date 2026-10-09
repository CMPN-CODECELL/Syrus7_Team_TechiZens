import { useEffect, useRef, useState } from "react"
import { Send, Trash2, X } from "lucide-react"
import { addComment, deleteComment, getComments } from "@/api/connections"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/user-context"
import { formatTimeAgo, personInitials } from "@/lib/format"
import { yearLabel } from "@/lib/scoring"

const MAX_LENGTH = 300

// One comment or reply, with Reply and (for your own) Delete.
function Comment({ comment, now, onReply, onDelete }) {
  const { author } = comment
  const details = [author.college, yearLabel(author.year), formatTimeAgo(comment.createdAt, now)]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex gap-2.5">
      <Avatar size="sm">
        <AvatarFallback>{personInitials(author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-sm leading-tight font-medium">{author.name}</p>
          <p className="truncate text-xs text-muted-foreground">{details}</p>
          <p className="mt-1 text-sm break-words whitespace-pre-wrap">{comment.text}</p>
        </div>
        <div className="mt-0.5 flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => onReply(comment)}>
            Reply
          </Button>
          {author.id === "me" && (
            <Button
              variant="ghost"
              size="xs"
              aria-label="Delete comment"
              className="text-muted-foreground"
              onClick={() => onDelete(comment)}
            >
              <Trash2 /> Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// The comments under a post: threads (comment + replies) and a box to add one.
// `onCountChange(delta)` tells the post how its comment count changed.
export default function CommentSection({ postId, now, onCountChange }) {
  const { user } = useUser()
  const [comments, setComments] = useState(null) // null = still loading
  const [text, setText] = useState("")
  const [replyingTo, setReplyingTo] = useState(null) // the comment being answered, or null
  const inputRef = useRef(null)

  useEffect(() => {
    getComments(postId).then(setComments)
  }, [postId])

  if (comments === null) {
    return <p className="py-2 text-xs text-muted-foreground">Loading comments...</p>
  }

  const topLevel = comments.filter((c) => c.parentId === null)
  const repliesOf = (id) => comments.filter((c) => c.parentId === id)

  function startReply(comment) {
    setReplyingTo(comment)
    // Answering a reply: mention them, but keep the thread under the original comment.
    setText(comment.parentId ? `@${comment.author.name.split(" ")[0]} ` : "")
    inputRef.current?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    const parentId = replyingTo ? (replyingTo.parentId ?? replyingTo.id) : null
    const created = await addComment({ postId, parentId, text: trimmed })
    setComments((current) => [...current, created])
    onCountChange(1)
    setText("")
    setReplyingTo(null)
  }

  async function handleDelete(comment) {
    await deleteComment(comment.id)
    const removed = comments.filter((c) => c.id === comment.id || c.parentId === comment.id).length
    setComments((current) => current.filter((c) => c.id !== comment.id && c.parentId !== comment.id))
    onCountChange(-removed)
  }

  return (
    <div className="space-y-3 border-t pt-3">
      {topLevel.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be the first.</p>}

      {topLevel.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <Comment comment={comment} now={now} onReply={startReply} onDelete={handleDelete} />
          {repliesOf(comment.id).length > 0 && (
            <div className="ml-9 space-y-2">
              {repliesOf(comment.id).map((reply) => (
                <Comment key={reply.id} comment={reply} now={now} onReply={startReply} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="space-y-1.5">
        {replyingTo && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Replying to {replyingTo.author.name}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Cancel reply"
              onClick={() => {
                setReplyingTo(null)
                setText("")
              }}
            >
              <X />
            </Button>
          </p>
        )}
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{personInitials(user.name)}</AvatarFallback>
          </Avatar>
          <Input
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder={replyingTo ? "Write a reply" : "Add a comment"}
            aria-label={replyingTo ? "Write a reply" : "Add a comment"}
          />
          <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send">
            <Send />
          </Button>
        </div>
      </form>
    </div>
  )
}
