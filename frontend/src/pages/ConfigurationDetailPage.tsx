import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { useConfiguration, useUpdateConfigurationParts } from '../hooks/useConfigurations';
import { useConfigurationPrice } from '../hooks/usePricing';
import { Spinner, ErrorBanner } from '../components/ui/Feedback';
import { CategoryBadge } from '../components/ui/Badges';
import { useAuth } from '../context/AuthContext';

export function ConfigurationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: config, isLoading: configLoading, error: configError } = useConfiguration(id);
  const { data: pricing, isLoading: pricingLoading, error: pricingError } = useConfigurationPrice(id, asOfDate);
  const { removePart } = useUpdateConfigurationParts(id ?? '');

  const canEdit = user?.role === 'PRICING_MANAGER' || user?.role === 'ADMIN' || user?.role === 'SALESPERSON';

  async function handleRemove(partId: string, partName: string) {
    if (config && config.parts.length === 1) {
      window.alert('Cannot remove the last remaining part from a configuration.');
      return;
    }
    if (!window.confirm(`Remove "${partName}" from this configuration?`)) return;
    try {
      await removePart.mutateAsync(partId);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to remove part');
    }
  }

  if (configLoading) return <Spinner label="Loading configuration…" />;
  if (configError) return <ErrorBanner message={configError.message} />;
  if (!config) return null;

  return (
    <div>
      <Link to="/configurations" className="mb-4 inline-flex items-center gap-1 text-sm text-steel-500 hover:text-steel-700">
        <ArrowLeft className="h-4 w-4" /> Back to configurations
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-steel-900">{config.name}</h1>
          <p className="font-mono text-sm text-steel-500">{config.modelCode}</p>
          {config.description && <p className="mt-2 max-w-xl text-sm text-steel-600">{config.description}</p>}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-steel-200 bg-white px-3 py-2">
          <Calendar className="h-4 w-4 text-steel-400" />
          <label className="text-xs text-steel-500">Price as of</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="border-0 p-0 text-sm text-steel-700 focus:ring-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-steel-200 px-5 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-steel-500">Component breakdown</h2>
            </div>

            {pricingLoading && <Spinner />}
            {pricingError && <div className="p-5"><ErrorBanner message={pricingError.message} /></div>}

            {pricing && (
              <table className="w-full text-sm">
                <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Component</th>
                    <th className="px-5 py-2 font-medium">Category</th>
                    <th className="px-5 py-2 font-medium text-right">Qty</th>
                    <th className="px-5 py-2 font-medium text-right">Unit cost</th>
                    <th className="px-5 py-2 font-medium text-right">Line total</th>
                    {canEdit && <th className="px-5 py-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {pricing.breakdown.map((line) => (
                    <tr key={line.partId} className={!line.priced ? 'bg-brass-500/5' : undefined}>
                      <td className="px-5 py-3 font-medium text-steel-900">
                        {line.partName}
                        {!line.priced && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-brass-500">
                            <AlertTriangle className="h-3 w-3" /> No price on this date
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3"><CategoryBadge category={line.category} /></td>
                      <td className="px-5 py-3 text-right">{line.quantity}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        {line.unitCost !== null ? `₹${line.unitCost.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">
                        {line.lineTotal !== null ? `₹${line.lineTotal.toLocaleString('en-IN')}` : '—'}
                      </td>
                      {canEdit && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleRemove(line.partId, line.partName)}
                            className="text-steel-400 hover:text-forge-600"
                            title="Remove component"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-steel-200 bg-steel-50">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-right font-medium text-steel-700">
                      Total cost
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-lg font-bold text-steel-900">
                      ₹{pricing.totalCost.toLocaleString('en-IN')}
                    </td>
                    {canEdit && <td />}
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Configuration info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel-500">Created by</dt>
              <dd className="text-steel-800">{config.createdBy.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel-500">Created on</dt>
              <dd className="text-steel-800">
                {new Date(config.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel-500">Components</dt>
              <dd className="text-steel-800">{config.parts.length}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
