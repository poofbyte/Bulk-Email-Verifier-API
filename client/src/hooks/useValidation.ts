import { useState, useCallback } from 'react';
import * as api from '@/api/client';
import type { VerificationResult, BulkValidationResponse } from '@/types';

export function useValidation() {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [stats, setStats] = useState<BulkValidationResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateBulk = useCallback(async (emails: string[]) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setStats(null);

    try {
      const res = await api.validateBulk(emails);
      if (!res.success) {
        throw new Error(res.error?.message || 'Validation failed');
      }

      const mapped: VerificationResult[] = res.data.results.map((r, i) => ({
        id: `${i}-${r.email}`,
        email: r.email,
        status: r.isRisky ? 'risky' as const : r.isValid ? 'valid' as const : 'invalid' as const,
        score: r.score,
        mxResult: r.mxValid ? 'Found' : 'None',
        smtpResult: r.smtpValid ? 'Mailbox Exists' : r.isRisky ? 'Blocked' : 'Failed',
        typoSuggestion: r.typoSuggestion,
        isDisposable: r.isDisposable,
        mxValid: r.mxValid,
        smtpValid: r.smtpValid,
        isRisky: r.isRisky,
        reason: r.reason || (r.isValid ? 'All checks passed' : 'Validation failed'),
        processingTime: 0,
      }));

      setResults(mapped);
      setStats(res.data.stats);
      return res.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setStats(null);
    setError(null);
  }, []);

  return { results, stats, loading, error, validateBulk, clear };
}
