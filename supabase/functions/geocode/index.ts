import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { villes } = await req.json() as { villes: string[] }
    const results: Record<string, { lat: number; lng: number } | null> = {}

    for (const ville of villes) {
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(ville)}&format=json&limit=1`
      const r = await fetch(url, {
        headers: { 'User-Agent': 'RoadieApp/1.0 (contact@exemple.com)' },
      })
      const data = await r.json()
      results[ville] = data[0]
        ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        : null
      await new Promise((res) => setTimeout(res, 1100))
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})