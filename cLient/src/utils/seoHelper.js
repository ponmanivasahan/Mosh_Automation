/**
 * MOSH Automation - Production Technical SEO & Structured Data Manager
 * Manages document head tags, OpenGraph, Twitter Cards, Canonical links, and JSON-LD Schema.
 */

const BASE_URL = 'https://moshautomation.com';
const DEFAULT_IMAGE = `${BASE_URL}/Auto_Change_WaterLevel_Controller.png`;

export const getCanonicalUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

export const setSEO = ({
  title,
  description,
  canonical,
  keywords,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  schema = null,
  noindex = false
}) => {
  // 1. Update Title
  if (title) {
    document.title = title;
  }

  // 2. Helper to set/update a <meta> tag
  const setMetaTag = (attrName, attrValue, content) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Standard Meta Tags
  if (description) {
    setMetaTag('name', 'description', description);
  }
  if (keywords) {
    setMetaTag('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
  }

  // Robots indexing directive
  setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Canonical Link
  const canonicalUrl = canonical || BASE_URL;
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // OpenGraph Tags
  setMetaTag('property', 'og:title', title || 'MOSH Automation');
  setMetaTag('property', 'og:description', description || '');
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`);
  setMetaTag('property', 'og:site_name', 'MOSH Automation');
  setMetaTag('property', 'og:locale', 'en_IN');

  // Twitter Card Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title || 'MOSH Automation');
  setMetaTag('name', 'twitter:description', description || '');
  setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`);

  // 3. JSON-LD Structured Data
  let scriptTag = document.getElementById('seo-json-ld');
  if (schema) {
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'seo-json-ld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);
  } else if (scriptTag) {
    scriptTag.remove();
  }
};

// ============================================================================
// SCHEMA GENERATORS (Schema.org compliant JSON-LD)
// ============================================================================

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MOSH Automation',
  alternateName: 'Mosh Automation India',
  url: 'https://moshautomation.com',
  logo: 'https://moshautomation.com/mosh-logo-badge.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9514714441',
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['English', 'Tamil']
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '162 ABC-164, Andal Complex, Kamarajar Road, Varadharajapuram, Uppilipalayam',
    addressLocality: 'Coimbatore',
    addressRegion: 'Tamil Nadu',
    postalCode: '641015',
    addressCountry: 'IN'
  },
  sameAs: [
    'https://moshautomation.com'
  ]
});

export const getWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'MOSH Automation',
  url: 'https://moshautomation.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://moshautomation.com/products?search={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
});

export const getProductSchema = (product, slug) => {
  const productUrl = `https://moshautomation.com/products/${slug || product.slug || product.id}`;
  const imageUrl = product.image?.startsWith('http')
    ? product.image
    : `https://moshautomation.com${product.image?.startsWith('/') ? '' : '/'}${product.image || 'Auto_Change_WaterLevel_Controller.png'}`;

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [imageUrl],
    description: product.description,
    sku: `MOSH-${product.id.toUpperCase()}`,
    mpn: `MOSH-${product.id.toUpperCase()}`,
    brand: {
      '@type': 'Brand',
      name: 'MOSH Automation'
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.availability === 'Out of Stock' 
        ? 'https://schema.org/OutOfStock' 
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'MOSH Automation'
      }
    }
  };
};

export const getBreadcrumbSchema = (breadcrumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url.startsWith('http') ? crumb.url : `https://moshautomation.com${crumb.url.startsWith('/') ? '' : '/'}${crumb.url}`
  }))
});

export const getFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

export const getArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: article.title,
  description: article.description,
  image: article.image?.startsWith('http') ? article.image : `https://moshautomation.com${article.image || '/tanks-backdrop.png'}`,
  author: {
    '@type': 'Organization',
    name: 'MOSH Automation Engineering Team',
    url: 'https://moshautomation.com'
  },
  publisher: {
    '@type': 'Organization',
    name: 'MOSH Automation',
    logo: {
      '@type': 'ImageObject',
      url: 'https://moshautomation.com/mosh-logo-badge.png'
    }
  },
  datePublished: article.publishedDate || '2026-01-15',
  dateModified: article.modifiedDate || '2026-03-01',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://moshautomation.com/blog/${article.slug}`
  }
});
