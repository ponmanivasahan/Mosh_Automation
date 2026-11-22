import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  Home, 
  HelpCircle, 
  Zap, 
  Phone,
  Droplet,
  Package,
  ChevronRight
} from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { solutionsData } from '../../data/solutionsData';
import { defaultProducts } from '../../data/defaults';
import { productSlugMap, productTechnicalData } from '../../data/productSlugs';
import { setSEO, getFAQSchema, getBreadcrumbSchema } from '../../utils/seoHelper';
import './SolutionPage.css';

const SolutionPage = () => {
  const { slug } = useParams();

  const solution = useMemo(() => {
    return solutionsData[slug] || solutionsData['automatic-water-level-controllers'];
  }, [slug]);

  useEffect(() => {
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Solutions', url: '/#solutions' },
      { name: solution.title, url: `/solutions/${solution.slug}` }
    ];

    setSEO({
      title: solution.seoTitle,
      description: solution.metaDescription,
      keywords: solution.targetKeywords,
      canonical: `https://moshautomation.com/solutions/${solution.slug}`,
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          getBreadcrumbSchema(breadcrumbs),
          getFAQSchema(solution.faqs)
        ]
      }
    });

    window.scrollTo(0, 0);
  }, [solution]);

  // Featured products matching this solution
  const featuredProducts = defaultProducts.filter(p => {
    const pSlug = productSlugMap[p.id];
    return solution.featuredProductSlugs.includes(pSlug);
  });

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main className="solution-main">
        {/* Solution Hero Banner */}
        <section className="solution-hero-banner">
          <div className="home-section-container">
            <nav className="public-breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb-link"><Home size={13} /> Home</Link>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{solution.title}</span>
            </nav>

            <div className="solution-hero-tag">
              <Zap size={14} className="text-blue-500" />
              <span>{solution.heroTag}</span>
            </div>

            <h1 className="solution-h1">{solution.h1}</h1>
            <p className="solution-hero-sub">{solution.heroSub}</p>

            <div className="solution-hero-cta">
              <Link to="/products" className="home-cta-primary">
                <span>View Recommended Controllers</span>
                <ArrowRight size={16} />
              </Link>
              <a href="tel:+919514714441" className="home-cta-secondary">
                <Phone size={15} />
                <span>Engineering Consultation</span>
              </a>
            </div>
          </div>
        </section>

        {/* Technical Overview & Benefits */}
        <section className="solution-details-section">
          <div className="home-section-container">
            <div className="solution-overview-box">
              <h2 className="section-h2">Engineering Architecture & Applications</h2>
              <p className="overview-text">{solution.overview}</p>
            </div>

            {/* Key Benefits Grid */}
            <div className="solution-benefits-grid">
              {solution.benefits.map((b, idx) => (
                <div key={idx} className="benefit-card">
                  <div className="benefit-icon-box">
                    <CheckCircle size={20} className="text-blue-600" />
                  </div>
                  <h3 className="benefit-title">{b.title}</h3>
                  <p className="benefit-desc">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommended Products Grid */}
        <section className="solution-products-section">
          <div className="home-section-container">
            <div className="section-header-between">
              <div>
                <span className="section-pill-tag">Recommended Hardware</span>
                <h2 className="section-h2">Controllers Built for {solution.title}</h2>
              </div>
              <Link to="/products" className="view-all-link">
                <span>Full Product Catalog</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="home-products-grid">
              {featuredProducts.map((product) => {
                const pSlug = productSlugMap[product.id] || product.id;
                const pTech = productTechnicalData[product.id] || {};

                return (
                  <article key={product.id} className="home-product-card">
                    <div className="product-card-img-wrap">
                      <img 
                        src={product.image} 
                        alt={`${product.name} - ${solution.title}`} 
                        className="product-card-img" 
                        loading="lazy"
                      />
                      <span className="product-category-tag">{pTech.category || 'Automation'}</span>
                    </div>

                    <div className="product-card-body">
                      <h3 className="product-card-title">
                        <Link to={`/products/${pSlug}`}>{product.name}</Link>
                      </h3>
                      <p className="product-card-desc">{product.description}</p>
                      
                      <div className="product-card-price-row">
                        <div>
                          <span className="price-label">Price</span>
                          <div className="product-card-price">₹{product.price.toLocaleString('en-IN')}</div>
                        </div>
                        <Link to={`/products/${pSlug}`} className="product-view-btn">
                          <span>Specifications</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="home-faq-section">
          <div className="home-section-container">
            <div className="section-header-center">
              <span className="section-pill-tag">Technical FAQs</span>
              <h2 className="section-h2">Frequently Asked Questions</h2>
            </div>

            <div className="faq-accordion-wrap">
              {solution.faqs.map((faq, idx) => (
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
      </main>

      <PublicFooter />
    </div>
  );
};

export default SolutionPage;
