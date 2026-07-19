import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Key, ChartBar, Settings, Search, Plus, CheckCircle, Trash2,
  Edit, Lock, Unlock, Activity, LogOut
} from 'lucide-react';
import { api } from '../api/client';

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    active 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

const TierBadge = ({ tier }) => {
  const colors = {
    free: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pro: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tier] || colors.free}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
};

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [users, setUsers] = useState([]);
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '', name: '', password: '', tier: 'free', isActive: true, isAdmin: false
  });

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) setStats(response.data.data);
    } catch (err) { console.error('Failed to fetch stats:', err); }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { search: searchTerm, status: filterStatus, tier: filterTier, limit: 25, page: 1 }
      });
      if (response.data.success) setUsers(response.data.data.data || []);
    } catch (err) { console.error('Failed to fetch users:', err); }
  };

  const fetchKeys = async () => {
    try {
      const response = await api.get('/admin/keys');
      if (response.data.success) setKeys(response.data.data || []);
    } catch (err) { console.error('Failed to fetch keys:', err); }
  };

  useEffect(() => {
    const storedKey = localStorage.getItem('bev_admin_key');
    if (storedKey) {
      setIsAuthenticated(true);
      fetchStats();
      fetchUsers();
      fetchKeys();
    } else {
      setShowLoginModal(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('bev_admin_key', adminKey);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    fetchStats();
    fetchUsers();
    fetchKeys();
  };

  const handleLogout = () => {
    localStorage.removeItem('bev_admin_key');
    setIsAuthenticated(false);
    setUsers([]);
    setKeys([]);
    setStats(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/users', newUser);
      if (response.data.success) {
        setShowCreateUserModal(false);
        setNewUser({ email: '', name: '', password: '', tier: 'free', isActive: true, isAdmin: false });
        fetchUsers();
        alert('User created successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const response = await api.put(`/admin/users/${selectedUser.id}`, selectedUser);
      if (response.data.success) {
        setShowEditUserModal(false);
        setSelectedUser(null);
        fetchUsers();
        alert('User updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user and all their data?')) return;
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.data.success) { fetchUsers(); alert('User deleted successfully!'); }
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to delete user'); }
  };

  const handleToggleKey = async (keyId, currentStatus) => {
    try {
      if (currentStatus) await api.post(`/admin/keys/${keyId}/deactivate`);
      else await api.post(`/admin/keys/${keyId}/reactivate`);
      fetchKeys();
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to update key'); }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.users?.total || 0} subtitle="All registered users" icon={Users} color="bg-blue-500" />
        <StatCard title="Active Users" value={stats?.users?.active || 0} subtitle="Currently active" icon={CheckCircle} color="bg-green-500" />
        <StatCard title="API Keys" value={stats?.apiKeys?.total || 0} subtitle="Total keys generated" icon={Key} color="bg-purple-500" />
        <StatCard title="Today's Usage" value={stats?.usage?.today?.emails || 0} subtitle={`in ${stats?.usage?.today?.requests || 0} requests`} icon={Activity} color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">User Tier Distribution</h3>
          <div className="space-y-3">
            {stats?.distribution?.tiers?.map((tier, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 dark:text-slate-300 capitalize">{tier.tier}</span>
                  <span className="text-slate-900 dark:text-white font-medium">{tier.count}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(tier.count / (stats.users.total || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Database</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Connected and ready</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-full">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">API Server</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Running normally</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 rounded-full">Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Management</h3>
        <button onClick={() => setShowCreateUserModal(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </button>
      </div>
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
          <option value="">All Tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center"><Users className="w-12 h-12 text-slate-400 mb-3" /><p className="text-slate-500 dark:text-slate-400">No users found</p></div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><TierBadge tier={user.tier} /></td>
                  <td className="px-6 py-4"><StatusBadge active={!!user.is_active} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setSelectedUser(user); setShowEditUserModal(true); }} className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    {!user.is_admin && (
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderKeys = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Keys</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Key Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prefix</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Used</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {keys.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center"><Key className="w-12 h-12 text-slate-400 mb-3" /><p className="text-slate-500 dark:text-slate-400">No API keys found</p></div>
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4"><span className="font-medium text-slate-900 dark:text-white">{key.name}</span></td>
                  <td className="px-6 py-4"><code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm font-mono text-slate-600 dark:text-slate-300">{key.key_prefix}...</code></td>
                  <td className="px-6 py-4"><TierBadge tier={key.tier} /></td>
                  <td className="px-6 py-4"><StatusBadge active={!!key.active} /></td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{key.last_used_at || 'Never'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleToggleKey(key.id, key.active)} className="p-2 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700">
                      {key.active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Configuration</h3>
      </div>
      <div className="px-6 py-6 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Rate Limits by Tier</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['free', 'pro', 'enterprise'].map((tier) => (
              <div key={tier} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <h5 className="text-sm font-semibold text-slate-900 dark:text-white capitalize mb-2">{tier}</h5>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between"><span>Requests/min:</span><span className="font-medium">{stats?.tiers?.[tier]?.rateLimit || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Max batch size:</span><span className="font-medium">{stats?.tiers?.[tier]?.batchSize || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Daily emails:</span><span className="font-medium">{stats?.tiers?.[tier]?.dailyEmails || 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Admin Settings</h4>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Admin Key Status: <span className="font-medium">{process.env.ADMIN_KEY ? 'Configured' : 'Not Set'}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Note: Admin key is set in environment variables, not in the database.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Login Modal */}
      {showLoginModal && !isAuthenticated && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Access</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Please enter your admin API key to access the admin panel.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Admin API Key</label>
                <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Enter your admin API key" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Access Admin Panel</button>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input type="text" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input type="password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tier</label>
                  <select value={newUser.tier} onChange={(e) => setNewUser({ ...newUser, tier: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center"><input type="checkbox" checked={newUser.isActive} onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })} className="mr-2" /><span className="text-sm text-slate-700 dark:text-slate-300">Active</span></label>
                <label className="flex items-center"><input type="checkbox" checked={newUser.isAdmin} onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })} className="mr-2" /><span className="text-sm text-slate-700 dark:text-slate-300">Admin</span></label>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setShowCreateUserModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input type="text" value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tier</label>
                  <select value={selectedUser.tier} onChange={(e) => setSelectedUser({ ...selectedUser, tier: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Daily Limit</label>
                  <input type="number" value={selectedUser.daily_limit || 500} onChange={(e) => setSelectedUser({ ...selectedUser, daily_limit: parseInt(e.target.value) || 500 })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center"><input type="checkbox" checked={selectedUser.is_active} onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })} className="mr-2" /><span className="text-sm text-slate-700 dark:text-slate-300">Active</span></label>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setShowEditUserModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage users, API keys, and system settings</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="flex -mb-px space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ChartBar },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'keys', label: 'API Keys', icon: Key },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`
                py-4 px-1 border-b-2 text-sm font-medium
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }
              `}>
                <tab.icon className="w-5 h-5 inline-block mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'keys' && renderKeys()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
}
