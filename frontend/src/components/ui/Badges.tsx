import { clsx } from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
  DISCONTINUED: 'bg-steel-100 text-steel-500 ring-1 ring-inset ring-steel-200',
  DRAFT: 'bg-brass-500/10 text-brass-500 ring-1 ring-inset ring-brass-500/30',
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-forge-50 text-forge-700 ring-1 ring-inset ring-forge-200',
  PRICING_MANAGER: 'bg-steel-100 text-steel-700 ring-1 ring-inset ring-steel-300',
  SALESPERSON: 'bg-steel-50 text-steel-600 ring-1 ring-inset ring-steel-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', STATUS_STYLES[status] ?? 'bg-steel-100 text-steel-600')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={clsx('badge', ROLE_STYLES[role] ?? 'bg-steel-100 text-steel-600')}>
      {role.replace('_', ' ')}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="badge bg-steel-50 text-steel-600 ring-1 ring-inset ring-steel-200">
      {category.replace('_', ' ')}
    </span>
  );
}
