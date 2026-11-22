import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Droplet
} from 'lucide-react';
import './PublicFooter.css';

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer-root">
      <div className="public-footer-container">
        
        {/* Top Callout Banner */}
        <div className="footer-callout-banner">
          <div className="callout-text-wrap">
            <div className="callout-badge">
              <Zap size={14} className="text-blue-500" />
              <span>Engineered in Coimbatore, India</span>
            </div>
            <h3 className="callout-title">Ready to Eliminate Tank Overflow & Dry-Run Damage?</h3>
            <p className="callout-desc">
              Get in touch with our technical engineering team for custom site assessments, residential controllers, or commercial multi-tank solutions.
            </p>
          </div>
          <div className="callout-action-wrap">
            <Link to="/login" className="callout-primary-btn">
              <span>Sign In to Portal</span>
              <ArrowRight size={15} />
            </Link>
            <a href="tel:+919514714441" className="callout-secondary-btn">
              <Phone size={15} />
              <span>+91 95147 14441</span>
            </a>
          </div>
        </div>

        {/* 4 Column Directory Grid */}
        <div className="footer-links-grid">
          
          {/* Column 1: Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="footer-logo-wrap">
                <img src="/mosh-logo-badge.png" alt="MOSH Logo" className="footer-logo-img" />
              </div>
              <div className="footer-brand-title">
                <span className="navy">MOSH </span>
                <span className="red">AUTOMATION</span>
              </div>
            </div>
            <p className="footer-brand-bio">
              Manufacturer of high-reliability Automatic Water Level Controllers, Wireless Tank Telemetry Systems, and Industrial Motor Protection Controllers.
            </p>
            <div className="footer-compliance-badges">
              <div className="compliance-pill">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>1 Year Warranty</span>
              </div>
              <div className="compliance-pill">
                <CheckCircle size={13} className="text-blue-500" />
                <span>Electrolysis-Free</span>
              </div>
            </div>
          </div>

          {/* Column 2: Water Automation Solutions */}
          <div className="footer-col">
            <h4 className="footer-col-title">Automation Solutions</h4>
            <ul className="footer-col-links">
              <li>
                <Link to="/solutions/automatic-water-level-controllers">Automatic Water Level Controllers</Link>
              </li>
              <li>
                <Link to="/solutions/water-tank-automation">Water Tank Automation Systems</Link>
              </li>
              <li>
                <Link to="/solutions/automatic-motor-controllers">Automatic Motor Controllers</Link>
              </li>
              <li>
                <Link to="/solutions/water-level-monitoring-systems">Water Level Monitoring Systems</Link>
              </li>
              <li>
                <Link to="/solutions/smart-water-management-solutions">Smart Water Management</Link>
              </li>
              <li>
                <Link to="/products">Browse All 14 Products</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Educational Guides */}
          <div className="footer-col">
            <h4 className="footer-col-title">Knowledge Base & Guides</h4>
            <ul className="footer-col-links">
              <li>
                <Link to="/blog/what-is-an-automatic-water-level-controller">What Is a Water Level Controller?</Link>
              </li>
              <li>
                <Link to="/blog/how-does-an-automatic-water-level-controller-work">Working Principle Explained</Link>
              </li>
              <li>
                <Link to="/blog/benefits-of-automatic-water-tank-motor-control">Benefits of Water Automation</Link>
              </li>
              <li>
                <Link to="/blog/how-to-prevent-water-tank-overflow">How to Prevent Tank Overflow</Link>
              </li>
              <li>
                <Link to="/blog/manual-vs-automatic-water-level-controller">Manual vs Automatic Controllers</Link>
              </li>
              <li>
                <Link to="/blog/how-to-choose-the-right-water-level-controller">How to Choose the Right Model</Link>
              </li>
              <li>
                <Link to="/blog/importance-of-water-level-monitoring-systems">Importance of Tank Monitoring</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="footer-col contact-col">
            <h4 className="footer-col-title">Factory & Support</h4>
            <div className="footer-contact-items">
              <div className="contact-item">
                <MapPin size={16} className="contact-icon" />
                <span>
                  162 ABC-164, Andal Complex, Kamarajar Road, Varadharajapuram, Uppilipalayam, Coimbatore - 641015, Tamil Nadu
                </span>
              </div>
              <div className="contact-item">
                <MapPin size={16} className="contact-icon" />
                <span>
                  10/9, Kaleeswara Mill Rd, Coimbatore - 641009, TN (Star Lodge)
                </span>
              </div>
              <div className="contact-item">
                <Phone size={15} className="contact-icon" />
                <a href="tel:+919514714441">+91 95147 14441</a>
              </div>
              <div className="contact-item">
                <Mail size={15} className="contact-icon" />
                <a href="mailto:admin@moshautomation.com">admin@moshautomation.com</a>
              </div>
              <div className="contact-item gst-badge">
                <span className="gst-label">GSTIN:</span>
                <span className="gst-code">33DLCPP0458M1ZW</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Portal Link */}
        <div className="footer-bottom-bar">
          <div className="copyright-text">
            © {currentYear} MOSH Automation. All rights reserved. Registered Trademark in India.
          </div>
          <div className="bottom-links">
            <Link to="/login">Portal Login</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default PublicFooter;
