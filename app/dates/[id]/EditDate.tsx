'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PaysSelect from '../PaysSelect'
import LieuAutocomplete from '../LieuAutocomplete'

type DateData = {
  id: string
  ville: string
  salle: string | null
  pays: string | null
  adresse: string | null
  jour: string
  km_prochaine: number | null
  depart_hotel: string | null
  horaires: Record<string, string> | null
  hebergement: Record<string, any> | null
}

export default function EditDate({ d }: { d: DateData }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const h = d.horaires ?? {}
  const heb = d.hebergement ?? {}
  const [f, setF] = useState({
    recherche: '',
    ville: d.ville ?? '',
    salle: d.salle ?? '',
    pays: d.pays ?? '',
    adresse: d.adresse ?? '',
    jour: d.jour ?? '',
    km_prochaine: d.km_prochaine != null ? String(d.km_prochaine) : '',
    depart_hotel: d.depart_hotel ?? '',
    load: h.load ?? '',
    soundcheck: h.soundcheck ?? '',
    doors: h.doors ?? '',
    set: h.set ?? '',
    curfew: h.curfew ?? '',
    // hébergement
    hotelRecherche: '',
    hotel: heb.hotel ?? '',
    hotelAdresse: heb.adresse ?? '',
    nbChambres: heb.nb_chambres != null ? String(heb.nb_chambres) : '',
    typeChambre: heb.type_chambre ?? '',
    reservation: heb.reservation ?? '',
    parkingVan: heb.parking_van === true,
    petitDej: heb.petit_dej === true,
    noteHotel: heb.note ?? '',
  })
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  function set(k: string, v: any) {
    setF((cur) => ({ ...cur, [k]: v }))
  }

  async function enregistrer() {
    if (!f.ville.trim() || !f.jour) { setMsg('Ville et date obligatoires'); return }
    setBusy(true); setMsg('')

    const maj: any = {
      ville: f.ville.trim(),
      salle: f.salle.trim() || null,
      pays: f.pays.trim().toUpperCase() || null,
      adresse: f.adresse.trim() || null,
      jour: f.jour,
      km_prochaine: f.km_prochaine ? parseInt(f.km_prochaine) : null,
      depart_hotel: f.depart_hotel.trim() || null,
      horaires: {
        load: f.load, soundcheck: f.soundcheck,
        doors: f.doors, set: f.set, curfew: f.curfew,
      },
      hebergement: {
        hotel: f.hotel.trim() || null,
        adresse: f.hotelAdresse.trim() || null,
        nb_chambres: f.nbChambres ? parseInt(f.nbChambres) : null,
        type_chambre: f.typeChambre.trim() || null,
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
              <div className="add-times">
                <div><div style={labelStyle}>Load-in</div><input className="login-input" type="time" value={f.load} onChange={(e) => set('load', e.target.value)} /></div>
                <div><div style={labelStyle}>Soundcheck</div><input className="login-input" type="time" value={f.soundcheck} onChange={(e) => set('soundcheck', e.target.value)} /></div>
                <div><div style={labelStyle}>Doors</div><input className="login-input" type="time" value={f.doors} onChange={(e) => set('doors', e.target.value)} /></div>
                <div><div style={labelStyle}>Set</div><input className="login-input" type="time" value={f.set} onChange={(e) => set('set', e.target.value)} /></div>
                <div><div style={labelStyle}>Curfew</div><input className="login-input" type="time" value={f.curfew} onChange={(e) => set('curfew', e.target.value)} /></div>
              </div>

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
              <div className="add-times">
                <div><div style={labelStyle}>Nombre de chambres</div><input className="login-input" type="number" placeholder="Ex : 5" value={f.nbChambres} onChange={(e) => set('nbChambres', e.target.value)} /></div>
                <div><div style={labelStyle}>Type de chambre</div><input className="login-input" placeholder="Ex : Twin, Single" value={f.typeChambre} onChange={(e) => set('typeChambre', e.target.value)} /></div>
              </div>
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