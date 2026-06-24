import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useCreatePart } from '../../hooks/useParts';
import { ErrorBanner } from '../ui/Feedback';

const PART_CATEGORIES = ['FRAME', 'GEAR_SET', 'TYRE', 'BRAKE', 'SEAT', 'HANDLEBAR', 'CHAIN', 'PEDAL', 'OTHER'];

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Select a category'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  initialCost: z.coerce.number().positive('Cost must be greater than 0'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
});

type FormValues = z.infer<typeof schema>;

export function CreatePartForm({ onClose }: { onClose: () => void }) {
  const createPart = useCreatePart();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { effectiveDate: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: FormValues) {
    await createPart.mutateAsync(values);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-steel-900/40 px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-steel-900">Add new part</h2>
          <button onClick={onClose} className="text-steel-400 hover:text-steel-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {createPart.isError && <ErrorBanner message={(createPart.error as Error).message} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-steel-700">Part name</label>
            <input className="input-field" placeholder="e.g. MRF Nylogrip Tyre 26&quot;" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-forge-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-steel-700">Category</label>
              <select className="input-field" {...register('category')}>
                <option value="">Select…</option>
                {PART_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-forge-600">{errors.category.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-steel-700">SKU</label>
              <input className="input-field" placeholder="TYR-MRF-26" {...register('sku')} />
              {errors.sku && <p className="mt-1 text-xs text-forge-600">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-steel-700">Initial cost (₹)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="200.00"
                {...register('initialCost')}
              />
              {errors.initialCost && <p className="mt-1 text-xs text-forge-600">{errors.initialCost.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-steel-700">Effective date</label>
              <input type="date" className="input-field" {...register('effectiveDate')} />
              {errors.effectiveDate && <p className="mt-1 text-xs text-forge-600">{errors.effectiveDate.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createPart.isPending} className="btn-primary">
              {createPart.isPending ? 'Creating…' : 'Create part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
