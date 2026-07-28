import { useState, useEffect } from 'react';
import { Shield, User, ToggleLeft, ToggleRight, Check, Users, Clock } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { formatDateTime } from '../../../utils/format';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/settings', label: 'Settings' }
];

const AdminSettingsPage = () => {
  const [users, setUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', { credentials: 'include' });
      const data = await response.json();
      if (data.success && data.users) {
        setUsers(data.users);
        localStorage.setItem('mosh_users', JSON.stringify(data.users));
      }
    } catch (e) {
      // Offline fallback
      const raw = localStorage.getItem('mosh_users');
      if (raw) setUsers(JSON.parse(raw));
    }
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 5000); // 5s interval is perfect
    return () => clearInterval(interval);
  }, []);

  const toggleUserRole = async (phone) => {
    const targetUser = users.find(u => u.phone === phone);
    if (!targetUser) return;

    const nextRole = targetUser.role === 'admin' ? 'customer' : 'admin';

    try {
      const response = await fetch(`http://localhost:5000/api/auth/users/${phone}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setToastMessage(`Role for ${targetUser.name} changed to ${nextRole.toUpperCase()} successfully.`);
        loadUsers();
      } else {
        setToastMessage(`Error: ${data.message}`);
      }
    } catch (e) {
      setToastMessage('Failed to update role on database.');
      // Offline fallback
      const updatedUsers = users.map(u => u.phone === phone ? { ...u, role: nextRole } : u);
      localStorage.setItem('mosh_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <AppShell title="Portal Settings" links={adminLinks}>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded bg-teal-600 text-white border border-teal-500 font-bold text-xs shadow-xl">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="bg-slate-100 border border-slate-200/80 p-6 rounded space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-teal-600" />
                User Access Registry
              </h2>
              <p className="text-xs text-slate-500 mt-1">Manage portal member credentials, admin access rights, and change account roles instantly.</p>
            </div>
            <span className="text-xs bg-white border px-3 py-1.5 rounded-full font-bold shadow-sm text-slate-600">
              {users.length} Registered Users
            </span>
          </div>

          {/* Unified Users Table */}
          <div className="bg-white border border-slate-200 rounded overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-bold text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Current Role</th>
                  <th className="p-4">Login Date & Time</th>
                  <th className="p-4 text-right">Options / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.phone} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-900 font-bold">{user.name}</td>
                    <td className="p-4 font-bold text-slate-500">{user.phone}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-bold flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-300" />
                      <span>{user.loggedInAt ? formatDateTime(user.loggedInAt) : 'N/A'}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleUserRole(user.phone)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold border transition ${
                          user.role === 'admin' 
                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                            : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <ToggleLeft size={14} /> Convert to Customer
                          </>
                        ) : (
                          <>
                            <ToggleRight size={14} /> Convert to Admin
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic font-bold">
                      No registered portal users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </AppShell>
  );
};

export default AdminSettingsPage;
