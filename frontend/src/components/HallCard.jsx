import { Link } from 'react-router-dom'

function HallCard({ hall }) {
  return (
    <article className="hall-card">
      <div className="card-media-wrap">
        <img src={hall.image} alt={hall.name} className="card-media" loading="lazy" />
        <span className="capacity-badge">Capacity: {hall.capacity}</span>
      </div>

      <div className="card-content">
        <span className="status-badge">
          <span className="status-dot"></span>ACTIVE
        </span>

        <h3 className="hall-title">{hall.name}</h3>
        <p className="hall-description">{hall.description}</p>

        <div className="feature-list">
          {hall.features.map((feature) => (
            <span key={feature} className="feature-tag">{feature}</span>
          ))}
        </div>

        <div className="card-actions">
          <Link to={`/halls/${hall.id}`} className="btn btn-light">View Details</Link>
          <Link to={`/reserve/${hall.id}`} className="btn btn-primary">Reserve</Link>
        </div>
      </div>
    </article>
  )
}

export default HallCard
