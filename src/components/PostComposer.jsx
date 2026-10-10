import { useState } from "react"
import { Send } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/context/user-context"
import { personInitials } from "@/lib/format"

const MAX_LENGTH = 500

// What the student can write. The last two are about an opportunity, so one must be attached.
const TYPES = [
  { id: "update", label: "Update", placeholder: "Share an update with your connections", needsOpportunity: false },
  { id: "recommended", label: "Recommend", placeholder: "Why do you recommend it?", needsOpportunity: true },
  { id: "looking_for_team", label: "Looking for teammates", placeholder: "Who are you looking for? What will you build?", needsOpportunity: true },
]

// "Start a post" box. Optionally (or, for recommendations and team posts, necessarily) attach one opportunity.
// `onPost` returns false when posting failed, so the text is kept.
export default function PostComposer({ opportunities, onPost }) {
  const { user } = useUser()
  const [type, setType] = useState("update")
  const [text, setText] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [posting, setPosting] = useState(false)

  const current = TYPES.find((item) => item.id === type)
  const canPost = text.trim().length > 0 && (!current.needsOpportunity || opportunityId) && !posting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canPost) return
    setPosting(true)
    const ok = await onPost({ type, text: text.trim(), opportunityId: opportunityId || null })
    if (ok !== false) {
      setText("")
      setOpportunityId("")
      setType("update")
    }
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
            <div className="min-w-0 flex-1 space-y-2">
              <div role="group" aria-label="Type of post" className="flex flex-wrap gap-1.5">
                {TYPES.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    size="xs"
                    variant={type === item.id ? "default" : "outline"}
                    aria-pressed={type === item.id}
                    onClick={() => setType(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_LENGTH}
                rows={2}
                placeholder={current.placeholder}
                aria-label="Write a post"
                className="min-h-16"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={opportunityId}
              onChange={(event) => setOpportunityId(event.target.value)}
              aria-label="Attach an opportunity"
              className="h-8 max-w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
            >
              <option value="">{current.needsOpportunity ? "Choose an opportunity" : "Attach an opportunity (optional)"}</option>
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
