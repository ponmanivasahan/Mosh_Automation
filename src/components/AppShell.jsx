import { NavLink } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AppShell = ({ title, links, children }) => {
  const { session, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mosh Automation</p>
          <h1>{title}</h1>
          <p className="identity">
            {session?.name} ({session?.phone})
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={logout}>
          Logout
        </button>
      </header>

      <nav className="nav-tabs">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  );
};

export default AppShell;
