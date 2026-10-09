import { BookOpen, Briefcase, Code, Trophy, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORIES } from "@/data/constants"

const ICONS = {
  courses: BookOpen,
  internships: Briefcase,
  hackathons: Code,
  workshops: Wrench,
  competitions: Trophy,
}

// How many columns the row gets on wide screens, so hiding a type does not leave a gap.
const WIDE_COLUMNS = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }

// Clicking a card filters the feed to that category; click again to clear.
// `available` is the set of categories that have at least one open opportunity: types with none are hidden
// (they come back by themselves once data exists). null = still loading, show them all.
// On phones the cards are one row you can swipe, so the feed starts higher up the screen.
export default function CategoryCards({ selected, onSelect, available = null }) {
  const categories = CATEGORIES.filter((category) => !available || available.has(category.id))
  return (
    <section
      aria-label="Opportunity types"
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0",
        WIDE_COLUMNS[categories.length] ?? "lg:grid-cols-5"
      )}
    >
      {categories.map((category) => {
        const Icon = ICONS[category.id]
        const isSelected = selected === category.id

        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected ? null : category.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition hover:bg-muted sm:gap-3 sm:p-4 sm:text-base",
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
