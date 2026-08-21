import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  RefreshCw, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingCart, 
  ClipboardList, 
  MessageSquare, 
  CheckCircle,
  Hash
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { API_URL } from '../../../utils/api';
import { formatDateTime } from '../../../utils/format';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/invoices', label: 'Billing' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/customers', label: 'Customers' }
];

const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchCustomers = async (showSyncState = false) => {
    if (showSyncState) setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/customers`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.');
        } else if (response.status === 403) {
          setError('You do not have permission to access this page.');
        } else if (response.status === 404) {
          setError('Customer API endpoint not found.');
        } else if (response.status === 500) {
          setError('Server error. Please try again.');
        } else {
          setError(`Server returned status code ${response.status}.`);
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setError('');
      } else {
        setError(data.message || 'Failed to retrieve customers.');
      }
    } catch (err) {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
      if (showSyncState) setSyncing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // Poll customers list every 3 seconds for real-time synchronization
    const interval = setInterval(() => fetchCustomers(false), 3000);
    return () => clearInterval(interval);
  }, []);

  // Filtered customer list by name, phone, email, ID
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.id.toString().includes(query)
      );
    });
  }, [customers, searchQuery]);

  // Overall counts for metric cards
  const stats = useMemo(() => {
    return customers.reduce(
      (acc, curr) => {
        acc.totalOrders += curr.numOrders;
        acc.totalQueries += curr.numQueries;
        acc.totalReviews += curr.numReviews;
        if (curr.status === 'Active') {
          acc.activeCustomers += 1;
        }
        return acc;
      },
      { totalOrders: 0, totalQueries: 0, totalReviews: 0, activeCustomers: 0 }
    );
  }, [customers]);

  return (
    <AppShell title="Customers Database" links={adminLinks}>
      <div className="admin-customers-page space-y-6">
        {/* Top Control Panel */}
        <header className="panel flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-100 p-6 rounded-lg border border-slate-200 gap-4">
          <div>
            <p className="text-teal-700 uppercase tracking-wider text-[10px] font-bold">Mosh Systems HQ</p>
            <h2 className="text-2xl font-bold text-slate-800">Customer Accounts & Sync</h2>
            <p className="text-xs text-slate-500 mt-1">
              Active directory of customer records populated directly from the central MySQL database.
            </p>
          </div>
          <button
            onClick={() => fetchCustomers(true)}
            className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl border shadow-sm text-xs font-bold transition duration-300"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin text-teal-600' : 'text-slate-500'} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Customers</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-2 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              {customers.length}
            </h3>
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Status</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-2 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-500" />
              {stats.activeCustomers}
            </h3>
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
            <h3 className="text-2xl font-extrabold text-teal-600 mt-2 flex items-center gap-2">
              <ShoppingCart size={20} className="text-teal-500" />
              {stats.totalOrders}
            </h3>
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Queries</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-2 flex items-center gap-2">
              <ClipboardList size={20} className="text-amber-500" />
              {stats.totalQueries}
            </h3>
          </div>
          <div className="bg-white border rounded-2xl p-5 shadow-sm col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Reviews</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-2 flex items-center gap-2">
              <MessageSquare size={20} className="text-rose-500" />
              {stats.totalReviews}
            </h3>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative bg-white rounded-2xl border p-2 flex items-center shadow-sm">
          <Search size={18} className="text-slate-400 ml-3" />
          <input
            type="text"
            placeholder="Search customers by name, phone, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none font-medium text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-3 py-1 rounded-xl hover:bg-slate-100 transition mr-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Customer List Panel */}
        <section className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw size={24} className="animate-spin text-teal-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-3 font-semibold">Connecting to live MySQL database...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-rose-50 border border-rose-100 rounded-xl p-6">
              <p className="text-sm text-rose-600 font-bold">{error}</p>
              <button 
                onClick={() => fetchCustomers(true)}
                className="mt-4 px-4 py-2 bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-bold"
              >
                Retry Connection
              </button>
            </div>
          ) : !filteredCustomers.length ? (
            <div className="text-center py-16">
              <Users size={32} className="text-slate-350 mx-auto mb-2" />
              <p className="text-sm text-slate-450 italic">No customers found matching search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Customer ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Registered Date</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right pr-2">Activities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.phone} className="hover:bg-slate-50/50 transition">
                      {/* Customer ID */}
                      <td className="py-4 pl-2 font-mono font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Hash size={12} className="text-slate-400" />
                          {cust.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-4 font-bold text-slate-800 text-sm">
                        {cust.name}
                      </td>

                      {/* Contact details */}
                      <td className="py-4 font-semibold text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-850">
                            <Phone size={12} className="text-teal-600" />
                            <span>{cust.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail size={12} className="text-slate-350" />
                            <span>{cust.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 font-semibold text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{cust.createdAt ? formatDateTime(cust.createdAt) : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 text-center">
                        <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          cust.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {cust.status}
                        </span>
                      </td>

                      {/* Metrics counts */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-3 text-[11px] font-bold">
                          <span className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded" title="Orders placed">
                            <ShoppingCart size={11} className="text-teal-600" />
                            {cust.numOrders}
                          </span>
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded" title=" Queries submitted">
                            <ClipboardList size={11} className="text-amber-500" />
                            {cust.numQueries}
                          </span>
                          <span className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded" title="Reviews written">
                            <MessageSquare size={11} className="text-rose-500" />
                            {cust.numReviews}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default AdminCustomersPage;
