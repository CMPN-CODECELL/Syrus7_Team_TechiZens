import { LEGAL_PAGES } from "@/data/legal"

// Links to the legal pages plus the short disclaimer. `onOpen(pageId)` opens one (see App.jsx).
// `className` lets the screen add spacing (for example room for the mobile tab bar).
export default function Footer({ onOpen, className = "" }) {
  return (
    <footer className={`mx-auto max-w-7xl space-y-2 border-t px-4 py-6 text-xs text-muted-foreground sm:px-6 ${className}`}>
      <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(LEGAL_PAGES).map(([id, page]) => (
          <button key={id} type="button" onClick={() => onOpen(id)} className="underline-offset-4 hover:text-foreground hover:underline">
            {page.title}
          </button>
        ))}
      </nav>
      <p>
        Listings come from third-party sites and may be wrong or out of date. Always confirm on the organizer's website.
        Organizer names and logos belong to their owners; Nexus is not affiliated with or endorsed by them.
      </p>
    </footer>
  )
}
