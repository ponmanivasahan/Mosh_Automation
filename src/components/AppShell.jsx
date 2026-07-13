import { NavLink } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AppShell = ({ title, links, children }) => {
  const { session, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">Mosh Automation</p>
          <h1>{title}</h1>
          <p className="identity">
            {session?.name} ({session?.phone})
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
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

        <button type="button" className="btn btn-outline sidebar-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="content-area">{children}</main>
    </div>
  );
};

export default AppShell;
