import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold tracking-tight text-brand-900">Welcome back</h1>
          <p className="text-xs text-brand-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-soft border border-danger-border text-danger-text text-xs rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-brand-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-brand-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-brand-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-brand-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="md">
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>

        <p className="text-center text-[11px] text-brand-500 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-600 hover:text-accent-700 font-medium">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
