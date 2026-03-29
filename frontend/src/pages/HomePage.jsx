import { Link } from 'react-router-dom'
import HallCard from '../components/HallCard'

function HomePage({ halls, user, role }) {
  return (
    <main>
      <section className="hero-section">
        <h1 className="hero-title">
          A streamlined platform for scheduling halls, seminars, and academic events with ease.
        </h1>
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
