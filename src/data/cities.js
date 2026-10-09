// Countries and major cities for the location picker (Country, then City).
// Coordinates let "Detect my location" pick the nearest listed city without any external service.
// A country with no list here (or a city that is not listed) uses a typed city name instead.

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Ethiopia",
  "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Hong Kong", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg",
  "Malaysia", "Maldives", "Malta", "Mauritius", "Mexico", "Moldova", "Mongolia", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nepal", "Netherlands", "New Zealand", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palestine", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa",
  "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania",
  "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
  "Andorra", "Angola", "Bahamas", "Barbados", "Belize", "Benin", "Brunei", "Burkina Faso", "Burundi", "Cape Verde",
  "Chad", "Congo", "DR Congo", "Djibouti", "El Salvador", "Eritrea", "Eswatini", "Fiji", "Gabon", "Gambia", "Guinea",
  "Guyana", "Haiti", "Honduras", "Kosovo", "Lesotho", "Liberia", "Liechtenstein", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Montenegro", "Nicaragua", "Niger", "North Korea", "Papua New Guinea", "Sierra Leone", "Somalia",
  "South Sudan", "Suriname", "Tajikistan", "Timor-Leste", "Togo", "Trinidad and Tobago", "Turkmenistan",
].sort((a, b) => a.localeCompare(b))

const city = (name, lat, lng) => ({ name, lat, lng })

