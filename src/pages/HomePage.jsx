import { Link } from 'react-router-dom'
import HallCard from '../components/HallCard'

function HomePage({ halls }) {
  return (
    <main>
      <section className="hero-section">
        <h1 className="hero-title">
          A streamlined platform for scheduling halls, seminars, and academic events with ease.
        </h1>
        {/* <div className="hero-cta">
          <Link to="/register" className="btn btn-light btn-hero">
        
          </Link>
          <Link to="/login" className="btn btn-primary btn-hero">
           
          </Link>
        </div> */}
        <div style={{ marginTop: '16px' }}>
          <a href="#catalog" className="btn btn-primary btn-hero">
            Access Catalog -&gt;
          </a>
        </div>
      </section>

      <section id="catalog" className="catalog-section">
        <div className="hall-grid">
          {halls.map((hall) => (
            <HallCard key={hall.id} hall={hall} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default HomePage
