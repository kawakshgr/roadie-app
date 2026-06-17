import Link from 'next/link'

export default function TourneeNotFound() {
  return (
    <div className="wrap">
      <div className="empty-state glass">
        <div className="empty-icon">🗺</div>
        <h2 className="empty-title">Tournée introuvable</h2>
        <p className="empty-text">
          Cette tournée n'existe pas ou a été supprimée.
        </p>
        <Link href="/groupes" className="empty-btn">
          Retour à mes groupes
        </Link>
      </div>
    </div>
  )
}