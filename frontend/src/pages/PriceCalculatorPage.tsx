import { useState } from 'react';
import { Calculator, Calendar } from 'lucide-react';
import { useConfigurations } from '../hooks/useConfigurations';
import { useConfigurationPrice } from '../hooks/usePricing';
import { Spinner, ErrorBanner } from '../components/ui/Feedback';
import { CategoryBadge } from '../components/ui/Badges';

export function PriceCalculatorPage() {
  const [configId, setConfigId] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: configsData, isLoading: configsLoading } = useConfigurations({ isActive: true });
  const { data: pricing, isLoading, error } = useConfigurationPrice(configId || undefined, asOfDate);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-steel-900">Price calculator</h1>
        <p className="text-sm text-steel-500">
          Pick a configuration and a date to instantly see the total cost and component breakdown.
        </p>
      </div>

      <div className="card mb-6 flex flex-wrap items-end gap-4 p-5">
        <div className="min-w-[260px] flex-1">
          <label className="mb-1 block text-sm font-medium text-steel-700">Bicycle configuration</label>
          {configsLoading ? (
            <Spinner label="Loading configurations…" />
          ) : (
            <select value={configId} onChange={(e) => setConfigId(e.target.value)} className="input-field">
              <option value="">Select a configuration…</option>
              {configsData?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.modelCode})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-sm font-medium text-steel-700">
            <Calendar className="h-4 w-4" /> As of date
          </label>
          <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="input-field" />
        </div>
      </div>

      {!configId && (
        <div className="card flex flex-col items-center gap-3 p-16 text-center text-steel-400">
          <Calculator className="h-10 w-10" />
          <p>Select a configuration above to calculate its price.</p>
        </div>
      )}

      {configId && isLoading && <Spinner label="Calculating…" />}
      {configId && error && <ErrorBanner message={error.message} />}

      {configId && pricing && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-steel-200 bg-steel-50 px-5 py-4">
            <div>
              <p className="text-sm text-steel-500">{pricing.configurationName} · {pricing.modelCode}</p>
              <p className="text-xs text-steel-400">
                Priced as of {new Date(pricing.asOfDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <p className="font-mono text-2xl font-bold text-steel-900">₹{pricing.totalCost.toLocaleString('en-IN')}</p>
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-5 py-2 font-medium">Component</th>
                <th className="px-5 py-2 font-medium">Category</th>
                <th className="px-5 py-2 font-medium text-right">Qty</th>
                <th className="px-5 py-2 font-medium text-right">Unit cost</th>
                <th className="px-5 py-2 font-medium text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {pricing.breakdown.map((line) => (
                <tr key={line.partId}>
                  <td className="px-5 py-3 font-medium text-steel-900">{line.partName}</td>
                  <td className="px-5 py-3"><CategoryBadge category={line.category} /></td>
                  <td className="px-5 py-3 text-right">{line.quantity}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    {line.unitCost !== null ? `₹${line.unitCost.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">
                    {line.lineTotal !== null ? `₹${line.lineTotal.toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pricing.hasUnpricedComponents && (
            <div className="border-t border-brass-500/20 bg-brass-500/5 px-5 py-3 text-xs text-brass-500">
              Some components have no recorded price on this date and were excluded from the total.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
