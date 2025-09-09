import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 })
  }

  try {
    // Create a Supabase client with the user's authorization to check their role
    const userSupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })
    const { data: { user } } = await userSupabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if the calling user is an admin
    const { data: isAdmin, error: roleError } = await userSupabaseClient.rpc('has_role', {
      p_user_id: user.id,
      p_role: 'admin',
    })
    if (roleError) throw roleError
    if (!isAdmin) throw new Error('Forbidden: Admins only')

    // If the check passes, create a Supabase admin client to create the new user
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { email, password, role } = await req.json()
    if (!email || !password || !role) throw new Error('Email, password, and role are required')

    // Create the user in auth.users
    const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) throw createError
    if (!newUser) throw new Error('Failed to create user')

    // The `handle_new_user` trigger already assigned the default 'user' role.
    // If the specified role is 'admin', update it.
    if (role === 'admin') {
      const { error: updateError } = await supabaseAdmin.rpc('update_user_role', {
        p_user_id: newUser.id,
        p_new_role: role,
      })
      if (updateError) throw updateError
    }

    return new Response(JSON.stringify({ user: newUser }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
