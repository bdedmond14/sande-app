import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkwobvnkvtkltbrdblvo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrd29idm5rdnRrbHRicmRibHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MzUwOTAsImV4cCI6MjA5MDYyNTQyN30.O5UUlMKKo-9F6g1B_6oFdoNT2-tlNfjJJ8F0ei2YSQ0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
