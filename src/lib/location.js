// The student's location is stored as one text value, "City, Country" (for example "Pune, India").
// Older values are just a city ("Pune"); those were picked from the Indian list, so they count as India.

// "Pune, India" -> { city: "Pune", country: "India" }. An empty value gives empty parts.
export function parseLocation(value) {
  const text = (value ?? "").trim()
  if (!text || text === "Other") return { city: "", country: "" }
  const parts = text.split(",").map((part) => part.trim())
  if (parts.length === 1) return { city: parts[0], country: "India" }
  return { city: parts[0], country: parts.slice(1).join(", ") }
}

// Builds the stored text. Both parts are needed, otherwise the location is not set yet ("").
export function formatLocation(city, country) {
  const cleanCity = (city ?? "").trim()
  const cleanCountry = (country ?? "").trim()
  return cleanCity && cleanCountry ? `${cleanCity}, ${cleanCountry}` : ""
}

// Just the city, for matching against event locations ("Pune, Maharashtra" contains "Pune").
export function cityOf(value) {
  return parseLocation(value).city
}
