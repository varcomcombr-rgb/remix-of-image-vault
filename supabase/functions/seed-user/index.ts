import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const exists = existingUsers?.users?.some(u => u.email === 'radash@varcom.com.br')

  if (exists) {
    return new Response(JSON.stringify({ message: 'User already exists' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'radash@varcom.com.br',
    password: 'radash@123',
    email_confirm: true,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ message: 'User created', user: data.user?.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})