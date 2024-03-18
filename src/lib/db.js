
import { createClient } from '@supabase/supabase-js'
import {PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLIC_KEY } from '$env/static/public'


const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLIC_KEY

)

export default supabase