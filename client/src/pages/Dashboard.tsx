import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Square, Trash2, Download, Search, ChevronDown, ChevronUp,
  UploadCloud, Keyboard, Copy, Check, Key, Loader2, Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useValidation } from '@/hooks/useValidation';
import { getUsage } from '@/api/client';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import Button from '@/components/Button';
import type { VerificationResult, BatchHistoryItem, UsageResponse } from '@/types';

function parseEmails(text: string): string[] {
  return text
    .split(/[\n,;\t]+/)
    .map((e) => e.trim().replace(/^["'<\s]+|["'>\s]+$/g, ''))
    .filter((e) => e.includes('@') && e.includes('.'));
}

export default function Dashboard() {
   const { apiKey, user } = useAuth();
   const [showAdminLink, setShowAdminLink] = useState(false);
  const { results, stats, loading, error, validateBulk, clear } = useValidation();
  const [rawInput, setRawInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'risky' | 'invalid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<BatchHistoryItem[]>([]);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('bev_batch_history');
    if (stored) {
      try { setHistory(JSON.parse(stored)); } catch {}
    }
  }, []);

   // Fetch usage stats
   useEffect(() => {
     if (apiKey) {
       getUsage().then((res) => {
         if (res.success) setUsage(res.data);
       }).catch(() => {});
     }
   }, [apiKey, stats]);

   // Check if admin key is set
   useEffect(() => {
     const hasAdminKey = !!localStorage.getItem('bev_admin_key');
     setShowAdminLink(hasAdminKey);
   }, []);

  // Save to history when validation completes
  useEffect(() => {
    if (results.length > 0 && stats) {
      const avgScore = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
      const batch: BatchHistoryItem = {
        id: `batch_${Date.now()}`,
        timestamp: new Date().toISOString(),
        name: `Batch #${Date.now().toString().slice(-4)}`,
        total: stats.total,
        valid: stats.valid,
        risky: stats.risky,
        invalid: stats.invalid,
        averageScore: avgScore,
        results,
      };
      const updated = [batch, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('bev_batch_history', JSON.stringify(updated));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  const emails = useMemo(() => parseEmails(rawInput), [rawInput]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setRawInput(ev.target?.result as string);
      reader.readAsText(file);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setRawInput(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleStart = () => {
    if (emails.length === 0) return;
    setCurrentPage(1);
    validateBulk(emails);
  };

  const handleClear = () => {
    setRawInput('');
    clear();
    setExpandedRows({});
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Export
  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Email', 'Status', 'Score', 'MX', 'SMTP', 'Typo', 'Disposable', 'Reason'];
    const rows = results.map((r) => [
      r.email, r.status.toUpperCase(), String(r.score), r.mxResult, r.smtpResult,
      r.typoSuggestion || 'None', r.isDisposable ? 'YES' : 'NO', r.reason,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (emails.length > 0 && !loading) handleStart();
      }
      if (e.key === 'Escape' && loading) {
        e.preventDefault();
        handleClear();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportCSV();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails, loading, results]);

  // Filtered results
  const filtered = useMemo(() => {
    let out = [...results];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter((r) => r.email.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') out = out.filter((r) => r.status === statusFilter);
    return out;
  }, [results, searchQuery, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const avgScore = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;

  return (
    <div className="py-4 flex-1 flex flex-col justify-start">
      <div className="max-w-5xl w-full mx-auto px-6 mb-2 text-left">
        <span className="text-[10px] font-bold text-accent-600 tracking-widest uppercase font-mono bg-accent-50 px-2 py-0.5 rounded border border-accent-100">
          ACTIVE WORKSPACE
        </span>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 mt-1">
          SMTP-Handshake & Rep Score Core
        </h1>
        <p className="text-xs text-brand-500 mt-0.5">
          Zero retention bulk validation platform. Paste raw lists or drop CSV/TXT records below.
        </p>
      </div>

      <div className="max-w-5xl w-full mx-auto px-6">
        {/* Keyboard shortcuts bar */}
        <div className="bg-neutral-900 text-neutral-300 rounded-md px-3 py-1.5 flex items-center gap-4 text-[10px] font-mono mb-4">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3 h-3 text-neutral-500" />
            <kbd className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Ctrl+Enter</kbd> Start
          </span>
          <span><kbd className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Esc</kbd> Stop</span>
          <span><kbd className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">Ctrl+E</kbd> Export</span>
          {apiKey && (
            <span className="ml-auto flex items-center gap-1.5 text-neutral-500">
              <Key className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{apiKey.substring(0, 20)}...</span>
              <button onClick={copyApiKey} className="hover:text-neutral-300 cursor-pointer">
                {copied ? <Check className="w-3 h-3 text-success-solid" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Input Panel */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-accent-500 bg-accent-50/20' : 'border-brand-200 hover:border-brand-300'
              }`}
            >
              <UploadCloud className="w-5 h-5 text-brand-400 mx-auto mb-1" />
              <p className="text-[11px] text-brand-500">Drop CSV/TXT file or click to browse</p>
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Raw Input */}
            <div>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="w-full h-40 p-3 text-xs font-mono border border-brand-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                placeholder={"user@example.com\ntest@gmail.com\nbad@gamil.com"}
              />
              <p className="text-[10px] text-brand-400 mt-1">
                {emails.length} emails detected
                {usage && (
                  <span className="ml-2">
                    | Daily: {usage.usage.today.emails} / {usage.limits.dailyEmails === 'unlimited' ? '∞' : usage.limits.dailyEmails}
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleStart} disabled={loading || emails.length === 0} className="flex-1">
                <Play className="w-3.5 h-3.5" />
                {loading ? 'Validating...' : 'Start Validation'}
              </Button>
              {loading && (
                <Button variant="danger" onClick={handleClear}>
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </Button>
              )}
              {!loading && results.length > 0 && (
                <Button variant="ghost" onClick={handleClear}>
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {error && (
              <div className="bg-danger-soft border border-danger-border text-danger-text text-xs rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Right: Stats + Results */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Bento Stats */}
            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Total" value={stats?.total || results.length} />
                <StatCard label="Deliverable" value={stats?.valid || 0} accent="success" />
                <StatCard label="Risky" value={stats?.risky || 0} accent="warning" />
                <StatCard label="Undeliverable" value={stats?.invalid || 0} accent="danger" />
                <StatCard label="Avg Score" value={`${avgScore}/100`} />
                <StatCard label="Duration" value={stats ? `${(stats.duration_ms / 1000).toFixed(1)}s` : '-'} />
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <div className="bg-white border border-brand-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative">
                {/* Loading overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-brand-600">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-600" />
                      <span className="font-medium">Validating...</span>
                    </div>
                  </div>
                )}
                {/* Filters */}
                <div className="px-3 py-2 border-b border-brand-200 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-brand-200 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-500"
                      placeholder="Search emails..."
                    />
                  </div>
                  {(['all', 'valid', 'risky', 'invalid'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
                      className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                        statusFilter === f
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-brand-500 hover:text-brand-900'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <Button variant="secondary" size="sm" onClick={exportCSV}>
                    <Download className="w-3 h-3" />
                    CSV
                  </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-brand-100 text-left">
                        <th className="px-3 py-2 font-semibold text-brand-500 font-mono uppercase tracking-wider text-[10px]">Email</th>
                        <th className="px-3 py-2 font-semibold text-brand-500 font-mono uppercase tracking-wider text-[10px]">Status</th>
                        <th className="px-3 py-2 font-semibold text-brand-500 font-mono uppercase tracking-wider text-[10px]">Score</th>
                        <th className="px-3 py-2 font-semibold text-brand-500 font-mono uppercase tracking-wider text-[10px]">MX</th>
                        <th className="px-3 py-2 font-semibold text-brand-500 font-mono uppercase tracking-wider text-[10px]">SMTP</th>
                        <th className="px-3 py-2 font-semibold text-brand-500 font-mono uppercase tracking-wider text-[10px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((r) => (
                        <ResultRow
                          key={r.id}
                          result={r}
                          expanded={!!expandedRows[r.id]}
                          onToggle={() => setExpandedRows((p) => ({ ...p, [r.id]: !p[r.id] }))}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-3 py-2 border-t border-brand-100 flex items-center justify-between text-[10px] text-brand-500">
                  <span>{filtered.length} results</span>
                  <div className="flex items-center gap-2">
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-0.5 border border-brand-200 rounded disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-0.5 border border-brand-200 rounded disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-brand-200 rounded px-1 py-0.5 text-[10px]"
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}/page</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && results.length === 0 && (
              <div className="bg-white border border-brand-200 rounded-lg p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="w-10 h-10 rounded-md bg-accent-50 border border-accent-100 flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="w-5 h-5 text-accent-600 animate-spin" />
                </div>
                <p className="text-xs font-semibold text-brand-900 mb-1">Validating {emails.length} emails...</p>
                <p className="text-[11px] text-brand-500">This may take a few seconds per email for SMTP verification</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="w-32 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {results.length === 0 && !loading && (
              <div className="bg-white border border-brand-200 rounded-lg p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="w-10 h-10 rounded-md bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-5 h-5 text-brand-400" />
                </div>
                <p className="text-xs text-brand-500">Paste emails or drop a file to start validating</p>
              </div>
            )}

             {/* Admin Panel Link */}
             {showAdminLink && (
               <div className="bg-white border border-brand-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                 <div className="px-3 py-2 border-b border-brand-200 flex items-center gap-2 bg-neutral-50">
                   <Shield className="w-3 h-3 text-accent-600" />
                   <span className="text-[10px] font-bold text-brand-500 font-mono uppercase tracking-wider">Admin Panel</span>
                 </div>
                 <div className="p-4">
                   <a href="/admin" className="block w-full text-center text-xs font-medium text-accent-600 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-md py-2 transition-colors">
                     Manage API Keys & System Settings
                   </a>
                 </div>
               </div>
             )}

             {/* History */}
            {history.length > 0 && (
              <div className="bg-white border border-brand-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="px-3 py-2 border-b border-brand-200">
                  <span className="text-[10px] font-bold text-brand-500 font-mono uppercase tracking-wider">Recent Batches</span>
                </div>
                <div className="divide-y divide-brand-100">
                  {history.slice(0, 5).map((b) => (
                    <div key={b.id} className="px-3 py-2 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-brand-700">{b.name}</span>
                        <span className="text-brand-400">{new Date(b.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className="text-success-text">{b.valid} valid</span>
                        <span className="text-warning-text">{b.risky} risky</span>
                        <span className="text-danger-text">{b.invalid} invalid</span>
                        <span className="text-brand-500">avg {b.averageScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result: r, expanded, onToggle }: { result: VerificationResult; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="border-b border-brand-100 hover:bg-brand-50/50 cursor-pointer" onClick={onToggle}>
        <td className="px-3 py-2 font-mono text-brand-900">{r.email}</td>
        <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
        <td className="px-3 py-2 font-mono">
          <span className={`font-bold ${
            r.score >= 70 ? 'text-success-text' : r.score >= 40 ? 'text-warning-text' : 'text-danger-text'
          }`}>
            {r.score}
          </span>
          <span className="text-brand-400">/100</span>
        </td>
        <td className="px-3 py-2 text-brand-500">{r.mxResult}</td>
        <td className="px-3 py-2 text-brand-500">{r.smtpResult}</td>
        <td className="px-3 py-2">
          {expanded ? <ChevronUp className="w-3 h-3 text-brand-400" /> : <ChevronDown className="w-3 h-3 text-brand-400" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-3 py-2 bg-neutral-50 text-[10px]">
            <div className="flex flex-col gap-1 font-mono">
              <div><span className="text-brand-400">Reason:</span> {r.reason}</div>
              {r.typoSuggestion && <div><span className="text-warning-text">Typo suggestion:</span> {r.typoSuggestion}</div>}
              {r.isDisposable && <div className="text-warning-text">Disposable email detected</div>}
              <div><span className="text-brand-400">MX Valid:</span> {r.mxValid ? 'Yes' : 'No'} | <span className="text-brand-400">SMTP Valid:</span> {r.smtpValid ? 'Yes' : 'No'}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
