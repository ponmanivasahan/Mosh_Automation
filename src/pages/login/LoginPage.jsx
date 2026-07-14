import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginPhones } from '../../data/defaults';
import { useAuth } from '../../utils/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();

  // Map the registered phone to a role.
  const getRoleFromPhone = (value) => {
    if (value === loginPhones.admin) {
      return 'admin';
    }

    return 'customer';
  };

  // Submit login payload.
  const submit = (event) => {
    event.preventDefault();
    const cleanedName = name.trim();
    const cleanedPhone = phone.trim();
    const role = getRoleFromPhone(cleanedPhone);

    if (!cleanedName) {
      setError('Please enter your user name.');
      return;
    }

    if (!cleanedPhone) {
      setError('Please enter your phone number.');
      return;
    }

    const payload = {
      role,
      name: cleanedName,
      phone: cleanedPhone,
      loggedInAt: new Date().toISOString()
    };

    login(payload);
    navigate(role === 'admin' ? '/admin/dashboard' : '/customer/products');
  };

  return (
    <div className="login-page">
      <div className="login-shell fade-in">
        <section className="login-panel" aria-label="Mosh Automation login">
          <div className="login-panel-header">
            <img className="login-panel-logo" src="/logo%20background.png" alt="Mosh Automation logo" />
            <p className="login-panel-title">Create Account at Mosh Automation</p>
            
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

