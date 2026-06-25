'use client'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Pt = {
  id: string; numero: number | null; ville: string; salle: string
  jour: string; lat: number; lng: number
}

function statusOf(jour: string) {
  const today = '2026-07-14'
  return jour < today ? 'past' : jour === today ? 'today' : 'future'
}

const COLORS: Record<string, string> = {
  past: '#8e8e93',
  today: '#ff9f0a',
  future: '#0a84ff',
}

function pastille(label: string, status: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);background:${COLORS[status]};
      border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font-weight:700;
      font-size:13px;font-family:Inter,sans-serif;">${label}</span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  })
}

export default function TourMap({ dates }: { dates: Pt[] }) {
  const pts = dates.filter((d) => d.lat && d.lng)
  const center: [number, number] = pts.length ? [pts[0].lat, pts[0].lng] : [48.5, 6]

  return (
    <MapContainer center={center} zoom={5} style={{ height: 420, borderRadius: 18 }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {pts.map((d, i) => {
        const label = d.numero != null ? String(d.numero) : d.ville.charAt(0).toUpperCase()
        return (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={pastille(label, statusOf(d.jour))}>
            <Popup>{d.numero != null ? `${d.numero}. ` : ''}{d.ville} — {d.salle}</Popup>
          </Marker>
        )
      })}
      <Polyline
        positions={pts.map((d) => [d.lat, d.lng] as [number, number])}
        pathOptions={{ color: '#0a84ff', dashArray: '7 7' }}
      />
    </MapContainer>
  )
}