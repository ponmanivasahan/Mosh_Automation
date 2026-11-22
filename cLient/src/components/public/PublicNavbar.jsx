import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Menu, 
  X, 
  Package, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import './PublicNavbar.css';

const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const location = useLocation();
  const { session } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const solutions = [
    { name: 'Automatic Water Level Controllers', path: '/solutions/automatic-water-level-controllers' },
    { name: 'Water Tank Automation', path: '/solutions/water-tank-automation' },
    { name: 'Automatic Motor Controllers', path: '/solutions/automatic-motor-controllers' },
    { name: 'Water Level Monitoring Systems', path: '/solutions/water-level-monitoring-systems' },
    { name: 'Smart Water Management Solutions', path: '/solutions/smart-water-management-solutions' }
  ];

  return (
    <header className="public-navbar-root">
      <div className="public-navbar-container">
        
        {/* Brand Logo */}
        <Link to="/" className="public-brand-link" aria-label="MOSH Automation Homepage">
          <div className="public-brand-logo-card">
            <img src="/mosh-logo-badge.png" alt="MOSH Logo" className="public-brand-logo-img" />
          </div>
          <div className="public-brand-text">
            <span className="public-brand-name">
              <span className="navy">MOSH </span>
              <span className="red">AUTOMATION</span>
            </span>
            <span className="public-brand-tagline">Intelligent Water Management</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="public-nav-desktop" aria-label="Primary Navigation">
          <Link to="/" className={`public-nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>

          <Link to="/products" className={`public-nav-link ${isActive('/products') ? 'active' : ''}`}>
            Products
          </Link>

          {/* Solutions Dropdown */}
          <div 
            className="solutions-dropdown-wrapper"
            onMouseEnter={() => setSolutionsDropdownOpen(true)}
            onMouseLeave={() => setSolutionsDropdownOpen(false)}
          >
            <button 
              type="button"
              className={`public-nav-link dropdown-toggle ${isActive('/solutions') ? 'active' : ''}`}
              aria-expanded={solutionsDropdownOpen}
            >
              <span>Solutions</span>
              <ChevronDown size={14} className={`chevron-arrow ${solutionsDropdownOpen ? 'rotated' : ''}`} />
            </button>

            {solutionsDropdownOpen && (
              <div className="solutions-dropdown-menu">
                {solutions.map((sol) => (
                  <Link 
                    key={sol.path} 
                    to={sol.path}
                    className="dropdown-item"
                    onClick={() => setSolutionsDropdownOpen(false)}
                  >
                    <ShieldCheck size={14} className="dropdown-item-icon" />
                    <span>{sol.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/blog" className={`public-nav-link ${isActive('/blog') ? 'active' : ''}`}>
            Knowledge Base
          </Link>
        </nav>

        {/* Right Action: Portal Access */}
        <div className="public-nav-actions">
          {session ? (
            <Link 
              to={session.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard'}
              className="public-portal-btn portal-active"
            >
              <User size={15} />
              <span>{session.role === 'admin' ? 'Admin Portal' : 'My Dashboard'}</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/login" className="public-portal-btn">
              <User size={15} />
              <span>Portal Login</span>
              <ArrowRight size={14} />
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button 
            type="button" 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-links">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Product Catalog
            </Link>

            <div className="mobile-section-header">Water Automation Solutions</div>
            {solutions.map((sol) => (
              <Link 
                key={sol.path} 
                to={sol.path}
                className="mobile-sub-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {sol.name}
              </Link>
            ))}

            <Link 
              to="/blog" 
              className={`mobile-nav-link ${isActive('/blog') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Educational Articles & Guides
            </Link>

            <div className="mobile-portal-wrap">
              <Link 
                to={session ? (session.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard') : '/login'} 
                className="mobile-portal-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={16} />
                <span>{session ? 'Enter Portal Dashboard' : 'Sign In to Portal'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
