import React, { useState, useEffect } from 'react';
import { ShieldAlert, UserPlus, Users, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import { User } from '../types';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('ANALYST');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/audit-logs'),
      ]);
      if (Array.isArray(uRes.data)) setUsers(uRes.data);
      if (Array.isArray(aRes.data)) setAuditLogs(aRes.data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      await apiClient.post('/admin/users', {
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        role: newRole,
      });
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setCreateMsg('User created successfully.');
      await fetchData();
    } catch (err: any) {
      setCreateMsg(err.response?.data?.detail || 'Error creating user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-['Outfit'] flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            Enterprise Administration & Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            RBAC role governance, operator provisioning, and immutable system audit trails
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Provisioning Form */}
        <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Provision Operator / Analyst
          </h3>

          {createMsg && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400">
              {createMsg}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="analyst@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">RBAC Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ANALYST">ANALYST (Read-Only Dashboards)</option>
                <option value="OPERATOR">OPERATOR (Sync & Alerts)</option>
                <option value="ADMIN">ADMIN (Full Governance)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              {creating ? 'Provisioning...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Active Team Members ({users.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2">Provisioned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 pl-2">
                      <div className="font-bold text-white">{u.full_name || u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-emerald-400 font-medium">Active</span>
                    </td>
                    <td className="py-3 pr-2 font-mono text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="p-6 rounded-3xl bg-[#111827] border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Cryptographic Audit Trail
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold">
                <th className="pb-3 pl-2">Timestamp</th>
                <th className="pb-3">Action Event</th>
                <th className="pb-3">Account Email</th>
                <th className="pb-3">IP Address</th>
                <th className="pb-3 pr-2">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition text-[11px]">
                  <td className="py-2.5 pl-2 text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-emerald-400 font-bold">
                    {log.action}
                  </td>
                  <td className="py-2.5 text-slate-200">
                    {log.user_email || 'System'}
                  </td>
                  <td className="py-2.5 text-slate-400">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-2.5 pr-2 text-slate-500 truncate max-w-xs">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
