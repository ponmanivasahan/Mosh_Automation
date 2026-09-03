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
  Hash,
  AlertCircle
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
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
      <div className="space-y-6">
        {/* Top Control Panel */}
        <Card className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-4 bg-slate-50">
          <div>
            <p className="text-primary uppercase tracking-wider text-[10px] font-bold">Mosh Systems HQ</p>
            <h2 className="text-2xl font-bold text-slate-800">Customer Accounts & Sync</h2>
            <p className="text-xs text-slate-500 mt-1">
              Active directory of customer records populated directly from the central MySQL database.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => fetchCustomers(true)}
            isLoading={syncing}
          >
            {!syncing && <RefreshCw size={16} className="mr-2 text-slate-500" />}
            <span>Sync Now</span>
          </Button>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Customers</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-2 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              {customers.length}
            </h3>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Status</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-2 flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-500" />
              {stats.activeCustomers}
            </h3>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
            <h3 className="text-2xl font-extrabold text-teal-600 mt-2 flex items-center gap-2">
              <ShoppingCart size={20} className="text-teal-500" />
              {stats.totalOrders}
            </h3>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Queries</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-2 flex items-center gap-2">
              <ClipboardList size={20} className="text-amber-500" />
              {stats.totalQueries}
            </h3>
          </Card>
          <Card className="p-5 col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Reviews</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-2 flex items-center gap-2">
              <MessageSquare size={20} className="text-rose-500" />
              {stats.totalReviews}
            </h3>
          </Card>
        </div>

        {/* Search bar */}
        <Card className="flex items-center p-2">
          <Search size={18} className="text-slate-400 ml-3" />
          <input
            type="text"
            placeholder="Search customers by name, phone, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none font-medium text-slate-800"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mr-2"
            >
              Clear
            </Button>
          )}
        </Card>

        {/* Customer List Panel */}
        <Card className="p-5 md:p-6">
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
              <p className="text-xs text-slate-500 mt-3 font-semibold">Connecting to live MySQL database...</p>
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Connection Error"
              description={error}
              action={
                <Button variant="danger" onClick={() => fetchCustomers(true)}>
                  Retry Connection
                </Button>
              }
            />
          ) : !filteredCustomers.length ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="No customers found matching search criteria."
            />
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
                          <div className="flex items-center gap-1 text-slate-800">
                            <Phone size={12} className="text-primary" />
                            <span>{cust.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail size={12} className="text-slate-400" />
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
                        <Badge variant={cust.status === 'Active' ? 'success' : 'default'}>
                          {cust.status}
                        </Badge>
                      </td>

                      {/* Metrics counts & Actions */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-3 text-[11px] font-bold">
                          <Badge variant="primary" className="gap-1 px-2">
                            <ShoppingCart size={11} /> {cust.numOrders}
                          </Badge>
                          <Badge variant="warning" className="gap-1 px-2">
                            <ClipboardList size={11} /> {cust.numQueries}
                          </Badge>
                          <Badge variant="info" className="gap-1 px-2">
                            <MessageSquare size={11} /> {cust.numReviews}
                          </Badge>
                          <Button
                            variant="danger"
                            size="sm"
                            className="ml-2"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete customer ${cust.name}?`)) {
                                try {
                                  const res = await fetch(`${API_URL}/api/auth/users/${cust.phone}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                  if (res.ok) {
                                    fetchCustomers(true);
                                  } else {
                                    alert('Failed to delete customer');
                                  }
                                } catch (e) {
                                  alert('Error deleting customer');
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
};

export default AdminCustomersPage;
