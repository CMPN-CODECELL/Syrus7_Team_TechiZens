import { useNav } from "@/context/nav-context"
import { cn } from "@/lib/utils"

// Wraps a name or avatar so that clicking it opens that student's profile.
// Use personId "me" for the logged-in student (it opens their own Profile page).
export default function PersonLink({ personId, className, children, ...props }) {
  const { openPerson } = useNav()
  return (
    <button
      type="button"
      onClick={() => openPerson(personId)}
      className={cn("text-left hover:underline focus-visible:underline focus-visible:outline-none", className)}
      {...props}
    >
      {children}
    </button>
  )
}
