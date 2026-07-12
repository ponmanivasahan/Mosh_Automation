import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginPhones } from '../data/defaults';
import { useAuth } from '../utils/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const getRoleFromPhone = (value) => {
    if (value === loginPhones.customer) {
      return 'customer';
    }

    if (value === loginPhones.admin) {
      return 'admin';
    }

    return null;
  };

  const submit = (event) => {
    event.preventDefault();
    const cleaned = phone.trim();
    const role = getRoleFromPhone(cleaned);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!role) {
      setError('Phone number not recognized. Please enter a valid registered number.');
      return;
    }

    const payload = {
      role,
      name: name.trim(),
      phone: cleaned,
      loggedInAt: new Date().toISOString()
    };

    login(payload);
    navigate(role === 'admin' ? '/admin/dashboard' : '/customer/products');
  };

  return (
    <div className="login-wrap">
      <section className="login-card">
        <p className="eyebrow">Automation Workflow Portal</p>
        <h1>Mosh Automation Access</h1>
        <p className="subtle">Role is automatically confirmed from your phone number.</p>

        <form className="form-grid" onSubmit={submit}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </label>

          <label>
            Phone Number
            <input
              type="password"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              maxLength={10}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
      </section>
    </div>
  );
};

export default LoginPage;
