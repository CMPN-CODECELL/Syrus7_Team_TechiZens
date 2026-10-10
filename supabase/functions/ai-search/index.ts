// Edge Function: ai-search
//
// Turns a plain-English request ("free online coding workshops this weekend") into structured filters.
// The app then runs those filters on its own data (src/lib/aiCriteria.js + src/lib/mockSearchParser.js findMatches),
// so the model never sees or invents opportunities, it only reads the question.
//
// Needs one secret (never put it in the app or in git):
//   npx supabase secrets set ANTHROPIC_API_KEY=... --project-ref <ref>
// Without it this function answers 503 "not_configured" and the app falls back to its rule-based search.
//
// Only signed-in students can call it (checked below), the request is size-limited, and each student gets a small
// hourly allowance, so the key cannot be drained by one account.

import { createClient } from "npm:@supabase/supabase-js@2"

const MODEL = "claude-haiku-5-5"
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  // 1. Who is asking? Only signed-in students.
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "")
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
  const { data: auth } = await supabase.auth.getUser(token)
  if (!auth?.user) return json({ error: "not_signed_in" }, 401)
  if (!allowed(auth.user.id)) return json({ error: "rate_limited" }, 429)

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!apiKey) return json({ error: "not_configured" }, 503)

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

  // 3. Ask the model.
  let reply: Response
  try {
    reply = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system, messages: [{ role: "user", content: query }] }),
    })
  } catch {
    return json({ error: "upstream_unreachable" }, 502)
  }
  if (!reply.ok) return json({ error: "upstream_error", status: reply.status }, 502)

  const data = await reply.json()
  const text: string = (data?.content ?? []).map((part: { text?: string }) => part.text ?? "").join("")
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return json({ error: "unreadable_answer" }, 502)
  try {
    return json({ criteria: JSON.parse(match[0]) })
  } catch {
    return json({ error: "unreadable_answer" }, 502)
  }
})
