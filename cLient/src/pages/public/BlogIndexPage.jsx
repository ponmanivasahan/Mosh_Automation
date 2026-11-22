import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Home, 
  Calendar,
  CheckCircle,
  Zap
} from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { blogArticles } from '../../data/blogData';
import { setSEO, getBreadcrumbSchema } from '../../utils/seoHelper';
import './BlogIndexPage.css';

const BlogIndexPage = () => {
  useEffect(() => {
    setSEO({
      title: 'Water Automation Knowledge Base & Guides | MOSH Automation',
      description: 'Educational articles and technical guides on automatic water level controllers, pump motor protection, tank overflow solutions, and wireless telemetry.',
      keywords: [
        'automatic water level controller guide',
        'how to prevent tank overflow',
        'water pump motor automation',
        'water level controller working principle',
        'smart water management'
      ],
      canonical: 'https://moshautomation.com/blog',
      schema: getBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Knowledge Base', url: '/blog' }
      ])
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="public-page-wrapper">
      <PublicNavbar />

      <main className="blog-index-main">
        {/* Header */}
        <section className="blog-header-banner">
          <div className="home-section-container">
            <nav className="public-breadcrumb" aria-label="Breadcrumb">
              <Link to="/" className="breadcrumb-link"><Home size={13} /> Home</Link>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">Knowledge Base</span>
            </nav>

            <h1 className="blog-index-h1">Water Automation Knowledge Base & Engineering Guides</h1>
            <p className="blog-index-subtitle">
              Comprehensive, technically accurate engineering articles to help homeowners, apartment facility managers, and farmers understand and master automated water management.
            </p>
          </div>
        </section>

        {/* Articles List */}
        <section className="blog-articles-section">
          <div className="home-section-container">
            <div className="blog-articles-grid">
              {blogArticles.map((article) => (
                <article key={article.slug} className="blog-directory-card">
                  <div className="blog-card-top">
                    <span className="blog-card-cat">{article.category}</span>
                    <span className="blog-card-readtime">
                      <Clock size={12} />
                      <span>{article.readTime}</span>
                    </span>
                  </div>

                  <h2 className="blog-card-title">
                    <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                  </h2>

                  <p className="blog-card-desc">{article.description}</p>

                  <div className="blog-card-footer">
                    <span className="blog-author-tag">{article.author}</span>
                    <Link to={`/blog/${article.slug}`} className="blog-btn-read">
                      <span>Read Full Guide</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default BlogIndexPage;
