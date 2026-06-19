import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { email, groupe_id, role, mot_de_passe, nom, prenom } = await req.json()

    if (!email || !groupe_id || !role || !mot_de_passe) {
      return json({ error: 'Champs manquants' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')!
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Non authentifié' }, 401)

    const { data: membre } = await admin
      .from('membres')
      .select('role')
      .eq('groupe_id', groupe_id)
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: profilDemandeur } = await admin
      .from('profils')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle()

    const autorise = membre?.role === 'tm' || profilDemandeur?.is_super_admin === true
    if (!autorise) return json({ error: 'Non autorisé' }, 403)

    // 1. Créer le compte
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: mot_de_passe,
      email_confirm: true,
    })

    let userId: string

    if (createErr) {
      if (createErr.message.includes('already been registered') || createErr.message.includes('already exists')) {
        const { data: list } = await admin.auth.admin.listUsers()
        const existant = list.users.find((u) => u.email === email)
        if (!existant) return json({ error: 'Utilisateur existant introuvable' }, 400)
        userId = existant.id
      } else {
        console.error('Erreur createUser:', createErr)
        return json({ error: createErr.message }, 400)
      }
    } else {
      userId = created.user.id
    }

    // 2. Renseigner nom/prénom dans le profil (le trigger a créé la ligne)
    await admin
      .from('profils')
      .update({
        nom: nom?.trim() || null,
        prenom: prenom?.trim() || null,
      })
      .eq('id', userId)

    // 3. Rattacher au groupe
    const { error: membreErr } = await admin
      .from('membres')
      .insert({ groupe_id, user_id: userId, role })
    if (membreErr && !membreErr.message.includes('duplicate')) {
      console.error('Erreur rattachement membre:', membreErr)
      return json({ error: membreErr.message }, 400)
    }

    return json({ ok: true, email })
  } catch (e) {
    console.error('Exception:', e)
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}