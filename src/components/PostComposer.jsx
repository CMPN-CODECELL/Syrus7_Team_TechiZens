import { useState } from "react"
import { Send } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/context/user-context"
import { personInitials } from "@/lib/format"

const MAX_LENGTH = 500

// "Start a post" box. Optionally attach one opportunity to the post.
export default function PostComposer({ opportunities, onPost }) {
  const { user } = useUser()
  const [text, setText] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [posting, setPosting] = useState(false)

  const canPost = text.trim().length > 0 && !posting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canPost) return
    setPosting(true)
    await onPost({ text: text.trim(), opportunityId: opportunityId || null })
    setText("")
    setOpportunityId("")
    setPosting(false)
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar size="lg">
              <AvatarFallback>{personInitials(user.name)}</AvatarFallback>
            </Avatar>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={MAX_LENGTH}
              rows={2}
              placeholder="Share an update with your connections"
              aria-label="Write a post"
              className="min-h-16"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={opportunityId}
              onChange={(event) => setOpportunityId(event.target.value)}
              aria-label="Attach an opportunity"
              className="h-8 max-w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
            >
              <option value="">Attach an opportunity (optional)</option>
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.title}
                </option>
              ))}
            </select>

            <Button type="submit" disabled={!canPost}>
              <Send /> Post
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Don't share phone numbers or emails. Contacts are shared only after both sides agree.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
