import { Link, useParams } from 'react-router-dom'

function HallDetailsPage({ halls }) {
  const { hallId } = useParams()
  const hall = halls.find((item) => item.id === hallId)

  if (!hall) {
    return (
      <main className="subpage">
        <div className="detail-card">
          <div className="detail-content">
            <h1 className="detail-title">Hall not found</h1>
            <p className="detail-copy">The selected hall does not exist in the current catalog.</p>
            <div className="detail-actions">
              <Link to="/" className="btn btn-primary">
                Back to Catalog
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="subpage">
      <article className="detail-card">
        <img src={hall.image} alt={hall.name} className="detail-image" />
        <div className="detail-content">
          <span className="status-badge">ACTIVE</span>
          <h1 className="detail-title">{hall.name}</h1>
          <p className="detail-copy">{hall.description}</p>
          <p className="detail-meta">Capacity: {hall.capacity}</p>
          <div className="feature-list">
            {hall.features.map((feature) => (
              <span key={feature} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
          <div className="detail-actions">
            <Link to="/" className="btn btn-light">
              Back
            </Link>
            <Link to="/login" className="btn btn-primary">
              Reserve Now
            </Link>
          </div>
        </div>
      </article>
    </main>
  )
}

export default HallDetailsPage
