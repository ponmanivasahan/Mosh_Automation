import { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle, 
  Truck, 
  ArrowRight, 
  Home, 
  FileText,
  Phone,
  HelpCircle,
  Package,
  Cpu,
  Zap,
  ChevronRight
} from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { defaultProducts } from '../../data/defaults';
import { productSlugMap, slugToProductId, productTechnicalData } from '../../data/productSlugs';
import { setSEO, getProductSchema, getBreadcrumbSchema } from '../../utils/seoHelper';
import { trackProductView } from '../../utils/analytics';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { slugOrId } = useParams();
  const navigate = useNavigate();

  // Find product by slug or id
  const product = useMemo(() => {
    // 1. Check if slug matches slugToProductId
    let targetId = slugToProductId[slugOrId];
    if (!targetId) {
      // 2. Direct ID match
      targetId = slugOrId;
    }
    return defaultProducts.find(p => p.id === targetId) || defaultProducts[0];
  }, [slugOrId]);

  const targetSlug = productSlugMap[product.id] || product.id;
  const techData = productTechnicalData[product.id] || {};

  // If accessed by ID, redirect to clean SEO slug URL
  useEffect(() => {
    if (slugOrId === product.id && slugOrId !== targetSlug) {
      navigate(`/products/${targetSlug}`, { replace: true });
    }
  }, [slugOrId, product.id, targetSlug, navigate]);

  useEffect(() => {
    const seoTitle = techData.seoTitle || `${product.name} | MOSH Automation Price & Specifications`;
    const metaDescription = techData.metaDescription || 
      `Buy MOSH ${product.name} for ₹${product.price.toLocaleString('en-IN')}. Features intelligent water level sensing, overflow elimination, and 1-year replacement warranty.`;

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Products', url: '/products' },
      { name: product.name, url: `/products/${targetSlug}` }
    ];

    setSEO({
      title: seoTitle,
      description: metaDescription,
      keywords: [
        product.name,
        'Automatic Water Level Controller',
        `${product.name} price`,
        `${product.name} specifications`,
        techData.category || 'Water Level Controller'
      ],
      canonical: `https://moshautomation.com/products/${targetSlug}`,
      ogImage: product.image,
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          getProductSchema(product, targetSlug),
          getBreadcrumbSchema(breadcrumbs)
        ]
      }
    });

    window.scrollTo(0, 0);
    trackProductView(product);
  }, [product, targetSlug, techData]);

  // Related products (exclude current)
  const relatedProducts = defaultProducts
    .filter(p => p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main className="product-detail-main">
        <div className="home-section-container">
          
          {/* Breadcrumb Navigation */}
          <nav className="public-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-link"><Home size={13} /> Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/products" className="breadcrumb-link">Products</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>

          {/* Product Overview Section */}
          <div className="product-hero-layout">
            
            {/* Left: Product Image Showcase */}
            <div className="product-image-showcase">
              <div className="showcase-card">
                <img 
                  src={product.image} 
                  alt={`${product.name} - MOSH Automation Water Level Controller`} 
                  className="showcase-img"
                />
                <span className="showcase-badge">{techData.category || 'Automation System'}</span>
              </div>

              {/* Guarantees strip */}
              <div className="showcase-guarantees">
                <div className="guarantee-box">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <div>
                    <strong>1 Year Warranty</strong>
                    <span>Direct replacement guarantee</span>
                  </div>
                </div>

                <div className="guarantee-box">
                  <CheckCircle size={18} className="text-blue-500" />
                  <div>
                    <strong>Electrolysis-Free</strong>
                    <span>Food grade SS304 / Magnetic sensors</span>
                  </div>
                </div>

                <div className="guarantee-box">
                  <Truck size={18} className="text-purple-500" />
                  <div>
                    <strong>Nationwide Delivery</strong>
                    <span>Safe transit dispatch from Coimbatore</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technical Specs, Pricing & Actions */}
            <div className="product-info-column">
              <span className="product-category-pill">{techData.category || 'Water Level Controllers'}</span>
              
              <h1 className="product-h1">{techData.h1 || product.name}</h1>

              <div className="product-price-box">
                <span className="price-label">Price (Inclusive of GST)</span>
                <div className="price-val">₹{product.price.toLocaleString('en-IN')}</div>
                <span className="stock-status-pill in-stock">In Stock & Ready for Dispatch</span>
              </div>

              <div className="product-summary-text">
                <p>{product.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="product-action-buttons">
                <Link to="/login" className="btn-order-portal">
                  <span>Sign In & Order Online</span>
                  <ArrowRight size={16} />
                </Link>

                <a href="tel:+919514714441" className="btn-call-inquiry">
                  <Phone size={15} />
                  <span>Call: +91 95147 14441</span>
                </a>
              </div>

              {/* Key Features Bullet Points */}
              {techData.keyFeatures && (
                <div className="product-key-features">
                  <h3 className="features-title">Engineered Highlights</h3>
                  <ul className="features-list">
                    {techData.keyFeatures.map((feat, idx) => (
                      <li key={idx}>
                        <CheckCircle size={15} className="feat-check-icon" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* Technical Specifications Table */}
          {techData.specs && (
            <section className="product-specs-section">
              <h2 className="specs-section-title">Technical Specifications — {product.name}</h2>
              <div className="specs-table-wrap">
                <table className="specs-table">
                  <tbody>
                    {Object.entries(techData.specs).map(([label, val]) => (
                      <tr key={label}>
                        <th scope="row" className="spec-label-cell">{label}</th>
                        <td className="spec-val-cell">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Related Products Section */}
          <section className="related-products-section">
            <div className="section-header-between">
              <div>
                <h2 className="related-title">Complementary Automation Products</h2>
                <p className="related-sub">Frequently paired controllers and multi-tank automation modules.</p>
              </div>
              <Link to="/products" className="view-all-link">
                <span>View Full Catalog</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="home-products-grid">
              {relatedProducts.map((rel) => {
                const relSlug = productSlugMap[rel.id] || rel.id;
                const relTech = productTechnicalData[rel.id] || {};

                return (
                  <article key={rel.id} className="home-product-card">
                    <div className="product-card-img-wrap">
                      <img 
                        src={rel.image} 
                        alt={`${rel.name} - MOSH Automation`} 
                        className="product-card-img"
                        loading="lazy" 
                      />
                      <span className="product-category-tag">{relTech.category || 'Automation'}</span>
                    </div>

                    <div className="product-card-body">
                      <h3 className="product-card-title">
                        <Link to={`/products/${relSlug}`}>{rel.name}</Link>
                      </h3>
                      <p className="product-card-desc">{rel.description}</p>
                      
                      <div className="product-card-price-row">
                        <div>
                          <span className="price-label">Price</span>
                          <div className="product-card-price">₹{rel.price.toLocaleString('en-IN')}</div>
                        </div>
                        <Link to={`/products/${relSlug}`} className="product-view-btn">
                          <span>View Specs</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ProductDetailPage;
