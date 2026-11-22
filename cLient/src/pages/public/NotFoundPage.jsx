import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Package, ArrowRight, HelpCircle } from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { setSEO } from '../../utils/seoHelper';
import './NotFoundPage.css';

const NotFoundPage = () => {
  useEffect(() => {
    setSEO({
      title: 'Page Not Found (404) | MOSH Automation',
      description: 'The requested page could not be found on MOSH Automation. Browse our automatic water level controllers, solutions, or visit the homepage.',
      canonical: 'https://moshautomation.com/404',
      noindex: true
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main className="not-found-main">
        <div className="home-section-container">
          <div className="not-found-card">
            <span className="not-found-code">404</span>
            <h1 className="not-found-title">Page Not Found</h1>
            <p className="not-found-desc">
              The page you are looking for may have been moved, renamed, or is temporarily unavailable.
            </p>

            <div className="not-found-actions">
              <Link to="/" className="home-cta-primary">
                <Home size={16} />
                <span>Return to Homepage</span>
              </Link>
              <Link to="/products" className="home-cta-secondary">
                <Package size={16} />
                <span>Browse Products</span>
              </Link>
            </div>

            <div className="not-found-suggestions">
              <h2 className="suggestions-title">Popular Water Automation Resources:</h2>
              <ul className="suggestions-list">
                <li>
                  <Link to="/solutions/automatic-water-level-controllers">
                    <span>Automatic Water Level Controllers Guide</span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
                <li>
                  <Link to="/solutions/water-tank-automation">
                    <span>Water Tank Automation & Overflow Prevention</span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
                <li>
                  <Link to="/blog/how-to-prevent-water-tank-overflow">
                    <span>How to Prevent Water Tank Overflow (Article)</span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
                <li>
                  <Link to="/login">
                    <span>Customer & Admin Portal Login</span>
                    <ArrowRight size={13} />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default NotFoundPage;
