import { useState, FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useParts } from '../../hooks/useParts';
import { useCreateConfiguration } from '../../hooks/useConfigurations';
import { ErrorBanner, Spinner } from '../ui/Feedback';

interface SelectedPart {
  partId: string;
  name: string;
  sku: string;
  quantity: number;
}

export function ConfigurationBuilder({ onClose }: { onClose: () => void }) {
  const { data: partsData, isLoading } = useParts({ status: 'ACTIVE', pageSize: 100 });
  const createConfig = useCreateConfiguration();

  const [name, setName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [partToAdd, setPartToAdd] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addPart() {
    if (!partToAdd) return;
    const part = partsData?.items.find((p) => p.id === partToAdd);
    if (!part || selectedParts.some((sp) => sp.partId === part.id)) return;
    setSelectedParts((prev) => [...prev, { partId: part.id, name: part.name, sku: part.sku, quantity: 1 }]);
    setPartToAdd('');
  }

  function updateQuantity(partId: string, quantity: number) {
    setSelectedParts((prev) => prev.map((p) => (p.partId === partId ? { ...p, quantity } : p)));
  }

  function removePart(partId: string) {
    setSelectedParts((prev) => prev.filter((p) => p.partId !== partId));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedParts.length === 0) {
      setError('Add at least one component to the configuration.');
      return;
    }

    try {
      await createConfig.mutateAsync({
        name,
        modelCode,
        description: description || undefined,
        parts: selectedParts.map((p) => ({ partId: p.partId, quantity: p.quantity })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create configuration');
    }
  }

  const availableParts = partsData?.items.filter((p) => !selectedParts.some((sp) => sp.partId === p.id)) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-steel-900/40 px-4 py-8">
      <div className="card flex max-h-full w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-steel-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-steel-900">New bicycle configuration</h2>
          <button onClick={onClose} className="text-steel-400 hover:text-steel-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-steel-700">Configuration name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Hero Sprint Sport 27.5" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-steel-700">Model code</label>
              <input required value={modelCode} onChange={(e) => setModelCode(e.target.value)} className="input-field" placeholder="HC-SPORT-275" />
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-steel-700">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={2} />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-steel-700">Add components</label>
            {isLoading ? (
              <Spinner label="Loading parts…" />
            ) : (
              <div className="flex gap-2">
                <select value={partToAdd} onChange={(e) => setPartToAdd(e.target.value)} className="input-field flex-1">
                  <option value="">Select a part…</option>
                  {availableParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addPart} className="btn-secondary">
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {selectedParts.map((p) => (
              <div key={p.partId} className="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-steel-900">{p.name}</p>
                  <p className="font-mono text-xs text-steel-500">{p.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-steel-500">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={p.quantity}
                    onChange={(e) => updateQuantity(p.partId, Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 rounded border border-steel-300 px-2 py-1 text-sm"
                  />
                  <button type="button" onClick={() => removePart(p.partId)} className="text-steel-400 hover:text-forge-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {selectedParts.length === 0 && (
              <p className="rounded-md border border-dashed border-steel-200 px-3 py-4 text-center text-sm text-steel-400">
                No components added yet
              </p>
            )}
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-steel-200 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={createConfig.isPending} className="btn-primary">
            {createConfig.isPending ? 'Creating…' : 'Create configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
