'use strict';

const RATE_LIMIT_STATE = new Map();
const RATE_LIMIT_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const UUID_LIKE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^[0-9a-f]+$/i;

let lastRateLimitSweepAt = 0;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getHeader = (req, name) => {
  const value = req?.headers?.[name];
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
};

const getClientIp = (req) => {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return String(forwardedFor.split(',')[0] || '').trim().toLowerCase();
  }

  const realIp = getHeader(req, 'x-real-ip');
  if (realIp) return realIp.toLowerCase();

  const socketIp = String(
    req?.socket?.remoteAddress
    || req?.connection?.remoteAddress
    || ''
  ).trim();

  return socketIp.toLowerCase() || 'unknown';
};

const getClientFingerprint = (req, scope = 'default') => {
  const ip = getClientIp(req);
  const ua = getHeader(req, 'user-agent').slice(0, 160).toLowerCase() || 'unknown';
  return `${scope}:${ip}:${ua}`;
};

const sweepRateLimitState = (now = Date.now()) => {
  if ((now - lastRateLimitSweepAt) < RATE_LIMIT_SWEEP_INTERVAL_MS) return;
  lastRateLimitSweepAt = now;

  for (const [key, bucket] of RATE_LIMIT_STATE.entries()) {
    if (!bucket || !Array.isArray(bucket.hits) || bucket.hits.length === 0) {
      RATE_LIMIT_STATE.delete(key);
      continue;
    }

    const windowMs = Number(bucket.windowMs) || RATE_LIMIT_SWEEP_INTERVAL_MS;
    const cutoff = now - Math.max(windowMs, RATE_LIMIT_SWEEP_INTERVAL_MS);
    const recentHits = bucket.hits.filter((hitAt) => Number(hitAt) > cutoff);

    if (recentHits.length === 0) {
      RATE_LIMIT_STATE.delete(key);
      continue;
    }

    bucket.hits = recentHits;
    RATE_LIMIT_STATE.set(key, bucket);
  }
};

const enforceRateLimit = (req, {
  scope = 'default',
  windowMs = 60 * 1000,
  maxHits = 10,
  message = 'Too many requests'
} = {}) => {
  const now = Date.now();
  const storeKey = getClientFingerprint(req, scope);

  sweepRateLimitState(now);

  const bucket = RATE_LIMIT_STATE.get(storeKey) || { hits: [], windowMs };
  const cutoff = now - windowMs;
  bucket.windowMs = windowMs;
  bucket.hits = bucket.hits.filter((hitAt) => Number(hitAt) > cutoff);

  if (bucket.hits.length >= maxHits) {
    const retryAfterMs = Math.max(1000, windowMs - (now - bucket.hits[0]));
    RATE_LIMIT_STATE.set(storeKey, bucket);
    const error = createHttpError(429, message);
    error.rateLimit = {
      key: storeKey,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    };
    throw error;
  }

  bucket.hits.push(now);
  RATE_LIMIT_STATE.set(storeKey, bucket);

  return {
    key: storeKey,
    remaining: Math.max(0, maxHits - bucket.hits.length),
    resetAt: bucket.hits[0] + windowMs
  };
};

const approximateBodyBytes = (value) => {
  if (Buffer.isBuffer(value)) return value.length;
  if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
  if (value == null) return 0;

  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

const assertMaxBodyBytes = (value, maxBytes, message = 'Payload too large') => {
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) return 0;
  const bodyBytes = approximateBodyBytes(value);
  if (bodyBytes > maxBytes) {
    throw createHttpError(413, message);
  }
  return bodyBytes;
};

const assertMaxContentLength = (req, maxBytes, message = 'Payload too large') => {
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) return null;
  const raw = getHeader(req, 'content-length');
  if (!raw) return null;

  const contentLength = Number(raw);
  if (!Number.isFinite(contentLength) || contentLength < 0) return null;
  if (contentLength > maxBytes) {
    throw createHttpError(413, message);
  }

  return contentLength;
};

const isUuidLike = (value) => UUID_LIKE_RE.test(String(value || '').trim());

const assertUuidLike = (value, fieldName, { optional = false, statusCode = 400 } = {}) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    if (optional) return null;
    throw createHttpError(statusCode, `Missing ${fieldName}`);
  }

  if (!isUuidLike(normalized)) {
    throw createHttpError(statusCode, `Invalid ${fieldName}`);
  }

  return normalized;
};

const assertHexToken = (value, {
  fieldName = 'token',
  minLength = 64,
  maxLength = 64,
  statusCode = 400,
  message = null
} = {}) => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw createHttpError(statusCode, `Missing ${fieldName}`);
  }

  if (
    normalized.length < minLength
    || normalized.length > maxLength
    || !HEX_RE.test(normalized)
  ) {
    throw createHttpError(statusCode, message || `Invalid ${fieldName}`);
  }

  return normalized;
};

const normalizeContentType = (value) =>
  String(value || '').split(';')[0].trim().toLowerCase();

const assertAllowedContentType = (value, allowedValues, {
  fieldName = 'content type',
  statusCode = 415,
  message = null
} = {}) => {
  const normalized = normalizeContentType(value);
  const allowed = Array.isArray(allowedValues)
    ? allowedValues.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
    : [];

  if (!normalized || !allowed.includes(normalized)) {
    throw createHttpError(statusCode, message || `Unsupported ${fieldName}`);
  }

  return normalized;
};

const assertNumberInRange = (value, {
  fieldName,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  optional = false,
  statusCode = 400
} = {}) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    if (optional) return null;
    throw createHttpError(statusCode, `Missing ${fieldName}`);
  }

  const numberValue = Number(normalized);
  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    throw createHttpError(statusCode, `Invalid ${fieldName}`);
  }

  return numberValue;
};

module.exports = {
  approximateBodyBytes,
  assertAllowedContentType,
  assertHexToken,
  assertMaxBodyBytes,
  assertMaxContentLength,
  assertNumberInRange,
  assertUuidLike,
  createHttpError,
  enforceRateLimit,
  getClientFingerprint,
  getClientIp,
  isUuidLike,
  normalizeContentType
};
