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
  { to: '/admin/settings', label: 'Settings' }
];

const AdminSettingsPage = () => {
  const [users, setUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const loadUsers = () => {
    const raw = localStorage.getItem('mosh_users');
    if (raw) {
      setUsers(JSON.parse(raw));
    } else {
      // Seed with current default admin if mosh_users is empty
      const defaultAdmin = {
        name: 'Admin Staff',
        phone: '0987654321',
        role: 'admin',
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('mosh_users', JSON.stringify([defaultAdmin]));
      setUsers([defaultAdmin]);
    }
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 1500);
    return () => clearInterval(interval);
  }, []);

  const toggleUserRole = (phone) => {
    const updatedUsers = users.map(u => {
      if (u.phone === phone) {
        const nextRole = u.role === 'admin' ? 'customer' : 'admin';
        return { ...u, role: nextRole };
      }
      return u;
    });

    localStorage.setItem('mosh_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    const targetUser = updatedUsers.find(u => u.phone === phone);
    setToastMessage(`Role for ${targetUser.name} changed to ${targetUser.role.toUpperCase()} successfully.`);
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
