import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Sparkles,
  MessageSquare,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  X,
  Users,
  Receipt,
  MessageSquareQuote,
  Calculator,
  Star,
  Settings,
  LifeBuoy,
  ChevronRight,
  ShieldCheck,
  User,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useEffect, useState } from 'react';
import { getCart, getNotifications } from '../utils/storage';
import { customerLinks as defaultCustomerLinks, adminLinks as defaultAdminLinks } from '../utils/customerLinks';

const iconMap = {
  Dashboard: LayoutDashboard,
  Products: Package,
  'Product Management': Package,
  Invoices: Receipt,
  'Billing & Invoices': Receipt,
  Billing: Receipt,
  Queries: MessageSquareQuote,
  'Customer Queries': MessageSquareQuote,
  'My Queries': MessageSquareQuote,
  'Query Management': MessageSquareQuote,
  Cart: ShoppingCart,
  'Cart & Orders': ShoppingCart,
  'Cart & Order Details': ShoppingCart,
  Customers: Users,
  'Customer Directory': Users,
  'Customers Database': Users,
  Estimations: Calculator,
  'Estimation Tool': Calculator,
  'Estimation Calculator': Calculator,
  Reviews: Star,
  'Rate & Reviews': Star,
  'Customer Reviews': Star,
  'Reviews Manager': Star,
  'Customer Reviews Manager': Star,
  Stories: Sparkles,
  'Success Stories': Sparkles,
  'Success Stories Manager': Sparkles,
  Notifications: Bell,
  'Notifications Center': Bell,
  Settings: Settings,
  'Admin Settings': Settings,
  'Portal Settings': Settings,
  Help: LifeBuoy,
  'Help Center': LifeBuoy
};

const AppShell = ({ title, links, children }) => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(() => getCart().length);
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    try {
      return getNotifications().filter((n) => !n.read).length;
    } catch {
      return 0;
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const effectiveLinks = links || (session?.role === 'admin' ? defaultAdminLinks : defaultCustomerLinks);

  // Cart listener
  useEffect(() => {
    const handler = (e) => setCartCount(Array.isArray(e?.detail) ? e.detail.length : getCart().length);
    window.addEventListener('mosh_cart_updated', handler);
    return () => window.removeEventListener('mosh_cart_updated', handler);
  }, []);

  // Notifications listener
  useEffect(() => {
    const updateNotifs = () => {
      try {
        const notifs = getNotifications();
        setUnreadNotifications(notifs.filter((n) => !n.read).length);
      } catch {}
    };
    const interval = setInterval(updateNotifs, 3000);
    window.addEventListener('storage', updateNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateNotifs);
    };
  }, []);

  // Lock body scroll when mobile navigation drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const roleLabel = session?.role === 'admin' ? 'Admin Portal' : 'Customer Portal';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* ─── Mobile Top Header ─── */}
      <header className="lg:hidden flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden"
            type="button"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/logo background.png" alt="Mosh Logo" className="h-7 w-7 rounded-lg object-contain border border-slate-200/60" />
            <div>
              <span className="font-extrabold text-xs tracking-wider text-slate-900 block leading-tight">MOSH AUTOMATION</span>
              <span className="text-[10px] text-blue-700 font-semibold leading-none">{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.role === 'admin' ? (
            <NavLink
              to="/admin/notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </NavLink>
          ) : (
            <NavLink
              to="/customer/cart"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </NavLink>
          )}

          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-xs transition-opacity animate-fade-in"
        />
      )}

      {/* ─── Desktop Left Navigation Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="px-5 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shadow-xs">
                <img src="/logo background.png" alt="Mosh Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-extrabold text-sm tracking-wide text-slate-900 leading-tight">MOSH</p>
                <p className="text-[10px] font-bold tracking-widest text-blue-700 uppercase">Automation</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Role Pill Banner */}
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${session?.role === 'admin' ? 'bg-indigo-500' : 'bg-blue-500'} animate-pulse`} />
                <span className="font-semibold text-slate-700">{roleLabel}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">v1.2</span>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto no-scrollbar" aria-label="Sidebar navigation">
            {effectiveLinks.map((link) => {
              const Icon = iconMap[link.label] || LayoutDashboard;
              const isCartLink = link.to.includes('cart');
              const isNotifLink = link.to.includes('notifications');

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-900 border border-blue-200/80 shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                            isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="truncate">{link.label}</span>
                      </div>

                      {/* Dynamic item badges */}
                      {isCartLink && cartCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white min-w-4.5 shadow-xs">
                          {cartCount}
                        </span>
                      )}

                      {isNotifLink && unreadNotifications > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white min-w-4.5 shadow-xs">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-slate-100 bg-white space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-xs ${
                  session?.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
                }`}>
                  {session?.name ? session.name[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {session?.name || 'Authorized User'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {session?.phone || 'No phone'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Container ─── */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        
        {/* Top Header Bar for Desktop */}
        <header className="sticky top-0 z-30 hidden lg:flex items-center justify-between px-8 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-xs">
          {/* Breadcrumb & Section Info */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">{roleLabel}</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-bold text-slate-800">{title}</span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/70 text-xs font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>

            {/* Admin notifications button */}
            {session?.role === 'admin' && (
              <NavLink
                to="/admin/notifications"
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Notifications Center"
              >
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </NavLink>
            )}

            {/* Customer Cart Quick Button */}
            {session?.role !== 'admin' && (
              <NavLink
                to="/customer/cart"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors shadow-xs"
              >
                <ShoppingCart size={15} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="h-5 min-w-5 px-1.5 inline-flex items-center justify-center rounded-full bg-blue-700 text-white text-[10px] font-extrabold">
                    {cartCount}
                  </span>
                )}
              </NavLink>
            )}

            {/* Role switch / account preview */}
            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2 text-xs">
              <div className="text-right">
                <span className="block font-bold text-slate-800 leading-tight">{session?.name || 'User'}</span>
                <span className="text-[10px] text-slate-400 capitalize">{session?.role || 'Guest'}</span>
              </div>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs ${
                session?.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
              }`}>
                {session?.name ? session.name[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        {effectiveLinks.slice(0, 4).map((link) => {
          const Icon = iconMap[link.label] || LayoutDashboard;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? 'text-blue-700 scale-105' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="truncate max-w-[68px] leading-tight">{link.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}

        {/* 5th Button: Open Full Drawer Menu */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all"
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5" />
          <span className="leading-tight">More</span>
        </button>
      </nav>
    </div>
  );
};

export default AppShell;
