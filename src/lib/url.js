// Links in the data come from other websites. Only plain web links are allowed, so a value like
// "javascript:..." can never end up in an href.
export function safeHttpUrl(value) {
  if (!value || typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? value : null
  } catch {
    return null
  }
}
