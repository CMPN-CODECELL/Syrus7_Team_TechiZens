import { useState } from "react"
import { sourceInfo } from "@/lib/sources"

// Where a listing was collected from, with the site's logo: "via [logo] Devpost".
// Shows nothing when the listing has no known source. `label` is the word before the logo.
export default function SourceBadge({ opportunity, label = "via", className = "" }) {
  const info = sourceInfo(opportunity)
  const [iconFailed, setIconFailed] = useState(false)
  if (!info) return null

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={`Collected from ${info.name}`}>
      {label}
      {!iconFailed && (
        <img
          src={info.icon}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-4 rounded-sm"
          onError={() => setIconFailed(true)}
        />
      )}
      <span className="font-medium text-foreground">{info.name}</span>
    </span>
  )
}
