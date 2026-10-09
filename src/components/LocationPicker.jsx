import { useState } from "react"
import { LocateFixed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CITIES_BY_COUNTRY, COUNTRIES, OTHER_CITY, nearestCity } from "@/data/cities"
import { formatLocation, parseLocation } from "@/lib/location"

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

// Country dropdown, then City dropdown (or a typed city when the city is not listed), plus a
// "Detect my location" button. The value is one text, "City, Country" (see src/lib/location.js).
// Detection uses the browser's location permission and picks the nearest listed city.
// Nothing is sent to any server.
export default function LocationPicker({ value, onChange, id }) {
  const parsed = parseLocation(value)
  const [pickedCountry, setPickedCountry] = useState("") // chosen before a city is chosen
  const country = parsed.country || pickedCountry
  const cities = CITIES_BY_COUNTRY[country] ?? null // null = no list for this country, type the city
  const cityIsListed = cities?.some((c) => c.name === parsed.city)

  // Typing a city: either the country has no list, or "Other city" was chosen.
  const [typing, setTyping] = useState(Boolean(parsed.city) && !cityIsListed)
  const [typedCity, setTypedCity] = useState(cityIsListed ? "" : parsed.city)

  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState("")

  const showTypedCity = Boolean(country) && (cities === null || typing)
  const cityValue = typing ? OTHER_CITY : cityIsListed ? parsed.city : ""

  function handleCountry(event) {
    setPickedCountry(event.target.value)
    setTyping(false)
    setTypedCity("")
    onChange("") // the old city does not belong to the new country
  }

  function handleCity(event) {
    const name = event.target.value
    if (name === OTHER_CITY) {
      setTyping(true)
      setTypedCity("")
      onChange("")
    } else {
      setTyping(false)
      onChange(formatLocation(name, country))
    }
  }

  function handleTyped(event) {
    setTypedCity(event.target.value)
    onChange(formatLocation(event.target.value, country))
  }

  function detect() {
    if (!navigator.geolocation) {
      setError("Location is not supported in this browser.")
      return
    }
    setDetecting(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const found = nearestCity(position.coords.latitude, position.coords.longitude)
        setPickedCountry(found.country)
        setTyping(false)
        onChange(formatLocation(found.name, found.country))
        setDetecting(false)
      },
      () => {
        setError("Couldn't detect your location. Please pick your country and city.")
        setDetecting(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <select id={id} value={country} onChange={handleCountry} aria-label="Country" className={SELECT_CLASS}>
        <option value="">Select your country</option>
        {COUNTRIES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {cities && (
        <select value={cityValue} onChange={handleCity} aria-label="City" className={SELECT_CLASS}>
          <option value="">Select your city</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
          <option value={OTHER_CITY}>{OTHER_CITY} (type it)</option>
        </select>
      )}

      {showTypedCity && (
        <Input
          value={typedCity}
          onChange={handleTyped}
          placeholder="Type your city"
          aria-label="Type your city"
          maxLength={60}
          className="h-11"
        />
      )}

      <Button type="button" variant="outline" onClick={detect} disabled={detecting}>
        <LocateFixed />
        {detecting ? "Detecting..." : "Detect my location"}
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
