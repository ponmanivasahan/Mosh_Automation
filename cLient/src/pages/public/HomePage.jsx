import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Droplet, 
  ShieldCheck, 
  Wifi, 
  ArrowRight, 
  CheckCircle, 
  Phone, 
  Package, 
  Check, 
  HelpCircle,
  Building,
  Home,
  Factory,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { defaultProducts } from '../../data/defaults';
import { productSlugMap, productTechnicalData } from '../../data/productSlugs';
import { setSEO, getOrganizationSchema, getWebSiteSchema, getFAQSchema } from '../../utils/seoHelper';
import './HomePage.css';

const HomePage = () => {
  const homeFaqs = [
    {
      question: 'What is an automatic water level controller and how does it work?',
      answer: 'An automatic water level controller is an electronic device that monitors water levels in overhead and underground tanks using magnetic or stainless steel sensors. It autonomously starts the pump when water drops below a set threshold and shuts it off before the tank overflows.'
    },
    {
      question: 'How does MOSH Automation prevent motor dry running?',
      answer: 'Our controllers feature integrated dry-run detection. If the underground sump or borewell water supply runs dry, the controller trips the pump within seconds, protecting motor impellers and windings from thermal damage.'
    },
    {
      question: 'Can the automatic water level controller be installed on my existing pump?',
      answer: 'Yes. MOSH controllers are compatible with all domestic monobloc, jet, openwell, and borewell submersible pumps across single-phase (up to 3HP) and three-phase (up to 15HP) electrical systems.'
    },
    {
      question: 'What is the price of an automatic water level controller for home use?',
      answer: 'MOSH residential automatic water level controllers start at ₹2,900 for timer-based systems and ₹3,200 for full auto-change dual-tank models, complete with magnetic sensors and a 1-year replacement warranty.'
    },
    {
      question: 'Do your water level sensors rust or need frequent cleaning?',
      answer: 'No. MOSH uses food-grade SS304 stainless steel and non-electrolytic magnetic reed sensors operating on low-voltage AC signals to eliminate rust, scaling, and electrolytic oxidation.'
    }
  ];

  useEffect(() => {
    setSEO({
      title: 'MOSH Automation | Automatic Water Level Controllers & Smart Automation',
      description: 'Discover MOSH Automation\'s automatic water level controllers, motor automation systems and smart water management solutions for homes, farms and industries.',
      keywords: [
        'Automatic Water Level Controller',
        'Water Level Controller',
        'Water Level Automation',
        'Automatic Water Tank Controller',
        'Water Motor Automation',
        'Automatic Water Pump Controller',
        'Water Level Monitoring System',
        'Water Tank Overflow Prevention',
        'Automatic Motor Controller',
        'Smart Water Management System',
        'Best automatic water level controller for home'
      ],
      canonical: 'https://moshautomation.com/',
      ogImage: '/Auto_Change_WaterLevel_Controller.png',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          getOrganizationSchema(),
          getWebSiteSchema(),
          getFAQSchema(homeFaqs)
        ]
      }
    });
    window.scrollTo(0, 0);
  }, []);

  // Top featured products for home showcase
  const featuredProductIds = ['p-1', 'p-2', 'p-10', 'p-4', 'p-8', 'p-5'];
  const featuredProducts = defaultProducts.filter(p => featuredProductIds.includes(p.id));

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main>
        {/* ==================================================================
            HERO SECTION
            ================================================================== */}
        <section className="home-hero-section">
          <div className="home-hero-container">
            <div className="home-hero-content">
              
              <div className="home-hero-badge">
                <Zap size={14} className="hero-badge-icon" />
                <span>Next-Gen IoT Water Management Systems</span>
              </div>

              <h1 className="home-hero-title">
                Automatic Water Level Controllers & Smart Water Automation
              </h1>

              <p className="home-hero-subtitle">
                Eliminate water tank overflow and motor dry-run damage permanently. MOSH Automation manufactures industrial-grade, electrolysis-free automated switching systems for residential homes, apartment complexes, farms, and industrial plants.
              </p>

              {/* Action Buttons */}
              <div className="home-hero-cta-group">
                <Link to="/products" className="home-cta-primary">
                  <span>Explore Controllers & Prices</span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/login" className="home-cta-secondary">
                  <span>Portal Access & Quick Inquiry</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="home-trust-strip">
                <div className="trust-item">
                  <CheckCircle size={15} className="trust-icon" />
                  <span>100% Electrolysis-Free Sensors</span>
                </div>
                <div className="trust-item">
                  <CheckCircle size={15} className="trust-icon" />
                  <span>1 Year Replacement Warranty</span>
                </div>
                <div className="trust-item">
                  <CheckCircle size={15} className="trust-icon" />
                  <span>Manufactured in Coimbatore</span>
                </div>
              </div>

            </div>

            {/* Hero Visual Card */}
            <div className="home-hero-visual">
              <div className="hero-visual-card">
                <div className="hero-visual-header">
                  <span className="live-status-dot" />
                  <span className="live-status-text">Smart Water Telemetry Active</span>
                </div>
                <div className="hero-image-wrap">
                  <img 
                    src="/Auto_Change_WaterLevel_Controller.png" 
                    alt="Auto Change Water Level Controller by MOSH Automation" 
                    className="hero-product-img" 
                  />
                </div>
                <div className="hero-visual-footer">
                  <div className="hero-spec-pill">
                    <span className="spec-label">Overhead Tank</span>
                    <span className="spec-value text-blue-600">Auto Cut-Off</span>
                  </div>
                  <div className="hero-spec-pill">
                    <span className="spec-label">Underground Sump</span>
                    <span className="spec-value text-emerald-600">Dry Run Guard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            CORE VALUE PROPOSITIONS (H2)
            ================================================================== */}
        <section className="home-pillars-section">
          <div className="home-section-container">
            <div className="section-header-center">
              <span className="section-pill-tag">Why Automate With MOSH</span>
              <h2 className="section-h2">Intelligent Automated Motor Switching That Eliminates Tank Overflow</h2>
              <p className="section-subtext">
                Every drop of pumped water requires electrical energy. Our controllers protect your property, reduce utility bills, and ensure uninterrupted water security.
              </p>
            </div>

            <div className="pillars-grid">
              <div className="pillar-card">
                <div className="pillar-icon-box bg-blue-50 text-blue-600">
                  <Droplet size={24} />
                </div>
                <h3 className="pillar-title">Zero Water Tank Overflow</h3>
                <p className="pillar-desc">
                  Instantaneous high-threshold detection shuts off the motor before water ever reaches the overflow pipe, protecting building paint and concrete from seepage.
                </p>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="pillar-title">Automated Dry Run Protection</h3>
                <p className="pillar-desc">
                  If the municipal supply or underground sump runs dry, the controller trips the pump within seconds, protecting motor impellers and windings from thermal damage.
                </p>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box bg-purple-50 text-purple-600">
                  <Wifi size={24} />
                </div>
                <h3 className="pillar-title">Long-Range Wireless Telemetry</h3>
                <p className="pillar-desc">
                  Eliminate expensive, fragile multi-story sensor cables with our sub-GHz wireless RF transmitter nodes operating reliably up to 1.5 km line-of-sight.
                </p>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box bg-amber-50 text-amber-600">
                  <Cpu size={24} />
                </div>
                <h3 className="pillar-title">Heavy-Duty Contactor Switching</h3>
                <p className="pillar-desc">
                  Engineered with industrial 30A/40A contactors and arc suppressors to handle severe inductive kickback from motors up to 15 HP without contact welding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            FEATURED PRODUCTS SECTION (H2)
            ================================================================== */}
        <section className="home-products-section">
          <div className="home-section-container">
            <div className="section-header-between">
              <div>
                <span className="section-pill-tag">Product Catalog</span>
                <h2 className="section-h2">Featured Automatic Water Level Controllers</h2>
                <p className="section-subtext">
                  Direct factory pricing from Coimbatore with verified nationwide delivery and 1-year replacement warranty.
                </p>
              </div>
              <Link to="/products" className="view-all-link">
                <span>View All 14 Models</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="home-products-grid">
              {featuredProducts.map((product) => {
                const slug = productSlugMap[product.id] || product.id;
                const techData = productTechnicalData[product.id] || {};

                return (
                  <article key={product.id} className="home-product-card">
                    <div className="product-card-img-wrap">
                      <img 
                        src={product.image} 
                        alt={`${product.name} - MOSH Automatic Water Level Controller`} 
                        className="product-card-img" 
                        loading="lazy"
                      />
                      <span className="product-category-tag">{techData.category || 'Water Automation'}</span>
                    </div>

                    <div className="product-card-body">
                      <h3 className="product-card-title">
                        <Link to={`/products/${slug}`}>{product.name}</Link>
                      </h3>
                      <p className="product-card-desc">{product.description}</p>

                      <div className="product-card-price-row">
                        <div>
                          <span className="price-label">Price</span>
                          <div className="product-card-price">₹{product.price.toLocaleString('en-IN')}</div>
                        </div>
                        <Link to={`/products/${slug}`} className="product-view-btn" aria-label={`View ${product.name} specifications`}>
                          <span>Specs & Details</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================
            SOLUTIONS OVERVIEW SECTION (H2)
            ================================================================== */}
        <section className="home-solutions-section">
          <div className="home-section-container">
            <div className="section-header-center">
              <span className="section-pill-tag">Targeted Solutions</span>
              <h2 className="section-h2">Engineered Solutions for Every Water Infrastructure</h2>
              <p className="section-subtext">
                Select your building architecture to discover dedicated water management and motor automation configurations.
              </p>
            </div>

            <div className="solutions-cards-grid">
              <Link to="/solutions/automatic-water-level-controllers" className="solution-overview-card">
                <div className="solution-card-header">
                  <div className="solution-icon-box"><Droplet size={20} /></div>
                  <h3 className="solution-card-title">Automatic Water Level Controllers</h3>
                </div>
                <p className="solution-card-desc">
                  Autonomous overhead and sump tank replenishment for single-phase residential pumps with dry-run cutoff.
                </p>
                <div className="solution-card-cta">
                  <span>Explore Solution</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              <Link to="/solutions/water-tank-automation" className="solution-overview-card">
                <div className="solution-card-header">
                  <div className="solution-icon-box"><Building size={20} /></div>
                  <h3 className="solution-card-title">Water Tank Automation Systems</h3>
                </div>
                <p className="solution-card-desc">
                  Multi-tank coordination linking underground sumps, auxiliary storage, and rooftop tanks seamlessly.
                </p>
                <div className="solution-card-cta">
                  <span>Explore Solution</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              <Link to="/solutions/automatic-motor-controllers" className="solution-overview-card">
                <div className="solution-card-header">
                  <div className="solution-icon-box"><Factory size={20} /></div>
                  <h3 className="solution-card-title">Automatic Motor Controllers</h3>
                </div>
                <p className="solution-card-desc">
                  Three-phase and high-HP agricultural pump controllers with single-phasing and overload protection.
                </p>
                <div className="solution-card-cta">
                  <span>Explore Solution</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              <Link to="/solutions/water-level-monitoring-systems" className="solution-overview-card">
                <div className="solution-card-header">
                  <div className="solution-icon-box"><Wifi size={20} /></div>
                  <h3 className="solution-card-title">Water Level Monitoring Systems</h3>
                </div>
                <p className="solution-card-desc">
                  Wireless telemetry and multi-node sensor networks eliminating cables across apartment campuses.
                </p>
                <div className="solution-card-cta">
                  <span>Explore Solution</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ==================================================================
            FAQ SECTION (H2 + JSON-LD FAQPage Schema)
            ================================================================== */}
        <section className="home-faq-section">
          <div className="home-section-container">
            <div className="section-header-center">
              <span className="section-pill-tag">Frequently Asked Questions</span>
              <h2 className="section-h2">Everything You Need to Know About Water Level Controllers</h2>
              <p className="section-subtext">
                Common questions regarding installation, motor compatibility, sensor longevity, and pricing.
              </p>
            </div>

            <div className="faq-accordion-wrap">
              {homeFaqs.map((faq, idx) => (
                <div key={idx} className="faq-item-card">
                  <h3 className="faq-question">
                    <HelpCircle size={18} className="faq-icon" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================
            KNOWLEDGE BASE TEASER SECTION
            ================================================================== */}
        <section className="home-blog-teaser-section">
          <div className="home-section-container">
            <div className="section-header-between">
              <div>
                <span className="section-pill-tag">Educational Guides</span>
                <h2 className="section-h2">Latest Water Automation Insights</h2>
              </div>
              <Link to="/blog" className="view-all-link">
                <span>View All Articles</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="home-blog-grid">
              <article className="home-blog-card">
                <div className="blog-meta">Guides & Fundamentals • 6 min read</div>
                <h3 className="blog-title">
                  <Link to="/blog/what-is-an-automatic-water-level-controller">What Is an Automatic Water Level Controller?</Link>
                </h3>
                <p className="blog-excerpt">
                  A complete beginner's guide explaining the working components, benefits, and why automation is vital for modern water tanks.
                </p>
                <Link to="/blog/what-is-an-automatic-water-level-controller" className="blog-read-more">
                  <span>Read Article</span>
                  <ArrowRight size={13} />
                </Link>
              </article>

              <article className="home-blog-card">
                <div className="blog-meta">How-To & Solutions • 6 min read</div>
                <h3 className="blog-title">
                  <Link to="/blog/how-to-prevent-water-tank-overflow">How to Prevent Water Tank Overflow (5 Proven Methods)</Link>
                </h3>
                <p className="blog-excerpt">
                  Tired of rooftop overflow damage? Discover the top 5 proven methods to stop water tank overflowing permanently.
                </p>
                <Link to="/blog/how-to-prevent-water-tank-overflow" className="blog-read-more">
                  <span>Read Article</span>
                  <ArrowRight size={13} />
                </Link>
              </article>

              <article className="home-blog-card">
                <div className="blog-meta">Comparisons • 6 min read</div>
                <h3 className="blog-title">
                  <Link to="/blog/manual-vs-automatic-water-level-controller">Manual vs Automatic Water Level Control</Link>
                </h3>
                <p className="blog-excerpt">
                  A side-by-side comparison of electricity bills, pump lifespan, water waste, and total cost of ownership.
                </p>
                <Link to="/blog/manual-vs-automatic-water-level-controller" className="blog-read-more">
                  <span>Read Article</span>
                  <ArrowRight size={13} />
                </Link>
              </article>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default HomePage;
