import { Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Shows what the student asked and what the AI understood from it.
// `data` is the result of searchWithAI (see src/api/search.js), or null while it is thinking.
export default function AiSearchPanel({ query, data, onClear }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="flex min-w-0 items-start gap-2 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <span className="break-words">“{query}”</span>
          </p>
          <Button variant="ghost" size="icon-sm" aria-label="Clear AI search" onClick={onClear}>
            <X />
          </Button>
        </div>

        {data === null ? (
          <p className="text-sm text-muted-foreground">Thinking...</p>
        ) : (
          <>
            {data.understood.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">I understood:</span>
                {data.understood.map((part) => (
                  <Badge
                    key={part.label}
                    variant={part.dropped ? "outline" : "secondary"}
                    className={cn(part.dropped && "text-muted-foreground line-through")}
                    title={part.dropped ? "Ignored to find results" : undefined}
                  >
                    {part.label}
                  </Badge>
                ))}
              </div>
            )}
            {data.message && <p className="text-sm text-muted-foreground">{data.message}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
