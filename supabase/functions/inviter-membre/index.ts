import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json()

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

    // ====== Action : reset de mot de passe par un TM ======
    if (body.action === 'reset_membre') {
      const { user_id, groupe_id } = body
      if (!user_id || !groupe_id) return json({ error: 'Champs manquants' }, 400)

      const { data: moi } = await admin
        .from('membres').select('role')
        .eq('groupe_id', groupe_id).eq('user_id', user.id).maybeSingle()
      const { data: profilMoi } = await admin
        .from('profils').select('is_super_admin').eq('id', user.id).maybeSingle()
      const estTM = moi?.role === 'tm'
      const estSuperAdmin = profilMoi?.is_super_admin === true
      if (!estTM && !estSuperAdmin) return json({ error: 'Non autorisé' }, 403)

      const { data: ciblesRows } = await admin
        .from('membres').select('role')
        .eq('groupe_id', groupe_id).eq('user_id', user_id)
      const cible = ciblesRows?.[0]
      if (!cible) return json({ error: "Ce membre n'appartient pas au groupe" }, 400)
      if (cible.role === 'tm' && !estSuperAdmin) {
        return json({ error: "Tu ne peux pas réinitialiser le mot de passe d'un TM" }, 403)
      }

      const nouveau = genererMdp()
      const { error: upErr } = await admin.auth.admin.updateUserById(user_id, { password: nouveau })
      if (upErr) return json({ error: upErr.message }, 400)

      return json({ ok: true, mot_de_passe: nouveau })
    }
    // ====== fin action reset ======

    // ====== Action par défaut : ajouter / créer un membre ======
    const { email, groupe_id, role, mot_de_passe, nom, prenom } = body

    if (!email || !groupe_id || !role) {
      return json({ error: 'Champs manquants' }, 400)
    }

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
      userId = existant.id
    } else {
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

    // Garantir que le profil existe (compte orphelin possible), puis nom/prénom
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