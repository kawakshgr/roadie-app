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

    if (!email || !groupe_id || !role) {
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

    // Qui fait la demande ?
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Non authentifié' }, 401)

    // Autorisé ? (TM du groupe ou super-admin)
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

    // Le compte existe-t-il déjà ?
    const { data: list, error: listErr } = await admin.auth.admin.listUsers()
    if (listErr) return json({ error: 'listUsers: ' + listErr.message }, 400)

    const existant = list.users.find((u) => u.email === email)

    let userId: string
    let estNouveau = false
    let mdpGenere = ''

    if (existant) {
      // compte existant : on le rattache
      userId = existant.id
    } else {
      // nouveau compte : mot de passe fourni ou généré
      mdpGenere = mot_de_passe?.trim() || genererMdp()
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: mdpGenere,
        email_confirm: true,
      })
      if (createErr || !created) {
        return json({ error: createErr?.message ?? 'Création échouée' }, 400)
      }
      userId = created.user.id
      estNouveau = true
    }

    // Garantir que le profil existe (le compte peut être orphelin),
    // puis renseigner nom/prénom si fournis.
    await admin.from('profils').upsert(
      { id: userId, email },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    if (nom?.trim() || prenom?.trim()) {
      await admin
        .from('profils')
        .update({
          nom: nom?.trim() || null,
          prenom: prenom?.trim() || null,
        })
        .eq('id', userId)
    }

    // Rattacher au groupe
    const { error: membreErr } = await admin
      .from('membres')
      .insert({ groupe_id, user_id: userId, role })
    if (membreErr && !membreErr.message.includes('duplicate')) {
      return json({ error: membreErr.message }, 400)
    }

    return json({
      ok: true,
      email,
      estNouveau,
      mot_de_passe: estNouveau ? mdpGenere : null,
    })
  } catch (e) {
    console.error('Exception:', e)
    return json({ error: String(e) }, 500)
  }
})

function genererMdp() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let p = ''
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}