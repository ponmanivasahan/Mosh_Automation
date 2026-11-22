import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  SlidersHorizontal,
  Package,
  CheckCircle,
  Home
} from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { defaultProducts } from '../../data/defaults';
import { productSlugMap, productTechnicalData } from '../../data/productSlugs';
import { setSEO, getBreadcrumbSchema } from '../../utils/seoHelper';
import { trackProductSearch } from '../../utils/analytics';
import './ProductListingPage.css';

const ProductListingPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Automatic Water Level Controllers',
    'Residential Water Pump Controllers',
    'Industrial & Agricultural Motor Controllers',
    'GSM & Wireless Motor Automation',
    'Sensors & Probes'
  ];

  useEffect(() => {
    setSEO({
      title: 'Automatic Water Level Controller Products & Prices | MOSH Automation',
      description: 'Browse MOSH Automation\'s complete range of automatic water level controllers, wireless tank indicators, float switches, and motor automation systems with transparent pricing.',
      keywords: [
        'Automatic Water Level Controller',
        'Automatic water level controller price',
        'Water level controller products',
        'water pump auto switch',
        'submersible motor controller'
      ],
      canonical: 'https://moshautomation.com/products',
      schema: getBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' }
      ])
    });
    window.scrollTo(0, 0);
  }, []);

  const filteredProducts = useMemo(() => {
    return defaultProducts.filter(p => {
      const tech = productTechnicalData[p.id] || {};
      const matchesCategory = selectedCategory === 'All' || tech.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        trackProductSearch(searchQuery.trim(), filteredProducts.length);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredProducts.length]);

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main className="product-listing-main">
        {/* Header Banner */}
        <section className="listing-header-banner">
          <div className="home-section-container">
            {/* Breadcrumb */}
            <nav className="public-breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb-link"><Home size={13} /> Home</Link>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Products</span>
            </nav>

            <h1 className="listing-title">Automatic Water Level Controllers & Products</h1>
            <p className="listing-subtitle">
              Engineered with industrial-grade microcontrollers, non-electrolytic magnetic sensors, and high-inrush contactors. Designed for residential, agricultural, and industrial pumping applications.
            </p>

            {/* Filter & Search Bar */}
            <div className="listing-filter-bar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by model or feature..."
                  className="search-input"
                />
              </div>

              <div className="category-pills">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Product Cards Grid */}
        <section className="listing-grid-section">
          <div className="home-section-container">
            <div className="listing-results-count">
              Showing <strong>{filteredProducts.length}</strong> products
              {selectedCategory !== 'All' && <span> in <em>{selectedCategory}</em></span>}
            </div>

            <div className="products-catalog-grid">
              {filteredProducts.map((product) => {
                const slug = productSlugMap[product.id] || product.id;
                const techData = productTechnicalData[product.id] || {};

                return (
                  <article key={product.id} className="catalog-card">
                    <div className="catalog-img-wrap">
                      <img 
                        src={product.image} 
                        alt={`${product.name} - MOSH Automatic Water Level Controller`} 
                        className="catalog-img"
                        loading="lazy" 
                      />
                      <span className="catalog-badge">{techData.category || 'Automation'}</span>
                    </div>

                    <div className="catalog-content">
                      <h2 className="catalog-name">
                        <Link to={`/products/${slug}`}>{product.name}</Link>
                      </h2>

                      <p className="catalog-desc">{product.description}</p>

                      {/* Mini Spec Badges */}
                      {techData.specs && (
                        <div className="catalog-spec-row">
                          {techData.specs['Phase Support'] && (
                            <span className="mini-spec">{techData.specs['Phase Support']}</span>
                          )}
                          {techData.specs['Motor Capacity'] && (
                            <span className="mini-spec">{techData.specs['Motor Capacity']}</span>
                          )}
                          <span className="mini-spec">1 Year Warranty</span>
                        </div>
                      )}

                      <div className="catalog-footer">
                        <div>
                          <span className="price-tag-label">Price (Incl. GST)</span>
                          <div className="catalog-price">₹{product.price.toLocaleString('en-IN')}</div>
                        </div>

                        <Link to={`/products/${slug}`} className="catalog-details-btn">
                          <span>View Specs</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="no-products-state">
                <Package size={48} className="no-products-icon" />
                <h3>No products matched your criteria</h3>
                <p>Try clearing your search query or selecting a different category.</p>
                <button 
                  type="button" 
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="reset-filters-btn"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ProductListingPage;
