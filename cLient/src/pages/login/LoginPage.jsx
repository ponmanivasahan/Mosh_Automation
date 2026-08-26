import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle } from 'lucide-react';
import { loginPhones } from '../../data/defaults';
import { useAuth } from '../../utils/AuthContext';
import { API_URL } from '../../utils/api';
import './LoginPage.css';

const rotatingMessages = [
  'Mosh Automation delivers innovative water level controller solutions.',
  'Our intelligent systems help monitor, control, and optimize water usage.',
  'We combine advanced technology with dependable engineering.'
];

const typingDelay = 26;
const pauseDelay = 1400;
const deleteDelay = 16;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
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
          timeoutId = window.setTimeout(tick, 240);
          return;
        }
      }

      timeoutId = window.setTimeout(tick, phaseRef.current === 'deleting' ? deleteDelay : typingDelay);
    };

    timeoutId = window.setTimeout(tick, 320);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const currentYear = new Date().getFullYear();

  // Map registered phone to role fallback (local cache mode only)
  const getRoleFromPhone = (value) => {
    const rawUsers = localStorage.getItem('mosh_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const existing = users.find(u => u.phone === value);
      if (existing) return existing.role;
    }

    if (value === loginPhones.admin || value === '8888888888') {
      return 'admin';
    }

    return 'customer';
  };

  // Submit Name & Phone to backend directly for single-step passwordless login/register
  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    const cleanedName = name.trim();
    const cleanedPhone = phone.trim().replace(/\D/g, '');

    if (!cleanedName) {
      setError('Please enter your user name.');
      return;
    }

    if (!cleanedPhone || cleanedPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanedName, phone: cleanedPhone }),
        credentials: 'include'
      });

      if (response.status === 401) {
        setError('Invalid phone number or username.');
        return;
      }
      if (response.status === 403) {
        setError('Access denied.');
        return;
      }
      if (response.status === 404) {
        setError('Login service is unavailable.');
        return;
      }
      if (response.status >= 500) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || errData.message || 'Server error. Please try again later.');
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        completeUserLogin(data.user, data.token);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (e) {
      console.error('Login network error:', e);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    }
  };

  const completeUserLogin = (user, token) => {
    const payload = {
      role: user.role,
      name: user.name,
      phone: user.phone,
      token, // Save JWT token for requests
      loggedInAt: new Date().toISOString()
    };

    const rawUsers = localStorage.getItem('mosh_users');
    const usersList = rawUsers ? JSON.parse(rawUsers) : [];
    const existingIdx = usersList.findIndex(u => u.phone === payload.phone);
    if (existingIdx > -1) {
      usersList[existingIdx] = payload;
    } else {
      usersList.push(payload);
    }
    localStorage.setItem('mosh_users', JSON.stringify(usersList));

    login(payload);
    navigate(user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
  };

  return (
    <div className="login-page">
      <section className="login-story" aria-label="Mosh Automation message">
        <p className="login-story-kicker">Automation for reliable water management</p>
        <p className="login-story-typing">
          {typedMessage}
          <span className="typing-caret" aria-hidden="true" />
        </p>
      </section>

      <div className="login-shell fade-in">
        <section className="login-panel" aria-label="Mosh Automation login">
          <div className="login-panel-header">
            <img className="login-panel-logo" src="/logo%20background.png" alt="Mosh Automation logo" />
            <p className="login-panel-title">Create Connection With Mosh Automation</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label className="field-label">
              User Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your user name"
                autoComplete="name"
                required
              />
            </label>

            <label className="field-label">
              Phone Number
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                autoComplete="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                required
              />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="create-account-button flex items-center justify-center gap-2">
              <Smartphone size={18} /> Login
            </button>
          </form>

          <p className="login-footer">Copyright © {currentYear} Mosh Automation. All Rights Reserved.</p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
