import { BookOpen, Briefcase, Code, Trophy, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORIES } from "@/data/opportunities"

const ICONS = {
  courses: BookOpen,
  internships: Briefcase,
  hackathons: Code,
  workshops: Wrench,
  competitions: Trophy,
}

// Clicking a card filters the feed to that category; click again to clear.
export default function CategoryCards({ selected, onSelect }) {
  return (
    <section aria-label="Opportunity types" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CATEGORIES.map((category) => {
        const Icon = ICONS[category.id]
        const isSelected = selected === category.id

        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected ? null : category.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-card p-4 font-medium transition hover:bg-muted",
              isSelected && "border-primary bg-primary text-primary-foreground hover:bg-primary"
            )}
          >
            <Icon className="size-5 shrink-0" />
            {category.label}
          </button>
        )
      })}
    </section>
  )
}
