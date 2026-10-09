import { useState } from "react"
import { LocateFixed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CITIES, OTHER_CITY, nearestCity } from "@/data/cities"

// City dropdown plus a "Detect my location" button.
// Detection uses the browser's location permission and picks the nearest listed city.
// Nothing is sent to any server.
export default function LocationPicker({ value, onChange, id }) {
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState("")

  function detect() {
    if (!navigator.geolocation) {
      setError("Location is not supported in this browser.")
      return
    }
    setDetecting(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(nearestCity(position.coords.latitude, position.coords.longitude).name)
        setDetecting(false)
      },
      () => {
        setError("Couldn't detect your location. Please pick your city.")
        setDetecting(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="City"
        className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Select your city</option>
        {CITIES.map((city) => (
          <option key={city.name} value={city.name}>
            {city.name}
          </option>
        ))}
        <option value={OTHER_CITY}>{OTHER_CITY}</option>
      </select>

      <Button type="button" variant="outline" onClick={detect} disabled={detecting}>
        <LocateFixed />
        {detecting ? "Detecting..." : "Detect my location"}
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
