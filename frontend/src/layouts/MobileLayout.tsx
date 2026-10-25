import { LogOut, PackageCheck, ReceiptText, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const courierItems: NavItem[] = [
  { label: 'Available', path: '/courier/available', icon: ReceiptText },
  { label: 'My deliveries', path: '/courier/my', icon: Truck },
];

const clientItems: NavItem[] = [{ label: 'My invoices', path: '/my/invoices', icon: PackageCheck }];

function getNavItems(role?: UserRole): NavItem[] {
  if (role === 'Courier') {
    return courierItems;
  }

  return clientItems;
}

function MobileLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = getNavItems(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper">
        <header className="border-b border-line bg-surface">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-route">TekFlow</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-[6px] border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-route hover:text-route"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>

          <div className="border-t border-line px-4 py-3">
            <div className="text-sm font-medium text-ink">{user?.fullName ?? 'User'}</div>
            <div className="text-xs text-slate-500">{user?.role ?? 'Role'}</div>
          </div>
        </header>

        <nav className="flex gap-2 border-b border-line bg-surface px-3 py-3">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                [
                  'flex flex-1 items-center justify-center gap-2 rounded-[6px] border px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'border-route/20 bg-route/5 text-route'
                    : 'border-transparent bg-paper text-ink',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MobileLayout;
