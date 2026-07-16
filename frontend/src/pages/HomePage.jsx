import { Link } from 'react-router-dom'
import HallCard from '../components/HallCard'

function HomePage({ halls, user, role }) {
  return (
    <>
      <main>
        <section className="hero-section">
          <div className="hero-pill"><span className="hero-pill-dot" /> CAMPUS SPACE BOOKING PLATFORM</div>
          <h1 className="hero-title">
            Reserve Campus Halls<br />
            <span className="hero-title-blue">Instantly &amp; Effortlessly</span>
          </h1>
          <p className="hero-desc">
            A streamlined platform for scheduling seminar halls, auditoriums,<br />
            and academic event spaces — all from one place.
          </p>
          <div className="hero-cta">
            <a href="#catalog" className="btn btn-primary btn-hero">View Availability →</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">{halls.length}+</span>
              <span className="hero-stat-label">SPACES</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">24/7</span>
              <span className="hero-stat-label">ONLINE BOOKING</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">Fast</span>
              <span className="hero-stat-label">APPROVALS</span>
            </div>
          </div>
        </section>

        <section id="catalog" className="catalog-section">
          <h2 className="catalog-heading">Available Spaces</h2>
          <p className="catalog-sub">Browse and reserve campus venues for your next event</p>
          <div className="hall-grid">
            {halls.map((hall) => (
              <HallCard key={hall.id} hall={hall} />
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-brand">Campus Space Reservation</div>
              <p className="footer-tagline"><em>Simplifying academic space management, one booking at a time.</em></p>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/spaces" className="footer-link">Browse Spaces</Link>
              <Link to="/login" className="footer-link">Login</Link>
              <Link to="/register" className="footer-link">Register</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-heading">Support</h4>
              <a href="mailto:support@campus.edu" className="footer-link">support@campus.edu</a>
              <span className="footer-info">Mon – Fri, 9:00 AM – 5:00 PM</span>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">&copy; {new Date().getFullYear()} Campus Space Reservation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default HomePage
