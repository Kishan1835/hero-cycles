import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Bike } from 'lucide-react';
import { useConfigurations } from '../hooks/useConfigurations';
import { Spinner, ErrorBanner, EmptyState } from '../components/ui/Feedback';
import { ConfigurationBuilder } from '../components/configurations/ConfigurationBuilder';

export function ConfigurationsPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const { data, isLoading, error } = useConfigurations({ isActive: true });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-steel-900">Bicycle configurations</h1>
          <p className="text-sm text-steel-500">Models built from your parts catalog.</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New configuration
        </button>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message={error.message} />}

      {data && data.items.length === 0 && (
        <EmptyState
          title="No configurations yet"
          description="Build your first bicycle configuration from existing parts."
          action={
            <button onClick={() => setShowBuilder(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> New configuration
            </button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((config) => (
          <Link
            key={config.id}
            to={`/configurations/${config.id}`}
            className="card flex flex-col gap-3 p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-steel-400">
              <Bike className="h-5 w-5" />
              <span className="font-mono text-xs">{config.modelCode}</span>
            </div>
            <div>
              <h3 className="font-medium text-steel-900">{config.name}</h3>
              {config.description && <p className="mt-1 text-sm text-steel-500 line-clamp-2">{config.description}</p>}
            </div>
            <p className="text-xs text-steel-400">{config.parts.length} components</p>
          </Link>
        ))}
      </div>

      {showBuilder && <ConfigurationBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  );
}
