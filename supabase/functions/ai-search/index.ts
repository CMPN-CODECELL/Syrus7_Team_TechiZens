// Edge Function: ai-search
//
// Turns a plain-English request ("free online coding workshops this weekend") into structured filters.
// The app then runs those filters on its own data (src/lib/aiCriteria.js + src/lib/mockSearchParser.js findMatches),
// so the model never sees or invents opportunities, it only reads the question.
//
// Needs one secret (never put it in the app or in git). Either of these works; Gemini is used when both are set:
//   npx supabase secrets set GEMINI_API_KEY=... --project-ref <ref>      (Google AI Studio; optional GEMINI_MODEL)
//   npx supabase secrets set ANTHROPIC_API_KEY=... --project-ref <ref>
// Without one this function answers 503 "not_configured" and the app falls back to its rule-based search.
//
// Only signed-in students can call it (checked below), the request is size-limited, and each student gets a small
// hourly allowance, so the key cannot be drained by one account.

import { createClient } from "npm:@supabase/supabase-js@2"

const CLAUDE_MODEL = "claude-haiku-5-5"
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
const MAX_QUERY_LENGTH = 200
const MAX_CALLS_PER_HOUR = 30

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } })

// A simple per-instance allowance (good enough to stop one account looping; not a billing guarantee).
const calls = new Map<string, number[]>()
function allowed(userId: string) {
  const now = Date.now()
  const recent = (calls.get(userId) ?? []).filter((time) => now - time < 3_600_000)
  if (recent.length >= MAX_CALLS_PER_HOUR) return false
  calls.set(userId, [...recent, now])
  return true
}

class UpstreamError extends Error {
  constructor(public status: number) {
    super(`upstream ${status}`)
  }
}

async function askGemini(apiKey: string, system: string, query: string): Promise<string> {
  const model = Deno.env.get("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL
  const reply = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: query }] }],
      // JSON only, no randomness. Room to spare because some models spend tokens thinking first.
      generationConfig: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 2048 },
    }),
  })
  if (!reply.ok) throw new UpstreamError(reply.status)
  const data = await reply.json()
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? []
  return parts.map((part) => part.text ?? "").join("")
}

async function askClaude(apiKey: string, system: string, query: string): Promise<string> {
  const reply = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 400, system, messages: [{ role: "user", content: query }] }),
  })
  if (!reply.ok) throw new UpstreamError(reply.status)
  const data = await reply.json()
  return (data?.content ?? []).map((part: { text?: string }) => part.text ?? "").join("")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  // 1. Who is asking? Only signed-in students.
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
  const { data: auth } = await supabase.auth.getUser(token)
  if (!auth?.user) return json({ error: "not_signed_in" }, 401)
  if (!allowed(auth.user.id)) return json({ error: "rate_limited" }, 429)

  const geminiKey = Deno.env.get("GEMINI_API_KEY")
  const claudeKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!geminiKey && !claudeKey) return json({ error: "not_configured" }, 503)

  // 2. What are they asking?
  let body: { query?: string; today?: string; interests?: string[]; categories?: string[] }
  try {
    body = await request.json()
  } catch {
    return json({ error: "bad_request" }, 400)
  }
  const query = String(body.query ?? "").trim().slice(0, MAX_QUERY_LENGTH)
  if (!query) return json({ error: "empty_query" }, 400)
  const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today ?? "") ? body.today : new Date().toISOString().slice(0, 10)
  const interests = (body.interests ?? []).slice(0, 80).map(String)
  const categories = (body.categories ?? []).slice(0, 10).map(String)

  const system = [
    "You read a student's request for learning opportunities (hackathons, internships, workshops, competitions, courses) and return filters as JSON.",
    "Return ONLY one JSON object, no prose, no code fences. Use null for anything the request does not say. Never invent details.",
    `Today is ${today}.`,
    "Shape:",
    '{"format":"Online|In-person|Hybrid|null",',
    ` "categories":[subset of ${JSON.stringify(categories)}],`,
    ' "level":"Beginner|Intermediate|Advanced|null",',
    ` "topics":[subset of ${JSON.stringify(interests)} that the request is about],`,
    ' "city":"a city name, or \\"near me\\" if the student says near me, or null",',
    ' "team":"solo|team|null",',
    ' "eligibleOnly":true|false,',
    ' "lowCost":true|false  (true if they ask for free, cheap or low-cost),',
    ' "dateFrom":"YYYY-MM-DD|null", "dateTo":"YYYY-MM-DD|null"  (resolve words like this weekend / next month from today),',
    ' "deadlineWithinDays":number|null  (for "closing soon" use 14),',
    ' "keywords":[specific skills, companies or colleges named, lowercase, max 4]}',
  ].join("\n")

  // 3. Ask the model (Gemini if its key is set, otherwise Claude) and get its answer as text.
  let text: string
  try {
    text = geminiKey ? await askGemini(geminiKey, system, query) : await askClaude(claudeKey!, system, query)
  } catch (failure) {
    const status = failure instanceof UpstreamError ? failure.status : 0
    return json(status ? { error: "upstream_error", status } : { error: "upstream_unreachable" }, 502)
  }
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return json({ error: "unreadable_answer" }, 502)
  try {
    return json({ criteria: JSON.parse(match[0]) })
  } catch {
    return json({ error: "unreadable_answer" }, 502)
  }
})
