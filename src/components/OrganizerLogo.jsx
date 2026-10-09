import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Up to two capital letters from the organizer's name, ignoring small words like "of".
function getInitials(name) {
  const words = name.split(/\s+/).filter((word) => /^[A-Z0-9]/.test(word))
  if (words.length <= 1) return name.replace(/\s+/g, "").slice(0, 2).toUpperCase()
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
}

// Gives each organizer its own soft, stable colour for the fallback badge.
function getHue(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

// Shows the organizer's logo, or coloured initials when there is no logo (or it fails to load).
export default function OrganizerLogo({ name, logo }) {
  const hue = getHue(name)

  return (
    <Avatar className="size-10 rounded-lg after:rounded-lg">
      {logo ? <AvatarImage src={logo} alt={`${name} logo`} className="rounded-lg object-contain p-1" /> : null}
      <AvatarFallback
        className="rounded-lg text-sm font-semibold"
        style={{ backgroundColor: `hsl(${hue} 45% 92%)`, color: `hsl(${hue} 45% 30%)` }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
