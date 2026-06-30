// Calcule la durée entre deux heures "HH:MM" en minutes (gère le passage minuit)
export function dureeMinutes(debut?: string, fin?: string): number | null {
  if (!debut || !fin) return null
  const [hd, md] = debut.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  if ([hd, md, hf, mf].some((n) => isNaN(n))) return null
  let mins = (hf * 60 + mf) - (hd * 60 + md)
  if (mins < 0) mins += 24 * 60 // fin après minuit
  return mins
}

// Formate une durée en "1h30" ou "45 min"
export function formatDuree(mins: number | null): string {
  if (mins == null || mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}