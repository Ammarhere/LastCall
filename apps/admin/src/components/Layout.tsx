import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/auth';
import clsx from 'clsx';

const NAV = [
  { to: '/',          label: '📊 Dashboard' },
  { to: '/partners',  label: '🏪 Partners' },
  { to: '/orders',    label: '📦 Orders' },
  { to: '/bags',      label: '🛍️ Bags' },
  { to: '/users',     label: '👥 Customers' },
  { to: '/payouts',   label: '💸 Payouts' },
  { to: '/impact',    label: '🌍 Impact' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="text-2xl font-black text-green-600">🛍️ Last Call</div>
          <div className="text-xs text-gray-400 mt-1">Admin Dashboard</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx('flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', {
                  'bg-green-50 text-green-700': isActive,
                  'text-gray-600 hover:bg-gray-100': !isActive,
                })
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
