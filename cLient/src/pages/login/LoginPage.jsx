import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginPhones } from '../../data/defaults';
import { useAuth } from '../../utils/AuthContext';
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

  // Map the registered phone to a role.
  const getRoleFromPhone = (value) => {
    // Check if user is already saved in mosh_users list to preserve customized roles
    const rawUsers = localStorage.getItem('mosh_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const existing = users.find(u => u.phone === value);
      if (existing) return existing.role;
    }

    if (value === loginPhones.admin) {
      return 'admin';
    }

    return 'customer';
  };

  // Submit login payload.
  const submit = async (event) => {
    event.preventDefault();
    const cleanedName = name.trim();
    const cleanedPhone = phone.trim();

    if (!cleanedName) {
      setError('Please enter your user name.');
      return;
    }

    if (!cleanedPhone) {
      setError('Please enter your phone number.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanedName, phone: cleanedPhone }),
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.user) {
        const payload = {
          role: data.user.role,
          name: data.user.name,
          phone: data.user.phone,
          loggedInAt: new Date().toISOString()
        };

        // Cache users list locally
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
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (e) {
      setError('Cannot connect to authentication server. Starting in offline mode.');
      // Offline fallback
      const role = getRoleFromPhone(cleanedPhone);
      const payload = {
        role,
        name: cleanedName,
        phone: cleanedPhone,
        loggedInAt: new Date().toISOString()
      };
      login(payload);
      navigate(role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
    }
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

          <form className="login-form" onSubmit={submit}>
            <label className="field-label">
              User Name
              <input
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
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                autoComplete="tel"
                maxLength={10}
                required
              />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="create-account-button">Create Acoount</button>
          </form>

          <p className="login-footer">Copyright © {currentYear} Mosh Automation. All Rights Reserved.</p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;

