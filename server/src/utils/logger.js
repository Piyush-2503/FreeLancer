const REDACTED_KEYS = ['password', 'token', 'secret', 'hash', 'key'];

function sanitize(obj) {
  if (typeof obj !== 'object' || !obj) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      REDACTED_KEYS.some(r => k.toLowerCase().includes(r)) ? '[REDACTED]' : sanitize(v),
    ])
  );
}

export const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', msg, ...sanitize(meta), ts: new Date().toISOString() })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', msg, ...sanitize(meta), ts: new Date().toISOString() })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', msg, ...sanitize(meta), ts: new Date().toISOString() })),
};
