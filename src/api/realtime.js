// Live updates (POC "Realtime listeners"): calls `onChange` when rows change in the given tables.
// Row Level Security applies, so a student is only told about changes they are allowed to see.
// Returns a function that stops listening. Does nothing without a real sign-in.

import { isDemoLogin } from "@/api/auth"
import { supabase } from "@/lib/supabase"

const DEBOUNCE_MS = 300

export function subscribeToChanges(tables, onChange) {
  if (isDemoLogin) return () => {}

  let timer = null
  const notify = () => {
    clearTimeout(timer)
    timer = setTimeout(onChange, DEBOUNCE_MS) // several changes at once (for example a delete that cascades) refresh once
  }

  const channel = supabase.channel(`nexus-${tables.join("-")}-${Math.random().toString(36).slice(2)}`)
  for (const table of tables) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, notify)
  }
  channel.subscribe()

  return () => {
    clearTimeout(timer)
    supabase.removeChannel(channel)
  }
}
