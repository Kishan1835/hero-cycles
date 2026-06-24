import { useState, FormEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { usePriceHistory, useAddPrice } from '../../hooks/usePricing';
import { Spinner, ErrorBanner } from '../ui/Feedback';
import { Part } from '../../types/domain';
import { useAuth } from '../../context/AuthContext';

export function PriceHistoryDrawer({ part, onClose }: { part: Part; onClose: () => void }) {
  const { user } = useAuth();
  const { data: history, isLoading, error } = usePriceHistory(part.id);
  const addPrice = useAddPrice(part.id);
  const [cost, setCost] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canEditPricing = user?.role === 'PRICING_MANAGER' || user?.role === 'ADMIN';

  async function handleAddPrice(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await addPrice.mutateAsync({ cost: parseFloat(cost), effectiveDate, note: note || undefined });
      setCost('');
      setNote('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add price');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-steel-900/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-steel-900">{part.name}</h2>
            <p className="font-mono text-xs text-steel-500">{part.sku}</p>
          </div>
          <button onClick={onClose} className="text-steel-400 hover:text-steel-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {canEditPricing && (
          <form onSubmit={handleAddPrice} className="my-5 space-y-3 rounded-md border border-steel-200 bg-steel-50 p-4">
            <p className="text-sm font-medium text-steel-700">Add new price point</p>
            {formError && <ErrorBanner message={formError} />}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                required
                placeholder="Cost (₹)"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="input-field"
              />
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="input-field"
              />
            </div>
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
            />
            <button type="submit" disabled={addPrice.isPending} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              {addPrice.isPending ? 'Adding…' : 'Add price point'}
            </button>
          </form>
        )}

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">Price history</h3>
        {isLoading && <Spinner />}
        {error && <ErrorBanner message={error.message} />}

        <div className="space-y-2">
          {history?.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-steel-100 px-3 py-2">
              <div>
                <p className="font-mono text-sm font-semibold text-steel-900">
                  ₹{Number(p.cost).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-steel-500">
                  Effective {new Date(p.effectiveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {p.note ? ` · ${p.note}` : ''}
                </p>
              </div>
              {idx === 0 && <span className="badge bg-green-50 text-green-700 ring-1 ring-inset ring-green-200">Current</span>}
            </div>
          ))}
          {history?.length === 0 && <p className="text-sm text-steel-400">No price history yet.</p>}
        </div>
      </div>
    </div>
  );
}
