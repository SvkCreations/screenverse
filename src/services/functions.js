import { supabase } from './supabase.js'

// Calls a Supabase Edge Function and turns any failure into a readable Error message.
export async function invokeFn(name, body) {
  if (!supabase) throw new Error('Supabase is not configured. Check your .env file.')
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let msg = error.message
    try {
      const b = await error.context.json() // our functions reply { error: "..." }
      if (b?.error) msg = b.error
    } catch {
      // keep the generic message
    }
    throw new Error(msg || 'Request failed.')
  }
  if (!data || typeof data !== 'object') throw new Error('Empty response from server.')
  if (data.error) throw new Error(data.error)
  return data
}
