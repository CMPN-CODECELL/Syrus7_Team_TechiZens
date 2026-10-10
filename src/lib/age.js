// Students in school (Class 10th, 11th, 12th: years -2 to 0 in YEAR_OPTIONS) are treated as under 18.
// For them the social features (Connections, Squad Hub, public profile) are switched off.
export function isSchoolStudent(profile) {
  return Boolean(profile) && profile.year <= 0
}
