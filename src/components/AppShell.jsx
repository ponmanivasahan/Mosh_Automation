import { NavLink } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useEffect, useState } from 'react';
import { getCart } from '../utils/storage';

const iconMap = {
  Dashboard: LayoutDashboard,
  Products: Package,
  'Product Management': Package,
  Cart: ShoppingCart,
  'Cart & Order Details': ShoppingCart,
  Estimations: ClipboardList,
  Queries: ClipboardList,
  'Query Management': ClipboardList,
  'Rate & Reviews': MessageSquare,
  Reviews: MessageSquare,
  'Success Stories': Sparkles,
  'Help Center': HelpCircle
};

const AppShell = ({ title, links, children }) => {
  const { session, logout } = useAuth();
  const [cartCount, setCartCount] = useState(() => getCart().length);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => setCartCount(Array.isArray(e?.detail) ? e.detail.length : getCart().length);
    window.addEventListener('mosh_cart_updated', handler);
    return () => window.removeEventListener('mosh_cart_updated', handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3 sticky top-0 z-40 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded hover:bg-slate-100" type="button">
          <Menu size={20} className="text-slate-600" />
        </button>
        <span className="font-extrabold text-xs uppercase tracking-wider text-teal-700">Mosh Automation</span>
        <div className="w-8"></div>
      </header>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-full max-w-[320px] overflow-hidden border-r border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,118,110,0.06)] transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="flex h-full flex-col justify-between px-6 py-8 relative">
          {/* Close button for mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 rounded hover:bg-slate-100 absolute top-4 right-4 z-50"
          >
            <X size={18} className="text-slate-500" />
          </button>

          <div className="space-y-8">
            <div className="flex items-center gap-4 rounded-3xl bg-slate-100/80 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
              <img src="/logo background.png" alt="Mosh Automation" className="h-12 w-12 rounded-2xl object-cover" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-teal-700/80">Mosh Automation</p>
                <p className="text-sm text-slate-500">{session?.role === 'admin' ? 'Admin Portal' : 'Customer Portal'}</p>
              </div>
            </div>

           

            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = iconMap[link.label] || LayoutDashboard;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? 'border-l-4 border-teal-600 bg-teal-50 text-slate-900 shadow-sm shadow-teal-100'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 transition-colors duration-300 group-hover:text-teal-600" />
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

        
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base shadow-sm">
                    {session?.name?.[0] || 'G'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-0.5">Signed in as</p>
                    <p className="text-sm font-bold tracking-tight text-slate-900 truncate leading-tight">
                      {session?.name || 'Guest'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {session?.phone || '0000000000'}
                    </p>
                    <span className={`inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      session?.role === 'admin' 
                        ? 'bg-indigo-50 border-indigo-150 text-indigo-600' 
                        : 'bg-teal-50 border-teal-150 text-teal-600'
                    }`}>
                      {session?.role === 'admin' ? 'Admin Portal' : 'Customer Portal'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-600 bg-white px-4 py-3 text-teal-600 font-bold text-sm hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        
      </aside>

      <main className="ml-0 min-h-screen pt-6 pb-12 md:ml-[320px] overflow-x-hidden">
        <div className="mx-auto px-6 pb-12 md:px-10">
          <div className="mb-8">
            <div className="sticky top-6 z-30 bg-transparent">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                 
                </div>

                {session?.role !== 'admin' && (
                  <div className="inline-flex items-center gap-3 rounded-3xl bg-white/90 px-4 py-3 text-slate-700 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
                    <NavLink to="/customer/cart" className="relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                      <ShoppingCart className="h-5 w-5 text-slate-700" />
                      <span className="ml-2 text-sm font-semibold text-slate-900">View Cart</span>
                      <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">{cartCount}</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
