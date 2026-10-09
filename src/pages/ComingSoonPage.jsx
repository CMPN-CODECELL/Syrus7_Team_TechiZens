import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Placeholder for POC features that are not built yet.
export default function ComingSoonPage({ title, items }) {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <Badge variant="outline" className="mb-2 w-fit">
            Coming soon
          </Badge>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
