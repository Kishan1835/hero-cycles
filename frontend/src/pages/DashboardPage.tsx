import { Package, Bike, Users, TrendingUp } from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboard';
import { Spinner, ErrorBanner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-steel-100 text-steel-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-steel-900">{value}</p>
        <p className="text-sm text-steel-500">{label}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboardSummary();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-steel-900">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-sm text-steel-500">Here's what's happening with pricing today.</p>
      </div>

      {isLoading && <Spinner label="Loading dashboard…" />}
      {error && <ErrorBanner message={error.message} />}

      {data && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Package} label="Active parts" value={data.kpis.totalActiveParts} />
            <KpiCard icon={Bike} label="Active configurations" value={data.kpis.activeConfigurations} />
            <KpiCard icon={Users} label="Active users" value={data.kpis.activeUsers} />
            <KpiCard icon={TrendingUp} label="Price changes (30d)" value={data.kpis.priceChangesLast30Days} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel-500">
                Top configurations
              </h2>
              <div className="space-y-3">
                {data.topConfigurations.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b border-steel-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-steel-900">{c.name}</p>
                      <p className="text-xs text-steel-500">{c.modelCode} · {c.partCount} components</p>
                    </div>
                    <p className="font-mono text-sm font-semibold text-steel-700">
                      ₹{c.totalCost.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
                {data.topConfigurations.length === 0 && (
                  <p className="text-sm text-steel-400">No configurations yet.</p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-steel-500">
                Recent activity
              </h2>
              <div className="space-y-3">
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-2 border-b border-steel-100 pb-3 text-sm last:border-0 last:pb-0">
                    <div>
                      <span className="font-medium text-steel-800">{a.actor}</span>{' '}
                      <span className="text-steel-500">
                        {a.action.toLowerCase().replace('_', ' ')}d a {a.entityType.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-steel-400">
                      {new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
                {data.recentActivity.length === 0 && (
                  <p className="text-sm text-steel-400">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
