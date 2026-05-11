export const invalidateCache = (keyPattern) => {
  if (typeof window === 'undefined') return;
  
  if (!keyPattern) {
    // Clear all gfg related caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('_cache')) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_time`);
      }
    });
  } else {
    // Clear specific keys matching pattern
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(keyPattern)) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_time`);
      }
    });
  }

  // Dispatch a custom event so active hooks can refetch immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cache-invalidated', { detail: { keyPattern } }));
  }
};
