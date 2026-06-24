import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircleGauge, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from '../components/ui/Feedback';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  function fillDemo(role: 'admin' | 'manager' | 'sales') {
    setEmail(`${role}@herocycles.com`);
    setPassword('Password123!');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <CircleGauge className="h-9 w-9 text-forge-400" />
          <h1 className="text-xl font-semibold text-white">Hero Cycles Pricing Engine</h1>
          <p className="text-sm text-steel-400">Sign in to manage parts, configurations, and pricing</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorBanner message={error} />}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-steel-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@herocycles.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-steel-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              <LogIn className="h-4 w-4" />
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-md border border-steel-700 bg-steel-800/50 p-3 text-center text-xs text-steel-400">
          <p className="mb-2">Demo accounts (password: Password123!)</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => fillDemo('admin')} className="rounded bg-steel-700 px-2 py-1 text-steel-200 hover:bg-steel-600">
              Admin
            </button>
            <button onClick={() => fillDemo('manager')} className="rounded bg-steel-700 px-2 py-1 text-steel-200 hover:bg-steel-600">
              Manager
            </button>
            <button onClick={() => fillDemo('sales')} className="rounded bg-steel-700 px-2 py-1 text-steel-200 hover:bg-steel-600">
              Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
