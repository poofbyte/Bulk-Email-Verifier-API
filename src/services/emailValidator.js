const { validateBulk } = require('@mailtester/core');
const config = require('../config');
const { getDb } = require('../db/database');

// Strip control characters (same as webapp)
function sanitizeInput(text) {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

async function validateSingleEmail(email) {
  const results = await validateBulk([email], {
    concurrency: 1,
    rateLimit: config.validation.rateLimit,
    config: config.validation.config,
  });

  if (results.results.length === 0) {
    throw new Error('Validation returned no results');
  }

  return mapResult(results.results[0]);
}

async function validateBulkEmails(emails, { onProgress } = {}) {
  const startTime = Date.now();

  const bulkResult = await validateBulk(emails, {
    concurrency: config.validation.concurrency,
    rateLimit: config.validation.rateLimit,
    config: config.validation.config,
  });

  let risky = 0;
  const results = bulkResult.results.map((r) => {
    const mapped = mapResult(r);
    if (mapped.isRisky) risky++;
    return mapped;
  });

  const stats = {
    total: bulkResult.total,
    valid: bulkResult.valid,
    invalid: bulkResult.invalid - risky,
    risky,
    errors: bulkResult.errors,
    duration_ms: Date.now() - startTime,
  };

  return { results, stats };
}

function mapResult(r) {
  const smtp = r.validators?.smtp || {};
  const mx = r.validators?.mx || {};
  const typo = r.validators?.typo || {};
  const disposable = r.validators?.disposable || {};

  const smtpProbeBlocked =
    !r.valid &&
    r.reason === 'smtp' &&
    !smtp.valid &&
    mx.valid &&
    ['SMTP_TIMEOUT', 'CONNECTION_REFUSED', 'CONNECTION_ERROR', 'SMTP_CONNECTION_ERROR'].includes(
      smtp.error?.code
    );

  return {
    email: r.email,
    isValid: r.valid || smtpProbeBlocked,
    isRisky: smtpProbeBlocked,
    score: smtpProbeBlocked ? Math.max(r.score || 0, 45) : r.score,
    reason: smtpProbeBlocked ? 'SMTP probe blocked/timeout - MX valid but mailbox unverified' : r.reason,
    typoSuggestion: typo.details?.suggestion || null,
    isDisposable: !disposable.valid,
    mxValid: mx.valid,
    smtpValid: smtp.valid,
  };
}

module.exports = { validateSingleEmail, validateBulkEmails, sanitizeInput };
