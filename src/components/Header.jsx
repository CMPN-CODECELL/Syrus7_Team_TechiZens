import { Bell, Compass, LogOut, Network, UserRound, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSaved } from "@/context/saved-context"
import { useUser } from "@/context/user-context"

const NAV_ITEMS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "connections", label: "Connections", icon: Network },
  { id: "squads", label: "Squad Hub", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "profile", label: "Profile", icon: UserRound },
]

export default function Header({ page, onNavigate }) {
  const { user, signOut } = useUser()
  const { unreadCount } = useSaved()

  // Small count bubble on the Alerts item.
  const badge = (id) =>
    id === "alerts" && unreadCount > 0 ? (
      <span className="rounded-full bg-primary px-1.5 text-[0.65rem] leading-4 text-primary-foreground">
        {unreadCount}
      </span>
    ) : null
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate("discover")}
          className="text-xl font-semibold tracking-tight"
        >
          Nexus
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={page === item.id ? "secondary" : "ghost"}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon />
              {item.label}
              {badge(item.id)}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={page === item.id ? "secondary" : "ghost"}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon />
            {item.label}
              {badge(item.id)}
          </Button>
        ))}
      </nav>
    </header>
  )
}
