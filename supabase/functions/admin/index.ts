import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --- Vérification super-admin (barrière de sécurité) ---
    const authHeader = req.headers.get('Authorization')!
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Non authentifié' }, 401)

    const { data: profil } = await admin
      .from('profils')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (profil?.is_super_admin !== true) {
      return json({ error: 'Accès réservé au super-admin' }, 403)
    }

    // --- Routage des actions ---
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'list': {
        // tous les utilisateurs (en bouclant sur toutes les pages)
        const tousUsers: any[] = []
        let page = 1
        while (true) {
          const { data: pageData, error: pageErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
          if (pageErr) return json({ error: pageErr.message }, 400)
          const users = pageData?.users ?? []
          tousUsers.push(...users)
          if (users.length < 1000) break  // dernière page atteinte
          page++
        }
        const list = { users: tousUsers }

        const { data: profils } = await admin.from('profils').select('*')
        const { data: membres } = await admin
          .from('membres')
          .select('id, role, groupe_id, user_id, groupes(nom)')

        const users = (list?.users ?? []).map((u) => {
          const p = profils?.find((x) => x.id === u.id)
          const apps = (membres ?? [])
            .filter((m) => m.user_id === u.id)
            .map((m: any) => ({
              membre_id: m.id,
              groupe_id: m.groupe_id,
              groupe_nom: m.groupes?.nom ?? '?',
              role: m.role,
            }))
          return {
            id: u.id,
            email: u.email,
            pseudo: p?.pseudo ?? null,
            prenom: p?.prenom ?? null,
            nom: p?.nom ?? null,
            is_super_admin: p?.is_super_admin ?? false,
            cree_le: u.created_at,
            appartenances: apps,
          }
        })
        return json({ ok: true, users })
      }

      case 'create': {
        const { email, mot_de_passe, prenom, nom } = body
        if (!email) return json({ error: 'Email requis' }, 400)
        const mdp = mot_de_passe?.trim() || genererMdp()
        const { data: created, error } = await admin.auth.admin.createUser({
          email, password: mdp, email_confirm: true,
        })
        if (error || !created) return json({ error: error?.message ?? 'Échec' }, 400)
        await admin.from('profils').update({
          prenom: prenom?.trim() || null,
          nom: nom?.trim() || null,
        }).eq('id', created.user.id)
        return json({ ok: true, email, mot_de_passe: mdp })
      }

      case 'delete': {
        const { user_id } = body
        if (!user_id) return json({ error: 'user_id requis' }, 400)
        if (user_id === user.id) return json({ error: 'Tu ne peux pas te supprimer toi-même' }, 400)
        const { error } = await admin.auth.admin.deleteUser(user_id)
        if (error) return json({ error: error.message }, 400)
        return json({ ok: true })
      }

      case 'reset_password': {
        const { user_id, mot_de_passe } = body
        if (!user_id) return json({ error: 'user_id requis' }, 400)
        const mdp = mot_de_passe?.trim() || genererMdp()
        const { error } = await admin.auth.admin.updateUserById(user_id, { password: mdp })
        if (error) return json({ error: error.message }, 400)
        return json({ ok: true, mot_de_passe: mdp })
      }

      case 'add_membre': {
        const { user_id, groupe_id, role } = body
        if (!user_id || !groupe_id || !role) return json({ error: 'Champs manquants' }, 400)
        const { error } = await admin.from('membres').insert({ user_id, groupe_id, role })
        if (error && !error.message.includes('duplicate')) return json({ error: error.message }, 400)
        return json({ ok: true })
      }

      case 'update_role': {
        const { membre_id, role } = body
        if (!membre_id || !role) return json({ error: 'Champs manquants' }, 400)
        const { error } = await admin.from('membres').update({ role }).eq('id', membre_id)
        if (error) return json({ error: error.message }, 400)
        return json({ ok: true })
      }

      case 'remove_membre': {
        const { membre_id } = body
        if (!membre_id) return json({ error: 'membre_id requis' }, 400)
        const { error } = await admin.from('membres').delete().eq('id', membre_id)
        if (error) return json({ error: error.message }, 400)
        return json({ ok: true })
      }

      default:
        return json({ error: 'Action inconnue' }, 400)
    }
  } catch (e) {
    console.error('Exception admin:', e)
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