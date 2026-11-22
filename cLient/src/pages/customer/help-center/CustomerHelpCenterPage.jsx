import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  MapPin,
  Wrench,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Tabs from '../../../components/ui/Tabs';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerHelpCenterPage.css';

const faqCategories = ['All', 'Products', 'Orders', 'Installation', 'Warranty'];

const faqItems = [
  {
    category: 'Products',
    question: 'How do dry-run preventers work?',
    answer: 'They continuously monitor motor current levels or use water level sensors to detect when water is depleted, immediately cutting off power to prevent motor burnout.'
  },
  {
    category: 'Products',
    question: 'Can controllers handle high voltage fluctuations?',
    answer: 'Yes, Mosh Automation controllers include built-in high/low voltage cut-off mechanisms and industrial-grade surge protection.'
  },
  {
    category: 'Orders',
    question: 'How can I place a custom order?',
    answer: 'Browse products, add them to your cart, then place your order from the Cart page and fill in the required delivery details in the checkout modal.'
  },
  {
    category: 'Orders',
    question: 'How do I check order status?',
    answer: 'Your order status is visible in the Order History section of the Cart page after checkout is completed.'
  },
  {
    category: 'Installation',
    question: 'Can I request an installation estimate?',
    answer: 'Open any product detail from the catalog and click the Request Estimate option, then specify quantity and complexity options.'
  },
  {
    category: 'Installation',
    question: 'What tools are required for self-installation?',
    answer: 'Standard screwdrivers, wire strippers, and mounting screws are sufficient. We provide a step-by-step wiring diagram with each controller package.'
  },
  {
    category: 'Warranty',
    question: 'What is the warranty policy?',
    answer: 'Most automation controllers include a standard 1-year replacement warranty from the date of purchase.'
  },
  {
    category: 'Warranty',
    question: 'How do I claim a warranty repair?',
    answer: 'Contact our support success team via support@moshautomation.com with your Order ID and product serial number.'
  }
];

const troubleshootingSteps = {
  pump: {
    title: 'Pump fails to start / auto-trigger',
    steps: [
      'Ensure the main switch is ON and voltage reads above 180V.',
      'Check sensor connections in the tank; dirty sensors may give false full readings.',
      'Ensure the automatic toggle switch is set to AUTO mode on the controller panel.'
    ]
  },
  sensors: {
    title: 'Sensors not detecting water level',
    steps: [
      'Inspect level probes for dirt, carbon deposits, or rust; clean them with fine sandpaper.',
      'Verify the sensor cables are connected securely to the terminal block.',
      'Check that the sensor cables do not run parallel to high-power wires to avoid interference.'
    ]
  },
  gsm: {
    title: 'GSM controller offline / SMS fails',
    steps: [
      'Check if the SIM card has active validity and SMS pack.',
      'Verify the signal strength LED; if blinking slowly, place the antenna outside the metal panel.',
      'Ensure the power supply is stable and input voltage is consistent.'
    ]
  }
};

const locations = [
  {
    id: 'hq',
    title: 'Headquarters & Factory',
    shortName: 'Varadharajapuram (HQ)',
    address: '162 ABC-164, Andal Complex, Kamarajar Rd, Varadharajapuram, Coimbatore - 641015, TN',
    landmark: 'Varadharajapuram',
    mapUrl: 'https://maps.google.com/maps?q=Mosh%20Automation%20Varadharajapuram%20Coimbatore&t=&z=15&ie=UTF8&iwloc=&output=embed',
    directionsUrl: 'https://maps.google.com/?q=Mosh+Automation+Varadharajapuram+Coimbatore'
  },
  {
    id: 'branch',
    title: 'Branch Office (Star Lodge)',
    shortName: 'Kaleeswara Mill Rd',
    address: '10/9, Kaleeswara Mill Rd, Coimbatore, 641009, TN, IN (Star Lodge)',
    landmark: 'Star Lodge, Kaleeswara Mill Rd',
    mapUrl: 'https://maps.google.com/maps?q=10%2F9%2C+Kaleeswara+Mill+Rd%2C+Coimbatore%2C+Tamil+Nadu+641009&t=&z=15&ie=UTF8&iwloc=&output=embed',
    directionsUrl: 'https://maps.google.com/?q=10/9,+Kaleeswara+Mill+Rd,+Coimbatore,+Tamil+Nadu+641009'
  }
];