// Cities by country. India is the longest list because most students are there.
export const CITIES_BY_COUNTRY = {
  India: [
    city("Agra", 27.18, 78.02), city("Ahmedabad", 23.02, 72.57), city("Amritsar", 31.63, 74.87),
    city("Bengaluru", 12.97, 77.59), city("Bhopal", 23.26, 77.41), city("Bhubaneswar", 20.3, 85.82),
    city("Chandigarh", 30.73, 76.78), city("Chennai", 13.08, 80.27), city("Coimbatore", 11.02, 76.96),
    city("Dehradun", 30.32, 78.03), city("Delhi", 28.61, 77.21), city("Faridabad", 28.41, 77.31),
    city("Ghaziabad", 28.67, 77.45), city("Goa", 15.5, 73.83), city("Gurugram", 28.46, 77.03),
    city("Guwahati", 26.14, 91.74), city("Hyderabad", 17.39, 78.49), city("Indore", 22.72, 75.86),
    city("Jaipur", 26.91, 75.79), city("Jodhpur", 26.24, 73.02), city("Kanpur", 26.45, 80.33),
    city("Kochi", 9.93, 76.27), city("Kolkata", 22.57, 88.36), city("Lucknow", 26.85, 80.95),
    city("Ludhiana", 30.9, 75.86), city("Madurai", 9.93, 78.12), city("Mumbai", 19.08, 72.88),
    city("Mysuru", 12.3, 76.64), city("Nagpur", 21.15, 79.09), city("Nashik", 20.0, 73.79),
    city("Noida", 28.54, 77.39), city("Patna", 25.59, 85.14), city("Pune", 18.52, 73.86),
    city("Raipur", 21.25, 81.63), city("Rajkot", 22.3, 70.8), city("Ranchi", 23.34, 85.31),
    city("Surat", 21.17, 72.83), city("Thiruvananthapuram", 8.52, 76.94), city("Vadodara", 22.31, 73.18),
    city("Varanasi", 25.32, 82.97), city("Vijayawada", 16.51, 80.65), city("Visakhapatnam", 17.69, 83.22),
  ],
  "United States": [
    city("Atlanta", 33.75, -84.39), city("Austin", 30.27, -97.74), city("Boston", 42.36, -71.06),
    city("Chicago", 41.88, -87.63), city("Dallas", 32.78, -96.8), city("Denver", 39.74, -104.99),
    city("Houston", 29.76, -95.37), city("Los Angeles", 34.05, -118.24), city("Miami", 25.76, -80.19),
    city("New York", 40.71, -74.01), city("Philadelphia", 39.95, -75.17), city("Pittsburgh", 40.44, -80.0),
    city("Raleigh", 35.78, -78.64), city("San Diego", 32.72, -117.16), city("San Francisco", 37.77, -122.42),
    city("San Jose", 37.34, -121.89), city("Seattle", 47.61, -122.33), city("Washington DC", 38.91, -77.04),
  ],
  "United Kingdom": [
    city("Birmingham", 52.49, -1.89), city("Bristol", 51.45, -2.59), city("Cambridge", 52.21, 0.12),
    city("Edinburgh", 55.95, -3.19), city("Glasgow", 55.86, -4.25), city("Leeds", 53.8, -1.55),
    city("London", 51.51, -0.13), city("Manchester", 53.48, -2.24), city("Oxford", 51.75, -1.26),
  ],
  Canada: [
    city("Calgary", 51.05, -114.07), city("Edmonton", 53.55, -113.49), city("Montreal", 45.5, -73.57),
    city("Ottawa", 45.42, -75.7), city("Toronto", 43.65, -79.38), city("Vancouver", 49.28, -123.12),
    city("Waterloo", 43.46, -80.52), city("Winnipeg", 49.9, -97.14),
  ],
  Australia: [
    city("Adelaide", -34.93, 138.6), city("Brisbane", -27.47, 153.03), city("Canberra", -35.28, 149.13),
    city("Melbourne", -37.81, 144.96), city("Perth", -31.95, 115.86), city("Sydney", -33.87, 151.21),
  ],
  "New Zealand": [city("Auckland", -36.85, 174.76), city("Wellington", -41.29, 174.78)],
  Singapore: [city("Singapore", 1.35, 103.82)],
  "United Arab Emirates": [city("Abu Dhabi", 24.45, 54.38), city("Dubai", 25.2, 55.27), city("Sharjah", 25.35, 55.42)],
  "Saudi Arabia": [city("Jeddah", 21.49, 39.19), city("Riyadh", 24.71, 46.68)],
  Qatar: [city("Doha", 25.29, 51.53)],
  Germany: [
    city("Berlin", 52.52, 13.4), city("Cologne", 50.94, 6.96), city("Frankfurt", 50.11, 8.68),
    city("Hamburg", 53.55, 9.99), city("Munich", 48.14, 11.58), city("Stuttgart", 48.78, 9.18),
  ],
  France: [city("Lyon", 45.76, 4.84), city("Marseille", 43.3, 5.37), city("Paris", 48.86, 2.35), city("Toulouse", 43.6, 1.44)],
  Netherlands: [
    city("Amsterdam", 52.37, 4.9), city("Delft", 52.01, 4.36), city("Eindhoven", 51.44, 5.48),
    city("Rotterdam", 51.92, 4.48), city("Utrecht", 52.09, 5.12),
  ],
  Ireland: [city("Cork", 51.9, -8.47), city("Dublin", 53.35, -6.26), city("Galway", 53.27, -9.05)],
  Spain: [city("Barcelona", 41.39, 2.17), city("Madrid", 40.42, -3.7), city("Valencia", 39.47, -0.38)],
  Italy: [city("Milan", 45.46, 9.19), city("Rome", 41.9, 12.5)],
  Switzerland: [city("Geneva", 46.2, 6.14), city("Zurich", 47.38, 8.54)],
  Sweden: [city("Gothenburg", 57.71, 11.97), city("Stockholm", 59.33, 18.07)],
  Finland: [city("Helsinki", 60.17, 24.94), city("Tampere", 61.5, 23.76), city("Turku", 60.45, 22.27)],
  Poland: [city("Krakow", 50.06, 19.94), city("Warsaw", 52.23, 21.01), city("Wroclaw", 51.11, 17.04)],
  Turkey: [city("Ankara", 39.93, 32.86), city("Istanbul", 41.01, 28.98)],
  Japan: [city("Kyoto", 35.01, 135.77), city("Osaka", 34.69, 135.5), city("Tokyo", 35.68, 139.69)],
  China: [
    city("Beijing", 39.9, 116.41), city("Guangzhou", 23.13, 113.26), city("Hangzhou", 30.27, 120.16),
    city("Shanghai", 31.23, 121.47), city("Shenzhen", 22.54, 114.06),
  ],
  "South Korea": [city("Seoul", 37.57, 126.98)],
  Malaysia: [city("George Town", 5.41, 100.33), city("Johor Bahru", 1.49, 103.74), city("Kuala Lumpur", 3.14, 101.69)],
  Indonesia: [city("Jakarta", -6.21, 106.85)],
  Philippines: [city("Manila", 14.6, 120.98)],
  Vietnam: [city("Hanoi", 21.03, 105.85), city("Ho Chi Minh City", 10.82, 106.63)],
  Bangladesh: [city("Chittagong", 22.36, 91.78), city("Dhaka", 23.81, 90.41)],
  Pakistan: [city("Islamabad", 33.68, 73.05), city("Karachi", 24.86, 67.01), city("Lahore", 31.55, 74.34)],
  "Sri Lanka": [city("Colombo", 6.93, 79.86)],
  Nepal: [city("Kathmandu", 27.72, 85.32)],
  Nigeria: [city("Abuja", 9.08, 7.4), city("Ibadan", 7.38, 3.95), city("Lagos", 6.52, 3.38)],
  "South Africa": [city("Cape Town", -33.92, 18.42), city("Durban", -29.86, 31.02), city("Johannesburg", -26.2, 28.05)],
  Kenya: [city("Nairobi", -1.29, 36.82)],
  Egypt: [city("Cairo", 30.04, 31.24)],
  Brazil: [city("Rio de Janeiro", -22.91, -43.17), city("Sao Paulo", -23.55, -46.63)],
  Mexico: [city("Guadalajara", 20.67, -103.35), city("Mexico City", 19.43, -99.13), city("Monterrey", 25.69, -100.32)],
}

// Every listed city with its country (used for "Detect my location" and for spotting a city in a search).
export const ALL_CITIES = Object.entries(CITIES_BY_COUNTRY).flatMap(([country, cities]) =>
  cities.map((c) => ({ ...c, country }))
)

export const OTHER_CITY = "Other city"

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

// The closest listed city, as { name, country, lat, lng }.
export function nearestCity(lat, lng) {
  return ALL_CITIES.reduce((best, c) =>
    distanceKm(lat, lng, c.lat, c.lng) < distanceKm(lat, lng, best.lat, best.lng) ? c : best
  )
}
