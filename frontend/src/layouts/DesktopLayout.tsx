import { KeyRound, LogOut, PackageCheck, ReceiptText, Truck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

const adminItems: NavItem[] = [
  { label: 'Invoices', path: '/invoices', icon: ReceiptText },
  { label: 'Clients', path: '/clients', icon: Users },
  { label: 'Deliveries', path: '/deliveries', icon: Truck },
];

const financeItems: NavItem[] = [
  { label: 'Invoices', path: '/invoices', icon: ReceiptText },
  { label: 'Clients', path: '/clients', icon: Users },
];

const courierItems: NavItem[] = [
  { label: 'Available', path: '/courier/available', icon: ReceiptText },
  { label: 'My deliveries', path: '/courier/my', icon: Truck },
];

const clientItems: NavItem[] = [{ label: 'My invoices', path: '/my/invoices', icon: PackageCheck }];

function getNavItems(role?: UserRole): NavItem[] {
  if (role === 'Admin') {
    return adminItems;
  }

  if (role === 'Finance') {
    return financeItems;
  }

  if (role === 'Courier') {
    return courierItems;
  }

  return clientItems;
}

function DesktopLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = getNavItems(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col border-x border-line bg-paper md:flex-row">
        <aside className="w-full shrink-0 border-b border-line bg-surface md:w-[240px] md:border-b-0 md:border-r">
          <div className="flex h-16 items-center border-b border-line px-5">
            <p className="text-base font-semibold uppercase tracking-[0.18em] text-route">TekFlow</p>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:block md:space-y-1 md:px-4 md:py-4">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  [
                    'flex shrink-0 items-center gap-3 rounded-[6px] border px-3 py-2.5 text-sm font-medium transition-colors md:flex md:w-full',
                    isActive
                      ? 'border-route/20 bg-route/5 text-route'
                      : 'border-transparent text-ink hover:border-line hover:bg-paper',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-line p-4">
            <div className="text-sm font-medium text-ink">{user?.fullName ?? 'User'}</div>
            <div className="mt-1 text-xs text-slate-500">{user?.role ?? 'Role'}</div>

            <button
              type="button"
              onClick={() => navigate('/change-password')}
              className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-route hover:text-route"
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 inline-flex items-center gap-2 rounded-[6px] border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-route hover:text-route"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-paper p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DesktopLayout;