const CustomerHelpCenterPage = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState(null);
  
  // Troubleshooting Wizard States
  const [wizardSelection, setWizardSelection] = useState(null);

  // Active Map Location State
  const [activeLocationId, setActiveLocationId] = useState('hq');
  const activeLocation = locations.find((l) => l.id === activeLocationId) || locations[0];

  const filteredFaq = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesSearch =
        item.question.toLowerCase().includes(query.toLowerCase()) ||
        item.answer.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [query, selectedCategory]);

  return (
    <AppShell title="Help Center" links={customerLinks}>
      <div className="ch-container">
        
        {/* Header Section matching Image 2 */}
        <div className="ch-header-section">
          <div className="ch-header-title-row">
            <span className="ch-accent-bar"></span>
            <h1 className="ch-main-heading">Help Center</h1>
          </div>
          <p className="ch-subheading">
            Search our knowledge base or troubleshoot issues using our interactive wizard.
          </p>
        </div>

        {/* Search Input bar */}
        <div className="ch-search-wrap">
          <Search className="ch-search-icon" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs, error codes, and troubleshooting topics..."
            className="ch-search-input"
          />
        </div>

        {/* Core Layout Grid */}
        <div className="help-layout-grid">
          
          {/* Left Column: FAQs & Self Service */}
          <div className="help-left-col">
            
            {/* FAQ Category Aligned Tabs */}
            <div className="mb-4">
              <Tabs
                tabs={faqCategories.map((cat) => ({ id: cat, label: cat }))}
                activeTab={selectedCategory}
                onChange={(cat) => {
                  setSelectedCategory(cat);
                  setOpenFaq(null);
                }}
                size="sm"
              />
            </div>

            {/* Accordion FAQ List */}
            <div className="faq-accordion-list">
              <h3 className="section-title">Frequently Asked Questions</h3>
              {filteredFaq.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className={`faq-accordion-card ${isOpen ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="faq-question-trigger"
                    >
                      <span className="faq-q-text">{item.question}</span>
                      <ChevronDown className="faq-chevron" size={18} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="faq-answer-wrap"
                        >
                          <p>{item.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {filteredFaq.length === 0 && (
                <div className="empty-faq-state">
                  <HelpCircle size={36} className="text-slate-400" />
                  <p>No matching help topics found. Try search keywords or different category filters.</p>
                </div>
              )}
            </div>

            {/* Self Service Troubleshooting Wizard */}
            <div className="troubleshooting-wizard-card">
              <div className="wizard-head">
                <Wrench className="wizard-icon" size={22} />
                <div>
                  <h3 className="wizard-title">Interactive Troubleshooting Assistant</h3>
                  <p className="wizard-subtitle">Quick diagnostics for common controller issues</p>
                </div>
              </div>

              <div className="wizard-body">
                {!wizardSelection ? (
                  <div className="wizard-options">
                    <p className="select-prompt">Select the component you are experiencing issues with:</p>
                    <div className="options-grid">
                      <button type="button" onClick={() => setWizardSelection('pump')} className="opt-btn">
                        <span>Pump Automation & Startups</span>
                        <ArrowRight size={16} />
                      </button>
                      <button type="button" onClick={() => setWizardSelection('sensors')} className="opt-btn">
                        <span>Water Level Sensors & Probes</span>
                        <ArrowRight size={16} />
                      </button>
                      <button type="button" onClick={() => setWizardSelection('gsm')} className="opt-btn">
                        <span>GSM Cellular / Remote Modules</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="wizard-steps-view">
                    <div className="steps-header">
                      <h4>{troubleshootingSteps[wizardSelection].title}</h4>
                      <button type="button" onClick={() => setWizardSelection(null)} className="reset-wizard-btn">
                        Start Over
                      </button>
                    </div>
                    <ul className="steps-list">
                      {troubleshootingSteps[wizardSelection].steps.map((step, idx) => (
                        <li key={idx} className="step-item">
                          <CheckCircle2 size={16} className="text-blue-600 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="wizard-footer-note">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span>If issue persists, please submit a service request or contact our support team.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Google Maps & Contact Details */}
          <div className="help-right-col">
            
            {/* Contact details */}
            <div className="support-contact-card">
              <span className="badge-kicker">Direct Contact</span>
              <h3>Customer Success Team</h3>
              <p className="support-description">Our expert support engineers are available during business hours to assist you.</p>
              
              <div className="contact-info-list">
                <a href="mailto:support@moshautomation.com" className="contact-link-item">
                  <div className="contact-icon-wrap">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="contact-label">Email Support</span>
                    <span className="contact-val">moshautomation@gmail.com</span>
                  </div>
                </a>
                
                <a href="tel:+919876543210" className="contact-link-item">
                  <div className="contact-icon-wrap">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="contact-label">Phone Support</span>
                    <span className="contact-val">+91 7397103576</span>
                    <br></br>
                    <span className="contact-val">+91 9514714441</span>
                  </div>
                </a>

                <div className="contact-link-item no-hover">
                  <div className="contact-icon-wrap">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="contact-label">Working Hours</span>
                    <span className="contact-val">Mon - Sat (9:00 AM - 6:00 PM)</span>
                  </div>
                </div>
              </div>

              <div className="response-time-badge">
                <ShieldCheck size={14} />
                <span>Avg response time: 2 Monitoring days</span>
              </div>
            </div>

            {/* Google Map Locations */}
            <div className="location-map-card">
              <div className="location-head">
                <MapPin className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div className="flex-1 min-w-0">
                  <h4 className="location-title">Visit MOSH Automation</h4>
                  <p className="location-subtitle">2 Official Facilities in Coimbatore</p>
                </div>
              </div>

              {/* Location Switcher Tabs */}
              <div className="location-switcher-tabs">
                {locations.map((loc) => {
                  const isActive = loc.id === activeLocationId;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setActiveLocationId(loc.id)}
                      className={`location-tab-btn ${isActive ? 'active' : ''}`}
                    >
                      <span className="location-tab-dot"></span>
                      <span>{loc.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Location Address Card */}
              <div className="location-address-box">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="location-branch-badge">{activeLocation.title}</span>
                    <p className="location-address-text">{activeLocation.address}</p>
                  </div>
                  <a
                    href={activeLocation.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-directions-btn shrink-0"
                    title="Open in Google Maps"
                  >
                    <ExternalLink size={13} />
                    <span>Directions</span>
                  </a>
                </div>
              </div>

              {/* Interactive Google Map Embed */}
              <div className="map-iframe-container">
                <iframe
                  key={activeLocation.id}
                  title={`MOSH Automation Location - ${activeLocation.title}`}
                  src={activeLocation.mapUrl}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Quick links to both locations */}
              <div className="location-footer-chips">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setActiveLocationId(loc.id)}
                    className={`location-chip ${loc.id === activeLocationId ? 'active' : ''}`}
                  >
                    <MapPin size={11} />
                    <span className="truncate">{loc.landmark}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </AppShell>
  );
};

export default CustomerHelpCenterPage;
