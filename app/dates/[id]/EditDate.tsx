'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PaysSelect from '../PaysSelect'
import LieuAutocomplete from '../LieuAutocomplete'
import PlageHoraire from '../PlageHoraire'

type Chambre = { nombre: string; type: string; autre: string }

type DateData = {
  id: string
  ville: string
  salle: string | null
  pays: string | null
  adresse: string | null
  jour: string
  km_prochaine: number | null
  depart_hotel: string | null
  horaires: Record<string, any> | null
  hebergement: Record<string, any> | null
  remarques: string | null
}

const TYPES_CHAMBRE = ['Single', 'Twin', 'Double', 'Triple', 'Suite', 'Appartement', 'Autre']

// lit un horaire qui peut être une chaîne (ancien format) ou {debut, fin} (nouveau)
function lirePlage(v: any): { debut: string; fin: string } {
  if (v && typeof v === 'object') return { debut: v.debut ?? '', fin: v.fin ?? '' }
  if (typeof v === 'string') return { debut: v, fin: '' } // ancien format → on met l'heure en début
  return { debut: '', fin: '' }
}
function lireSimple(v: any): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') return v.debut ?? '' // au cas où
  return ''
}

export default function EditDate({ d }: { d: DateData }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const h = d.horaires ?? {}
  const heb = d.hebergement ?? {}

  const load = lirePlage(h.load)
  const sc = lirePlage(h.soundcheck)
  const setH = lirePlage(h.set)

  const chambresInit: Chambre[] = Array.isArray(heb.chambres) && heb.chambres.length
    ? heb.chambres.map((c: any) => {
        const estConnu = TYPES_CHAMBRE.includes(c.type)
        return {
          nombre: c.nombre != null ? String(c.nombre) : '',
          type: estConnu ? c.type : 'Autre',
          autre: estConnu ? '' : (c.type ?? ''),
        }
      })
    : [{ nombre: '', type: 'Single', autre: '' }]

  const [f, setF] = useState({
    recherche: '',
    ville: d.ville ?? '',
    salle: d.salle ?? '',
    pays: d.pays ?? '',
    adresse: d.adresse ?? '',
    jour: d.jour ?? '',
    km_prochaine: d.km_prochaine != null ? String(d.km_prochaine) : '',
    depart_hotel: d.depart_hotel ?? '',
    loadDebut: load.debut, loadFin: load.fin,
    scDebut: sc.debut, scFin: sc.fin,
    repas: lireSimple(h.repas),
    doors: lireSimple(h.doors),
    setDebut: setH.debut, setFin: setH.fin,
    curfew: lireSimple(h.curfew),
    bus_call: lireSimple(h.bus_call),
    remarques: d.remarques ?? '',
    hotelRecherche: '',
    hotel: heb.hotel ?? '',
    hotelAdresse: heb.adresse ?? '',
    reservation: heb.reservation ?? '',
    parkingVan: heb.parking_van === true,
    petitDej: heb.petit_dej === true,
    noteHotel: heb.note ?? '',
  })
  const [chambres, setChambres] = useState<Chambre[]>(chambresInit)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: any) {
    setF((cur) => ({ ...cur, [k]: v }))
  }
  function setChambre(i: number, k: keyof Chambre, v: string) {
    setChambres((cur) => cur.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)))
  }
  function ajouterChambre() {
    setChambres((cur) => [...cur, { nombre: '', type: 'Single', autre: '' }])
  }
  function retirerChambre(i: number) {
    setChambres((cur) => cur.filter((_, idx) => idx !== i))
  }

  async function enregistrer() {
    if (!f.ville.trim() || !f.jour) { setMsg('Ville et date obligatoires'); return }
    setBusy(true); setMsg('')

    const chambresJSON = chambres
      .filter((c) => c.nombre || c.type)
      .map((c) => ({
        nombre: c.nombre ? parseInt(c.nombre) : null,
        type: c.type === 'Autre' ? c.autre.trim() : c.type,
      }))
      .filter((c) => c.type)

    const maj: any = {
      ville: f.ville.trim(),
      salle: f.salle.trim() || null,
      pays: f.pays.trim().toUpperCase() || null,
      adresse: f.adresse.trim() || null,
      jour: f.jour,
      km_prochaine: f.km_prochaine ? parseInt(f.km_prochaine) : null,
      depart_hotel: f.depart_hotel.trim() || null,
      horaires: {
        load: { debut: f.loadDebut, fin: f.loadFin },
        soundcheck: { debut: f.scDebut, fin: f.scFin },
        repas: f.repas,
        doors: f.doors,
        set: { debut: f.setDebut, fin: f.setFin },
        curfew: f.curfew,
        bus_call: f.bus_call,
      },
      remarques: f.remarques.trim() || null,
      hebergement: {
        hotel: f.hotel.trim() || null,
        adresse: f.hotelAdresse.trim() || null,
        chambres: chambresJSON,
        reservation: f.reservation.trim() || null,
        parking_van: f.parkingVan,
        petit_dej: f.petitDej,
        note: f.noteHotel.trim() || null,
      },
    }
    if (coords) { maj.lat = coords.lat; maj.lng = coords.lng }

    const { error } = await supabase.from('dates').update(maj).eq('id', d.id)
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    setOpen(false)
    router.refresh()
  }

  const labelStyle = { fontSize: 12, color: 'var(--ink-dim)', fontWeight: 600, margin: '0 4px 6px' } as const
  const sectionStyle = { fontSize: 13, color: 'var(--ink-dim)', fontWeight: 600, margin: '16px 4px 8px' } as const
  const checkRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', cursor: 'pointer' } as const

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)} style={{ marginBottom: 8 }}>
        ✏️ Modifier la date
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Modifier la date</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={labelStyle}>Date du concert *</div>
              <input className="login-input" type="date" value={f.jour} onChange={(e) => set('jour', e.target.value)} />

              <div style={labelStyle}>Rechercher une salle ou une ville</div>
              <LieuAutocomplete
                valeur={f.recherche}
                onValeurChange={(v) => { set('recherche', v); setCoords(null) }}
                onSelect={(l) => {
                  setF((cur) => ({
                    ...cur,
                    recherche: l.salle || l.ville,
                    salle: l.salle || cur.salle,
                    ville: l.ville || cur.ville,
                    pays: l.pays || cur.pays,
                    adresse: l.adresse || cur.adresse,
                  }))
                  setCoords({ lat: l.lat, lng: l.lng })
                }}
              />
              <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '4px 4px 0' }}>
                Laisse vide pour garder le lieu actuel.
              </p>

              <div style={sectionStyle}>Détails du lieu</div>
              <div style={labelStyle}>Ville *</div>
              <input className="login-input" placeholder="Ex : Paris" value={f.ville} onChange={(e) => set('ville', e.target.value)} />
              <div style={labelStyle}>Salle</div>
              <input className="login-input" placeholder="Ex : Olympia" value={f.salle} onChange={(e) => set('salle', e.target.value)} />
              <div style={labelStyle}>Adresse</div>
              <input className="login-input" placeholder="Adresse de la salle" value={f.adresse} onChange={(e) => set('adresse', e.target.value)} />
              <div style={labelStyle}>Pays</div>
              <PaysSelect value={f.pays} onChange={(code) => set('pays', code)} />

              <div style={sectionStyle}>Horaires</div>
              <PlageHoraire label="Load-in" debut={f.loadDebut} fin={f.loadFin} onDebut={(v) => set('loadDebut', v)} onFin={(v) => set('loadFin', v)} />
              <PlageHoraire label="Soundcheck" debut={f.scDebut} fin={f.scFin} onDebut={(v) => set('scDebut', v)} onFin={(v) => set('scFin', v)} />
              <PlageHoraire label="Set" debut={f.setDebut} fin={f.setFin} onDebut={(v) => set('setDebut', v)} onFin={(v) => set('setFin', v)} />
              <div className="add-times">
                <div><div style={labelStyle}>Repas</div><input className="login-input" type="time" value={f.repas} onChange={(e) => set('repas', e.target.value)} /></div>
                <div><div style={labelStyle}>Doors</div><input className="login-input" type="time" value={f.doors} onChange={(e) => set('doors', e.target.value)} /></div>
                <div><div style={labelStyle}>Curfew</div><input className="login-input" type="time" value={f.curfew} onChange={(e) => set('curfew', e.target.value)} /></div>
                <div><div style={labelStyle}>Bus call</div><input className="login-input" type="time" value={f.bus_call} onChange={(e) => set('bus_call', e.target.value)} /></div>
              </div>

              <div style={sectionStyle}>Remarques</div>
              <textarea
                className="login-input"
                placeholder="Particularités du jour (ex : Pas de VP ce soir, catering végétarien…)"
                value={f.remarques}
                onChange={(e) => set('remarques', e.target.value)}
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />

              <div style={sectionStyle}>Hébergement</div>
              <div style={labelStyle}>Rechercher un hôtel</div>
              <LieuAutocomplete
                valeur={f.hotelRecherche}
                onValeurChange={(v) => set('hotelRecherche', v)}
                onSelect={(l) => {
                  setF((cur) => ({
                    ...cur,
                    hotelRecherche: l.salle || l.ville,
                    hotel: l.salle || cur.hotel,
                    hotelAdresse: l.adresse || cur.hotelAdresse,
                  }))
                }}
              />
              <div style={labelStyle}>Nom de l'hôtel</div>
              <input className="login-input" placeholder="Ex : Ibis Centre" value={f.hotel} onChange={(e) => set('hotel', e.target.value)} />
              <div style={labelStyle}>Adresse de l'hôtel</div>
              <input className="login-input" placeholder="Adresse" value={f.hotelAdresse} onChange={(e) => set('hotelAdresse', e.target.value)} />

              <div style={labelStyle}>Chambres</div>
              {chambres.map((c, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="login-input"
                      type="number"
                      placeholder="Nb"
                      value={c.nombre}
                      onChange={(e) => setChambre(i, 'nombre', e.target.value)}
                      style={{ width: 70, flexShrink: 0, marginBottom: 0 }}
                    />
                    <select
                      className="login-input"
                      value={c.type}
                      onChange={(e) => setChambre(i, 'type', e.target.value)}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      {TYPES_CHAMBRE.map((t) => (
                        <option key={t} value={t}>{t === 'Autre' ? 'Autre…' : t}</option>
                      ))}
                    </select>
                    {chambres.length > 1 && (
                      <button className="membre-remove" onClick={() => retirerChambre(i)} type="button" style={{ flexShrink: 0 }}>×</button>
                    )}
                  </div>
                  {c.type === 'Autre' && (
                    <input
                      className="login-input"
                      placeholder="Précise le type (ex : Appartement entier, Loge…)"
                      value={c.autre}
                      onChange={(e) => setChambre(i, 'autre', e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              ))}
              <button className="btn-ghost" onClick={ajouterChambre} type="button" style={{ marginBottom: 4 }}>
                + Ajouter un type de chambre
              </button>

              <div style={labelStyle}>N° de réservation</div>
              <input className="login-input" placeholder="Référence de réservation" value={f.reservation} onChange={(e) => set('reservation', e.target.value)} />

              <label style={checkRow}>
                <input type="checkbox" checked={f.parkingVan} onChange={(e) => set('parkingVan', e.target.checked)} style={{ width: 18, height: 18 }} />
                <span>Parking van disponible</span>
              </label>
              <label style={checkRow}>
                <input type="checkbox" checked={f.petitDej} onChange={(e) => set('petitDej', e.target.checked)} style={{ width: 18, height: 18 }} />
                <span>Petit-déjeuner inclus</span>
              </label>

              <div style={labelStyle}>Note (early check-in, etc.)</div>
              <input className="login-input" placeholder="Note libre" value={f.noteHotel} onChange={(e) => set('noteHotel', e.target.value)} />

              <div style={sectionStyle}>Transport commun</div>
              <div className="add-times">
                <div><div style={labelStyle}>Départ hôtel</div><input className="login-input" type="time" value={f.depart_hotel} onChange={(e) => set('depart_hotel', e.target.value)} /></div>
                <div><div style={labelStyle}>Km prochaine date</div><input className="login-input" type="number" placeholder="Ex : 320" value={f.km_prochaine} onChange={(e) => set('km_prochaine', e.target.value)} /></div>
              </div>

              {msg && <p style={{ fontSize: 14, marginTop: 12, color: 'var(--red)' }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={enregistrer} disabled={busy}>
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}