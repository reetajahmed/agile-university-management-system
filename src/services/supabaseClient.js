import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://cndoliiwygeenkibixpe.supabase.co"
const supabaseKey = "sb_publishable_MOJ6fVCbUzuEFjcPdHsoJA_919PU_B0"

export const supabase = createClient(supabaseUrl, supabaseKey)