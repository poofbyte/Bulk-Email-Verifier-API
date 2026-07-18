export type VerificationStatus = 'valid' | 'risky' | 'invalid' | 'pending' | 'processing';

export interface VerificationResult {
  id: string;
  email: string;
  status: VerificationStatus;
  score: number;
  mxResult: string;
  smtpResult: string;
  typoSuggestion: string | null;
  isDisposable: boolean;
  mxValid: boolean | null;
  smtpValid: boolean | null;
  isRisky: boolean;
  reason: string;
  processingTime: number;
}

export interface ProgressStats {
  total: number;
  processed: number;
  remaining: number;
  valid: number;
  risky: number;
  invalid: number;
  speed: number;
  activeWorkers: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BatchHistoryItem {
  id: string;
  timestamp: string;
  name: string;
  total: number;
  valid: number;
  risky: number;
  invalid: number;
  averageScore: number;
  results: VerificationResult[];
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    duration_ms: number;
  };
}

export interface BulkValidationResponse {
  results: Array<{
    email: string;
    isValid: boolean;
    isRisky: boolean;
    score: number;
    reason: string | null;
    typoSuggestion: string | null;
    isDisposable: boolean;
    mxValid: boolean;
    smtpValid: boolean;
  }>;
  stats: {
    total: number;
    valid: number;
    invalid: number;
    risky: number;
    errors: number;
    duration_ms: number;
  };
}

export interface UsageResponse {
  key: {
    name: string;
    tier: string;
    prefix: string;
  };
  limits: {
    requestsPerMinute: number;
    maxBatchSize: number;
    dailyEmails: number | string;
  };
  usage: {
    today: { emails: number; requests: number };
    allTime: { emails: number; requests: number };
  };
}
