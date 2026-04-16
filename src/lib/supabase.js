import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkwobvnkvtkltbrdblvo.supabase.co'
const supabaseAnonKey = 'sb_publishable_5Wtoj4NLD-Fwog6V_bKUzA_lzYVpIdJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
