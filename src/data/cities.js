// Major Indian cities with approximate coordinates.
// Coordinates let "Detect my location" pick the nearest city without any external service.
export const CITIES = [
  { name: "Agra", lat: 27.18, lng: 78.02 },
  { name: "Ahmedabad", lat: 23.02, lng: 72.57 },
  { name: "Amritsar", lat: 31.63, lng: 74.87 },
  { name: "Bengaluru", lat: 12.97, lng: 77.59 },
  { name: "Bhopal", lat: 23.26, lng: 77.41 },
  { name: "Bhubaneswar", lat: 20.3, lng: 85.82 },
  { name: "Chandigarh", lat: 30.73, lng: 76.78 },
  { name: "Chennai", lat: 13.08, lng: 80.27 },
  { name: "Coimbatore", lat: 11.02, lng: 76.96 },
  { name: "Dehradun", lat: 30.32, lng: 78.03 },
  { name: "Delhi", lat: 28.61, lng: 77.21 },
  { name: "Faridabad", lat: 28.41, lng: 77.31 },
  { name: "Ghaziabad", lat: 28.67, lng: 77.45 },
  { name: "Goa", lat: 15.5, lng: 73.83 },
  { name: "Gurugram", lat: 28.46, lng: 77.03 },
  { name: "Guwahati", lat: 26.14, lng: 91.74 },
  { name: "Hyderabad", lat: 17.39, lng: 78.49 },
  { name: "Indore", lat: 22.72, lng: 75.86 },
  { name: "Jaipur", lat: 26.91, lng: 75.79 },
  { name: "Jodhpur", lat: 26.24, lng: 73.02 },
  { name: "Kanpur", lat: 26.45, lng: 80.33 },
  { name: "Kochi", lat: 9.93, lng: 76.27 },
  { name: "Kolkata", lat: 22.57, lng: 88.36 },
  { name: "Lucknow", lat: 26.85, lng: 80.95 },
  { name: "Ludhiana", lat: 30.9, lng: 75.86 },
  { name: "Madurai", lat: 9.93, lng: 78.12 },
  { name: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "Mysuru", lat: 12.3, lng: 76.64 },
  { name: "Nagpur", lat: 21.15, lng: 79.09 },
  { name: "Nashik", lat: 20.0, lng: 73.79 },
  { name: "Noida", lat: 28.54, lng: 77.39 },
  { name: "Patna", lat: 25.59, lng: 85.14 },
  { name: "Pune", lat: 18.52, lng: 73.86 },
  { name: "Raipur", lat: 21.25, lng: 81.63 },
  { name: "Rajkot", lat: 22.3, lng: 70.8 },
  { name: "Ranchi", lat: 23.34, lng: 85.31 },
  { name: "Surat", lat: 21.17, lng: 72.83 },
  { name: "Thiruvananthapuram", lat: 8.52, lng: 76.94 },
  { name: "Vadodara", lat: 22.31, lng: 73.18 },
  { name: "Varanasi", lat: 25.32, lng: 82.97 },
  { name: "Vijayawada", lat: 16.51, lng: 80.65 },
  { name: "Visakhapatnam", lat: 17.69, lng: 83.22 },
]

export const OTHER_CITY = "Other"

// Straight-line distance in km between two points (haversine formula).
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

export function nearestCity(lat, lng) {
  return CITIES.reduce((best, city) =>
    distanceKm(lat, lng, city.lat, city.lng) < distanceKm(lat, lng, best.lat, best.lng) ? city : best
  )
}
