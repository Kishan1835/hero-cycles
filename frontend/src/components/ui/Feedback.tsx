import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-steel-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-forge-200 bg-forge-50/60 p-4 text-sm text-forge-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-steel-200 py-16 text-center">
      <Inbox className="h-8 w-8 text-steel-300" />
      <div>
        <p className="font-medium text-steel-700">{title}</p>
        {description && <p className="mt-1 text-sm text-steel-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
