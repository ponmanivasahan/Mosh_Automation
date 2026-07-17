import { useMemo, useState } from 'react';
import AppShell from '../../../components/AppShell';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerHelpCenterPage.css';

const faqItems = [
  {
    question: 'How can I place a custom order?',
    answer: 'Browse products, add them to your cart, then place your order from the Cart page.'
  },
  {
    question: 'Can I request an installation estimate?',
    answer: 'Open any product detail and request an estimate with quantity and complexity options.'
  },
  {
    question: 'How do I check order status?',
    answer: 'Your order status is visible in the Cart page after checkout is completed.'
  },
  {
    question: 'What is the warranty policy?',
    answer: 'Most automation controllers include a standard 1-year warranty from the date of purchase.'
  }
];

const CustomerHelpCenterPage = () => {
  const [query, setQuery] = useState('');
  const filteredFaq = useMemo(
    () => faqItems.filter((item) => item.question.toLowerCase().includes(query.toLowerCase()) || item.answer.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <AppShell title="Help Center" links={customerLinks}>
      <section className="panel customer-help-center-page">
        <div className="help-hero">
          <div>
            <p className="eyebrow">Support center</p>
            <h2>Find answers fast or contact support directly</h2>
            <p>
              Get the help you need for orders, estimates, installation, and product support from a
              dedicated customer team.
            </p>
          </div>
        </div>

        <div className="help-grid">
          <article className="faq-card">
            <h3>Search the knowledge base</h3>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help topics"
            />
            <div className="faq-list">
              {filteredFaq.map((item) => (
                <div className="faq-item" key={item.question}>
                  <h4>{item.question}</h4>
                  <p>{item.answer}</p>
                </div>
              ))}
              {!filteredFaq.length && <p>No matching topics found.</p>}
            </div>
          </article>

          <article className="support-card">
            <div>
              <p className="eyebrow">Need direct help?</p>
              <h3>Contact our customer success team</h3>
              <p>
                Our support specialists are ready to assist with your order, installation, or
                product questions.
              </p>
            </div>
            <div className="support-details">
              <p>
                <strong>Email:</strong> support@moshauotomation.com
              </p>
              <p>
                <strong>Phone:</strong> +91 98765 43210
              </p>
              <p>
                <strong>Response time:</strong> 2 business hours
              </p>
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
};

export default CustomerHelpCenterPage;
