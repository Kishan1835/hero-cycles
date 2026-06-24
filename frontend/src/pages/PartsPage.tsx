import { useState } from 'react';
import { Plus, Search, Trash2, History } from 'lucide-react';
import { useParts, useDeletePart } from '../hooks/useParts';
import { Spinner, ErrorBanner, EmptyState } from '../components/ui/Feedback';
import { StatusBadge, CategoryBadge } from '../components/ui/Badges';
import { CreatePartForm } from '../components/parts/CreatePartForm';
import { PriceHistoryDrawer } from '../components/parts/PriceHistoryDrawer';
import { useAuth } from '../context/AuthContext';
import { Part } from '../types/domain';

const CATEGORIES = ['FRAME', 'GEAR_SET', 'TYRE', 'BRAKE', 'SEAT', 'HANDLEBAR', 'CHAIN', 'PEDAL', 'OTHER'];

export function PartsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useParts({ search: search || undefined, category: category || undefined, page, pageSize: 10 });
  const deletePart = useDeletePart();

  const canManageParts = user?.role === 'PRICING_MANAGER' || user?.role === 'ADMIN';
  const canDeleteParts = user?.role === 'ADMIN';

  async function handleDelete(part: Part) {
    if (!window.confirm(`Delete "${part.name}"? This cannot be undone.`)) return;
    try {
      await deletePart.mutateAsync(part.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete part');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-steel-900">Parts catalog</h1>
          <p className="text-sm text-steel-500">Manage components used across bicycle configurations.</p>
        </div>
        {canManageParts && (
          <button onClick={() => setShowCreateForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add part
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
          <input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9"
          />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input-field w-48">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message={error.message} />}

      {data && data.items.length === 0 && (
        <EmptyState title="No parts found" description="Try adjusting your search or filters." />
      )}

      {data && data.items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-steel-200 bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {data.items.map((part) => (
                <tr key={part.id} className="hover:bg-steel-50/60">
                  <td className="px-4 py-3 font-medium text-steel-900">{part.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-steel-500">{part.sku}</td>
                  <td className="px-4 py-3"><CategoryBadge category={part.category} /></td>
                  <td className="px-4 py-3"><StatusBadge status={part.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedPart(part)}
                        className="rounded p-1.5 text-steel-500 hover:bg-steel-100 hover:text-steel-700"
                        title="View price history"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      {canDeleteParts && (
                        <button
                          onClick={() => handleDelete(part)}
                          className="rounded p-1.5 text-steel-500 hover:bg-forge-50 hover:text-forge-600"
                          title="Delete part"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-steel-200 px-4 py-3 text-sm text-steel-500">
              <span>
                Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} parts
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateForm && <CreatePartForm onClose={() => setShowCreateForm(false)} />}
      {selectedPart && <PriceHistoryDrawer part={selectedPart} onClose={() => setSelectedPart(null)} />}
    </div>
  );
}
