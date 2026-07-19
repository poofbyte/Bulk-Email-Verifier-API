import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, Activity, Plus, RefreshCw, Copy, Check, Trash2, Edit, User, Settings, LogOut } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { 
  listApiKeys, 
  deactivateApiKey, 
  reactivateApiKey, 
  updateKeyTier, 
  deleteApiKey,
  clearAdminKey 
} from '@/api/client';
import type { AdminApiKeyList } from '@/types';

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keys, setKeys] = useState<AdminApiKeyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [newTier, setNewTier] = useState<string>('free');

  useEffect(() => {
    // Check for admin key
    const storedAdminKey = localStorage.getItem('bev_admin_key');
    if (storedAdminKey) {
      setApiKey(storedAdminKey);
    } else {
      // Prompt for admin key if not set
      const inputKey = prompt('Enter Admin API Key to access admin panel:');
      if (inputKey) {
        localStorage.setItem('bev_admin_key', inputKey);
        setApiKey(inputKey);
      } else {
        logout();
      }
    }
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const res = await listApiKeys();
      if (res.success) {
        setKeys(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load API keys');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      const res = await deactivateApiKey(id);
      if (res.success) {
        loadKeys();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate key');
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      const res = await reactivateApiKey(id);
      if (res.success) {
        loadKeys();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate key');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;
    try {
      const res = await deleteApiKey(id);
      if (res.success) {
        loadKeys();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete key');
    }
  };

  const handleUpdateTier = async (id: number) => {
    try {
      const res = await updateKeyTier(id, newTier as 'free' | 'pro' | 'enterprise');
      if (res.success) {
        setEditingKey(null);
        loadKeys();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tier');
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = () => {
    clearAdminKey();
    logout();
  };

  const tierConfig: Record<string, { label: string; requests: number; batch: number; daily: number | string }> = {
    free: { label: 'Free', requests: 10, batch: 50, daily: 500 },
    pro: { label: 'Pro', requests: 100, batch: 1000, daily: 50000 },
    enterprise: { label: 'Enterprise', requests: 1000, batch: 10000, daily: 'Unlimited' },
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-xs text-brand-500 font-mono">Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="py-4 flex-1 flex flex-col justify-start">
      <div className="max-w-5xl w-full mx-auto px-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-accent-600" />
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900">Admin Dashboard</h1>
            </div>
            <p className="text-xs text-brand-500">Manage API keys, view usage, and configure system settings</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>

        {/* User Info */}
        <div className="bg-white border border-brand-200 rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-brand-900">{user?.name}</p>
            <p className="text-[10px] text-brand-500 font-mono">{user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-brand-500">Admin Access</p>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-success-solid" />
              <span className="text-xs font-medium text-success-text">Active</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-danger-soft border border-danger-border text-danger-text text-xs rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-[10px] text-brand-500 uppercase font-bold mb-1">Total Keys</p>
              <p className="text-2xl font-bold text-brand-900">{keys.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] text-brand-500 uppercase font-bold mb-1">Active Keys</p>
              <p className="text-2xl font-bold text-success-text">
                {keys.filter(k => k.active).length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] text-brand-500 uppercase font-bold mb-1">Free Tier</p>
              <p className="text-2xl font-bold text-brand-900">{keys.filter(k => k.tier === 'free').length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] text-brand-500 uppercase font-bold mb-1">Pro Tier</p>
              <p className="text-2xl font-bold text-brand-900">{keys.filter(k => k.tier === 'pro').length}</p>
            </Card>
          </div>

          {/* API Key Management */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-500" />
                  <h2 className="text-xs font-bold text-brand-900 uppercase tracking-wider">API Keys</h2>
                </div>
                <span className="text-[10px] text-brand-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                  {keys.length} keys
                </span>
              </div>

              {keys.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto mb-3 flex items-center justify-center">
                    <Key className="w-6 h-6 text-brand-400" />
                  </div>
                  <p className="text-xs text-brand-500 mb-4">No API keys found. Create one below.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-neutral-50 text-brand-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Key Name</th>
                        <th className="px-4 py-3 text-left">Tier</th>
                        <th className="px-4 py-3 text-left">Prefix</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-100">
                      {keys.map((key) => (
                        <tr key={key.id} className="hover:bg-brand-50/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-brand-900">{key.name}</div>
                            {key.last_used_at && (
                              <div className="text-[9px] text-brand-400">
                                Last used: {new Date(key.last_used_at).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium ${
                              key.tier === 'free' ? 'bg-neutral-100 text-brand-700' :
                              key.tier === 'pro' ? 'bg-accent-100 text-accent-700' :
                              'bg-success-soft text-success-text'
                            }`}>
                              {tierConfig[key.tier]?.label || key.tier}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-brand-500">
                            <div className="flex items-center gap-2">
                              {key.key_prefix}
                              <button
                                onClick={() => copyToClipboard(key.key_prefix, key.id)}
                                className="hover:text-brand-700"
                              >
                                {copiedId === key.id ? (
                                  <Check className="w-3 h-3 text-success-solid" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 ${
                              key.active ? 'text-success-text' : 'text-danger-text'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                key.active ? 'bg-success-solid' : 'bg-danger-solid'
                              }`} />
                              {key.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {editingKey === key.id ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={newTier}
                                    onChange={(e) => setNewTier(e.target.value)}
                                    className="border border-brand-200 rounded px-2 py-1 text-[9px]"
                                  >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                  </select>
                                  <Button size="sm" onClick={() => handleUpdateTier(key.id)}>
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  {key.active && (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingKey(key.id)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {key.active ? (
                                    <Button variant="ghost" size="sm" onClick={() => handleDeactivate(key.id)}>
                                      <Trash2 className="w-3 h-3 text-danger-text" />
                                    </Button>
                                  ) : (
                                  <Button variant="ghost" size="sm" onClick={() => handleReactivate(key.id)}>
                                      <RefreshCw className="w-3 h-3 text-brand-600" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* System Status */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-brand-500" />
                <h2 className="text-xs font-bold text-brand-900 uppercase tracking-wider">System Status</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-500">Database</span>
                  <span className="text-xs font-medium text-success-text flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success-solid" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-500">API Server</span>
                  <span className="text-xs font-medium text-success-text flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success-solid" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-500">Validation Engine</span>
                  <span className="text-xs font-medium text-success-text flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success-solid" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-500">Daily Limit</span>
                  <span className="text-xs font-medium text-brand-900">Enabled</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-100">
                <p className="text-[10px] text-brand-400 mb-2">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" onClick={loadKeys}>
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </Button>
                  <Link to="/dashboard" className="text-[10px] text-accent-600 hover:text-accent-700 font-medium text-center block py-1.5 px-2 rounded bg-white border border-brand-200 hover:bg-neutral-50">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}