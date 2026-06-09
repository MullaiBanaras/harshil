// src/utils/cache.js
// In-memory cache to reduce DB hits under high traffic

const NodeCache = require('node-cache');

// Cache with default TTL from env (default 5 minutes)
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300,
  checkperiod: 60,       // Check for expired keys every 60s
  useClones: false,      // Faster — don't clone objects
  maxKeys: 500,          // Max 500 cached items
});

module.exports = {
  // Get a cached value
  get: (key) => cache.get(key),

  // Set a value (optional custom TTL)
  set: (key, value, ttl = null) => {
    if (ttl) return cache.set(key, value, ttl);
    return cache.set(key, value);
  },

  // Delete a key
  del: (key) => cache.del(key),

  // Delete keys matching a pattern
  delPattern: (pattern) => {
    const keys = cache.keys().filter(k => k.includes(pattern));
    keys.forEach(k => cache.del(k));
    return keys.length;
  },

  // Flush everything
  flush: () => cache.flushAll(),

  // Get stats
  stats: () => cache.getStats(),
};
