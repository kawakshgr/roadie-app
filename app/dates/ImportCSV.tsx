'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Row = {
  numero: number; ville: string; salle: string; pays: string
  jour: string; horaires: Record<string, string>
}

export default function ImportCSV({ tourneeId }: { tourneeId: string }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function parse(text: string): Row[] {
    const lines = text.trim().split(/\r?\n/)
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    return lines.slice(1).filter((l) => l.trim()).map((line) => {
      const c = line.split(',').map((x) => x.trim())
      const get = (k: string) => c[headers.indexOf(k)] ?? ''
      return {
        numero: parseInt(get('numero')) || 0,
        ville: get('ville'),
        salle: get('salle'),
        pays: get('pays').toUpperCase(),
        jour: get('date'),
        horaires: {
          load: get('load_in'), soundcheck: get('soundcheck'),
          doors: get('doors'), set: get('set'), curfew: get('curfew'),
        },
      }
    })
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = (ev) => {
      const parsed = parse(String(ev.target?.result))
      setRows(parsed)
      setMsg(`${parsed.length} dates détectées`)
    }
    r.readAsText(f)
  }

  async function importer() {
    if (!rows.length) return
    setBusy(true)
    setMsg('Géocodage des villes…')

    const villes = [...new Set(rows.map((r) => `${r.ville}, ${r.pays}`))]
    let coords: Record<string, { lat: number; lng: number } | null> = {}
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { villes },
      })
      if (error) throw error
      coords = data.results
      console.log('villes envoyées:', villes)
      console.log('réponse data:', data)
      console.log('coords reçues:', coords)
    } catch (err) {
      console.log('erreur géocodage:', err)
      setMsg('Géocodage indisponible, import sans coordonnées…')
    }

    setMsg('Import en cours…')

    const payload = rows.map((r) => {
      const cle = `${r.ville}, ${r.pays}`
      const c = coords[cle]
      console.log(`clé "${cle}" →`, c)
      return {
        tournee_id: tourneeId,
        numero: r.numero,
        ville: r.ville,
        salle: r.salle,
        pays: r.pays,
        jour: r.jour,
        horaires: r.horaires,
        lat: c?.lat ?? null,
        lng: c?.lng ?? null,
      }
    })

    const { error } = await supabase.from('dates').insert(payload)
    setBusy(false)

    if (error) { setMsg('Erreur : ' + error.message); return }
    setMsg(`✓ ${rows.length} dates importées`)
    setRows([])
    router.refresh()
    setTimeout(() => setOpen(false), 1200)
  }

  return (
    <>
      <button className="import-btn glass" onClick={() => setOpen(true)}>
        ⬆ Importer un CSV
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Importer des dates</h2>
              <button className="modal-x" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label className="drop">
                <input type="file" accept=".csv" onChange={onFile} style={{ display: 'none' }} />
                <div style={{ fontSize: 30 }}>📄</div>
                <div style={{ fontWeight: 600, marginTop: 8 }}>Choisir un fichier CSV</div>
                <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginTop: 4 }}>
                  Colonnes : numero, ville, salle, pays, date, load_in, soundcheck, doors, set, curfew
                </div>
              </label>

              {rows.length > 0 && (
                <div className="preview">
                  {rows.slice(0, 6).map((r, i) => (
                    <div key={i} className="prow">
                      <b>{r.numero}</b> {r.ville} — {r.salle} · {r.jour}
                    </div>
                  ))}
                  {rows.length > 6 && (
                    <div className="prow" style={{ color: 'var(--ink-faint)' }}>
                      + {rows.length - 6} autres dates
                    </div>
                  )}
                </div>
              )}

              {msg && <p style={{ fontSize: 14, marginTop: 12 }}>{msg}</p>}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={importer} disabled={!rows.length || busy}>
                {busy ? 'Import…' : `Importer (${rows.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}