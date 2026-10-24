import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle, ShieldCheck, ArrowRight, Zap, Droplets, Activity } from 'lucide-react';
import { loginPhones } from '../../data/defaults';
import { useAuth } from '../../utils/AuthContext';
import { API_URL } from '../../utils/api';
import './LoginPage.css';

const rotatingMessages = [
  'Innovative water level controller systems designed for modern residential & industrial needs.',
  'Intelligent automated switching that eliminates tank overflow and dry-run damage.',
  'Continuous wireless telemetry and heavy-duty engineering built for dependable 24/7 operation.'
];

const typingDelay = 28;
const pauseDelay = 2200;
const deleteDelay = 18;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const messageIndexRef = useRef(0);
  const phaseRef = useRef('typing');
  const currentIndexRef = useRef(0);

  // Typing animation effect
  useEffect(() => {
    let timeoutId;

    const tick = () => {
      const currentMessage = rotatingMessages[messageIndexRef.current];

      if (phaseRef.current === 'typing') {
        currentIndexRef.current += 1;
        setTypedMessage(currentMessage.slice(0, currentIndexRef.current));

        if (currentIndexRef.current >= currentMessage.length) {
          phaseRef.current = 'pausing';
          timeoutId = window.setTimeout(tick, pauseDelay);
          return;
        }
      }

      if (phaseRef.current === 'pausing') {
        phaseRef.current = 'deleting';
        timeoutId = window.setTimeout(tick, deleteDelay);
        return;
      }

      if (phaseRef.current === 'deleting') {
        currentIndexRef.current -= 1;
        setTypedMessage(currentMessage.slice(0, currentIndexRef.current));

        if (currentIndexRef.current <= 0) {
          currentIndexRef.current = 0;
          messageIndexRef.current = (messageIndexRef.current + 1) % rotatingMessages.length;
          phaseRef.current = 'typing';
          timeoutId = window.setTimeout(tick, 280);
          return;
        }
      }

      timeoutId = window.setTimeout(tick, phaseRef.current === 'deleting' ? deleteDelay : typingDelay);
    };

    timeoutId = window.setTimeout(tick, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const currentYear = new Date().getFullYear();

  // Map registered phone to role fallback (local cache mode only)
  const getRoleFromPhone = (value) => {
    const rawUsers = localStorage.getItem('mosh_users');
    if (rawUsers) {
      try {
        const users = JSON.parse(rawUsers);
        const existing = users.find(u => u.phone === value);
        if (existing) return existing.role;
      } catch {}
    }

    if (value === '9514714441' || value === loginPhones.admin) {
      return 'admin';
    }

    return 'customer';
  };

  const completeUserLogin = (user, token) => {
    const payload = {
      role: user.role || getRoleFromPhone(user.phone),
      name: user.name,
      phone: user.phone,
      token,
      loggedInAt: new Date().toISOString()
    };

    try {
      const rawUsers = localStorage.getItem('mosh_users');
      const usersList = rawUsers ? JSON.parse(rawUsers) : [];
      const existingIdx = usersList.findIndex(u => u.phone === payload.phone);
      if (existingIdx > -1) {
        usersList[existingIdx] = payload;
      } else {
        usersList.push(payload);
      }
      localStorage.setItem('mosh_users', JSON.stringify(usersList));
    } catch {}

    login(payload);
    navigate(payload.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
  };

  // Submit Name & Phone to backend directly for single-step passwordless login/register
  const handleLogin = async (event) => {
    event?.preventDefault?.();
    setError('');
    const cleanedName = name.trim();
    const cleanedPhone = phone.trim().replace(/\D/g, '');

    if (!cleanedName) {
      setError('Please enter your full name.');
      return;
    }

    if (!cleanedPhone || cleanedPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanedName, phone: cleanedPhone }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          completeUserLogin(data.user, data.token);
          return;
        }
      }

      // If backend returns 401 or specific error
      if (response.status === 401 || response.status === 403) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Access restricted. Please verify credentials.');
        setIsSubmitting(false);
        return;
      }

      // If server error or offline, fallback smoothly
      const fallbackRole = getRoleFromPhone(cleanedPhone);
      completeUserLogin({ name: cleanedName, phone: cleanedPhone, role: fallbackRole }, 'mock-token-' + Date.now());
    } catch (e) {
      console.warn('Backend unavailable, proceeding with local authenticated session:', e);
      const fallbackRole = getRoleFromPhone(cleanedPhone);
      completeUserLogin({ name: cleanedName, phone: cleanedPhone, role: fallbackRole }, 'mock-token-' + Date.now());
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickCredentials = (demoName, demoPhone) => {
    setName(demoName);
    setPhone(demoPhone);
    setError('');
  };

  return (
    <div className="login-page-root">
      
      {/* Background Decor Elements */}
      <div className="login-bg-glow-1" />
      <div className="login-bg-glow-2" />
      <div className="login-grid-pattern" />

      <div className="login-container">
        
        {/* Left Column: Brand Hero & Value Proposition */}
        <section className="login-hero-col">
          <div className="login-hero-brand">
            <div className="login-hero-logo-wrap">
              <img src="/logo background.png" alt="Mosh Automation Logo" className="login-hero-logo" />
            </div>
            <div>
              <h1 className="login-hero-title">MOSH AUTOMATION</h1>
              <p className="login-hero-subtitle">Intelligent Water Management & Control Systems</p>
            </div>
          </div>

          <div className="login-hero-highlight-box">
            <div className="login-hero-badge">
              <Zap size={14} className="text-teal-600" />
              <span>Next-Gen IoT Controllers</span>
            </div>

            <div className="login-hero-typing-wrap">
              <p className="login-hero-typed-text">
                "{typedMessage}"
                <span className="typing-caret" aria-hidden="true" />
              </p>
            </div>

            <div className="login-hero-features-grid">
              <div className="login-hero-feature-item">
                <div className="feature-icon-circle bg-teal-50 text-teal-700">
                  <Droplets size={16} />
                </div>
                <div>
                  <h4 className="feature-title">Overflow Prevention</h4>
                  <p className="feature-desc">Autonomous auto-switch sensing</p>
                </div>
              </div>

              <div className="login-hero-feature-item">
                <div className="feature-icon-circle bg-blue-50 text-blue-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="feature-title">Dry Run Protection</h4>
                  <p className="feature-desc">Motor longevity & load safety</p>
                </div>
              </div>

              <div className="login-hero-feature-item">
                <div className="feature-icon-circle bg-indigo-50 text-indigo-700">
                  <Activity size={16} />
                </div>
                <div>
                  <h4 className="feature-title">Wireless Telemetry</h4>
                  <p className="feature-desc">Dual tank multi-node syncing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="login-hero-footer">
            <span>© {currentYear} Mosh Automation India. Engineered with precision.</span>
          </div>
        </section>

        {/* Right Column: Clean Modern Authentication Card */}
        <section className="login-card-col">
          <div className="login-card-panel">
            
            <div className="login-card-header">
              <div className="login-card-logo-badge">
                <img src="/logo background.png" alt="Mosh" className="h-9 w-9 object-contain" />
              </div>
              <h2 className="login-card-title">Sign In to Portal</h2>
              <p className="login-card-subtitle">
                Access your orders, quotation requests, and system telemetry.
              </p>
            </div>

            {/* Quick Demo Test Pills */}
            <div className="quick-test-section">
              <span className="quick-test-label">Instant Demo Login:</span>
              <div className="quick-test-buttons">
                <button
                  type="button"
                  onClick={() => setQuickCredentials('Admin Manager', '9514714441')}
                  className="quick-pill-btn admin"
                  title="Fill Admin Credentials"
                >
                  <span className="pill-dot admin" /> Admin Portal
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCredentials('Praveen Kumar', '9876543210')}
                  className="quick-pill-btn customer"
                  title="Fill Customer Credentials"
                >
                  <span className="pill-dot customer" /> Customer Portal
                </button>
              </div>
            </div>

            <form className="login-card-form" onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label" htmlFor="user-name">
                  Full Name / Business Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z\s.'-]*$/.test(val)) {
                      setName(val);
                    }
                  }}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                  required
                  className="login-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="user-phone">
                  10-Digit Mobile Number
                </label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    id="user-phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    autoComplete="tel"
                    maxLength={10}
                    required
                    className="login-input phone-input"
                  />
                </div>
              </div>

              {error && (
                <div className="login-error-banner animate-fade-in">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-btn"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Continue to Portal</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="login-card-footer">
              <p className="privacy-note">
                By continuing, you agree to Mosh Automation's verified operations terms & privacy guidelines.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default LoginPage;
