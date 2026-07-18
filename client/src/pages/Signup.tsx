import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'key'>('form');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      // Get the API key from localStorage (set by signup)
      const key = localStorage.getItem('bev_api_key');
      if (key) setApiKey(key);
      setStep('key');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'key') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-full bg-success-soft border border-success-border flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-success-solid" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-brand-900">Account created</h1>
            <p className="text-xs text-brand-500 mt-1">Save your API key - it won't be shown again</p>
          </div>

          <div className="bg-neutral-50 border border-brand-200 rounded-md p-3 mb-4">
            <div className="flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-brand-700 break-all">{apiKey}</code>
              <button
                onClick={copyKey}
                className="shrink-0 p-1.5 rounded-md hover:bg-brand-100 transition-colors cursor-pointer"
                title="Copy key"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success-solid" /> : <Copy className="w-3.5 h-3.5 text-brand-500" />}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-brand-400 font-mono mb-4">
            Use this key as the X-API-Key header for all API requests.
          </p>

          <Button onClick={() => navigate('/dashboard')} className="w-full" size="md">
            Go to Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold tracking-tight text-brand-900">Create your account</h1>
          <p className="text-xs text-brand-500 mt-1">Start verifying emails in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-soft border border-danger-border text-danger-text text-xs rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-brand-700 mb-1">Name</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-brand-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Your name"
                required
              />
            </div>
          </div>

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
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="md">
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </form>

        <p className="text-center text-[11px] text-brand-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-600 hover:text-accent-700 font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
