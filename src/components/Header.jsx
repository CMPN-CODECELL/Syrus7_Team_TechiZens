import { Bell, Compass, LogOut, Network, UserRound, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSaved } from "@/context/saved-context"
import { useUser } from "@/context/user-context"
import { isSchoolStudent } from "@/lib/age"

// `social` items are hidden for school students (under 18).
const NAV_ITEMS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "connections", label: "Connections", icon: Network, social: true },
  { id: "squads", label: "Squad Hub", icon: Users, social: true },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "profile", label: "Profile", icon: UserRound },
]

export default function Header({ page, onNavigate }) {
  const { user, signOut } = useUser()
  const { unreadCount } = useSaved()
  const navItems = isSchoolStudent(user.profile) ? NAV_ITEMS.filter((item) => !item.social) : NAV_ITEMS

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
    <>
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate("discover")}
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <img src="/logo.png" alt="" className="size-8" />
          Nexus
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
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

    </header>

    {/* Mobile navigation: a tab bar fixed to the bottom, so all five pages fit without sideways scrolling */}
    <nav aria-label="Main" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }} className="fixed inset-x-0 bottom-0 z-20 grid border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={page === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
          className={
            "relative flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium " +
            (page === item.id ? "text-foreground" : "text-muted-foreground")
          }
        >
          <item.icon className="size-5" />
          {item.label}
          {item.id === "alerts" && unreadCount > 0 && (
            <span className="absolute top-1 left-1/2 ml-2 rounded-full bg-primary px-1.5 text-[0.6rem] leading-4 text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </nav>
    </>
  )
}
