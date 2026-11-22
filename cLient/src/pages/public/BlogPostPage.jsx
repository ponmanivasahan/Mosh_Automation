import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, 
  Home, 
  User, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  Share2,
  Package,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { blogArticles } from '../../data/blogData';
import { defaultProducts } from '../../data/defaults';
import { productSlugMap, productTechnicalData } from '../../data/productSlugs';
import { setSEO, getArticleSchema, getBreadcrumbSchema } from '../../utils/seoHelper';
import './BlogPostPage.css';

const BlogPostPage = () => {
  const { slug } = useParams();

  const article = useMemo(() => {
    return blogArticles.find(a => a.slug === slug) || blogArticles[0];
  }, [slug]);

  useEffect(() => {
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Knowledge Base', url: '/blog' },
      { name: article.title, url: `/blog/${article.slug}` }
    ];

    setSEO({
      title: article.seoTitle || `${article.title} | MOSH Automation`,
      description: article.description,
      keywords: article.keywords,
      canonical: `https://moshautomation.com/blog/${article.slug}`,
      ogType: 'article',
      ogImage: article.image,
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          getArticleSchema(article),
          getBreadcrumbSchema(breadcrumbs)
        ]
      }
    });

    window.scrollTo(0, 0);
  }, [article]);

  // Related products
  const relatedProducts = defaultProducts.filter(p => {
    const pSlug = productSlugMap[p.id];
    return article.relatedProductSlugs?.includes(pSlug);
  });

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main className="blog-post-main">
        <article className="blog-post-article">
          
          {/* Article Header */}
          <header className="article-header-banner">
            <div className="article-container">
              <nav className="public-breadcrumb" aria-label="Breadcrumb">
                <Link to="/" className="breadcrumb-link"><Home size={13} /> Home</Link>
                <span className="breadcrumb-sep">/</span>
                <Link to="/blog" className="breadcrumb-link">Knowledge Base</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{article.category}</span>
              </nav>

              <span className="article-category-badge">{article.category}</span>
              <h1 className="article-h1">{article.title}</h1>

              <div className="article-meta-row">
                <div className="meta-author">
                  <User size={14} className="meta-icon" />
                  <span>{article.author}</span>
                </div>
                <div className="meta-dot">•</div>
                <div className="meta-time">
                  <Clock size={14} className="meta-icon" />
                  <span>{article.readTime}</span>
                </div>
                <div className="meta-dot">•</div>
                <div className="meta-date">
                  <Calendar size={14} className="meta-icon" />
                  <span>Updated {article.modifiedDate}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Article Body Content */}
          <div className="article-container">
            <div className="article-content-layout">
              
              <div 
                className="article-body-content"
                dangerouslySetInnerHTML={{ __html: article.content }} 
              />

              {/* Sidebar with Recommended Hardware */}
              {relatedProducts.length > 0 && (
                <aside className="article-hardware-sidebar">
                  <div className="sidebar-sticky-box">
                    <h3 className="sidebar-title">Recommended Controllers</h3>
                    <p className="sidebar-desc">Products referenced in this technical guide:</p>

                    <div className="sidebar-products-list">
                      {relatedProducts.map(prod => {
                        const pSlug = productSlugMap[prod.id] || prod.id;
                        return (
                          <div key={prod.id} className="sidebar-product-card">
                            <div className="sidebar-prod-img-wrap">
                              <img src={prod.image} alt={prod.name} className="sidebar-prod-img" />
                            </div>
                            <div className="sidebar-prod-info">
                              <h4 className="sidebar-prod-name">
                                <Link to={`/products/${pSlug}`}>{prod.name}</Link>
                              </h4>
                              <div className="sidebar-prod-price">₹{prod.price.toLocaleString('en-IN')}</div>
                              <Link to={`/products/${pSlug}`} className="sidebar-view-link">
                                <span>View Specs</span>
                                <ArrowRight size={12} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="sidebar-cta-box">
                      <strong>Need Engineering Advice?</strong>
                      <p>Call our technical desk for custom pump sizing and sensor layout guidance.</p>
                      <a href="tel:+919514714441" className="sidebar-call-btn">
                        <span>+91 95147 14441</span>
                      </a>
                    </div>
                  </div>
                </aside>
              )}

            </div>

            {/* Back Link */}
            <div className="article-bottom-nav">
              <Link to="/blog" className="btn-back-blog">
                <ArrowLeft size={16} />
                <span>Back to Knowledge Base</span>
              </Link>
            </div>
          </div>

        </article>
      </main>

      <PublicFooter />
    </div>
  );
};

export default BlogPostPage;
