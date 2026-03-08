import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const IS_DB_CONFIGURED = !!(url && key && !url.includes('your-project'))
export const supabase = IS_DB_CONFIGURED ? createClient(url, key) : null
export const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'
