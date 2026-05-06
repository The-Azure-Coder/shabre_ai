const attempts = new Map();

export function sanitizeText(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim();
}

export function safeFilename(value) {
  return String(value || "assignment.txt")
    .replace(/[\\/]/g, "")
    .replace(/[^\w.\- ()]/g, "")
    .slice(0, 120) || "assignment.txt";
}

export function assertRateLimit(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const bucket = attempts.get(key) || [];
  const recent = bucket.filter((time) => now - time < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  if (recent.length > limit) {
    const error = new Error("Too many requests");
    error.code = "RATE_LIMITED";
    throw error;
  }
}

export function resetRateLimitsForTests() {
  attempts.clear();
}
