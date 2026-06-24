import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Cog,
  Bike,
  Calculator,
  Users,
  LogOut,
  CircleGauge,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/Badges';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/parts', label: 'Parts', icon: Cog },
  { to: '/configurations', label: 'Configurations', icon: Bike },
  { to: '/calculator', label: 'Price Calculator', icon: Calculator },
  { to: '/admin', label: 'Admin', icon: Users, adminOnly: true },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-steel-50">
      <aside className="flex w-64 flex-col border-r border-steel-200 bg-steel-900 text-steel-200">
        <div className="flex items-center gap-2 border-b border-steel-800 px-5 py-5">
          <CircleGauge className="h-6 w-6 text-forge-400" />
          <div>
            <p className="text-sm font-semibold text-white leading-none">Hero Cycles</p>
            <p className="text-xs text-steel-400 mt-0.5">Pricing Engine</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-steel-800 text-white'
                      : 'text-steel-300 hover:bg-steel-800/60 hover:text-white'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-steel-800 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-steel-400">{user?.email}</p>
            </div>
            {user && <RoleBadge role={user.role} />}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-steel-300 transition-colors hover:bg-steel-800/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
