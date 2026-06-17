'use client'
import dynamic from 'next/dynamic'

const TourMap = dynamic(() => import('./TourMap'), {
  ssr: false,
  loading: () => <div className="glass" style={{ height: 420, borderRadius: 18 }} />,
})

export default function MapSection({ dates }: { dates: any[] }) {
  return <TourMap dates={dates} />
}