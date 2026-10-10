import { useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LEGAL_PAGES, LEGAL_UPDATED } from "@/data/legal"
import { cn } from "@/lib/utils"

// Privacy Policy, Terms of Use, Sources and attribution, Contact. The text lives in src/data/legal.js.
export default function LegalPage({ page, onBack, onNavigate }) {
  const content = LEGAL_PAGES[page]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  if (!content) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" onClick={onBack} className="-ml-2">
        <ArrowLeft /> Back
      </Button>

      <nav aria-label="Legal pages" className="flex flex-wrap gap-1.5">
        {Object.entries(LEGAL_PAGES).map(([id, item]) => (
          <Button
            key={id}
            size="sm"
            variant={id === page ? "secondary" : "ghost"}
            aria-current={id === page ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            {item.title}
          </Button>
        ))}
      </nav>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
        <p className="text-muted-foreground">{content.intro}</p>
        <p className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          Draft for a hackathon project. It has not been reviewed by a lawyer.
        </p>
      </div>

      {content.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.body.map((block, index) =>
            typeof block === "string" ? (
              <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                {block}
              </p>
            ) : (
              <ul key={index} className={cn("list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground")}>
                {block.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          )}
        </section>
      ))}
    </div>
  )
}
