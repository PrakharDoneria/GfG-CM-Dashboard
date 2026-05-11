'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useCachedData(cacheKey, fetchCallback, ttlMs = 5 * 60 * 1000) { // Default 5 minutes TTL
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const cached = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();
      
      let shouldFetch = true;

      // 1. Load from localStorage if available
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false); // Stop loading immediately for high-speed UX
        
        // If data is fresh, skip background fetch
        if (cachedTime && now - parseInt(cachedTime, 10) < ttlMs) {
          shouldFetch = false;
        }
      }

      // 2. Fetch fresh data in the background if needed
      if (shouldFetch) {
        try {
          const freshData = await fetchCallback();
          if (isMounted) {
            setData(freshData);
            localStorage.setItem(cacheKey, JSON.stringify(freshData));
            localStorage.setItem(`${cacheKey}_time`, now.toString());
            if (!cached) setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching data:', err);
          setError(err);
          if (!cached && isMounted) setLoading(false);
        }
      }
    };

    loadData();

    // Listen for custom invalidation events
    const handleInvalidation = (e) => {
      if (!e.detail || e.detail.keyPattern === cacheKey || cacheKey.includes(e.detail.keyPattern)) {
        loadData();
      }
    };

    window.addEventListener('cache-invalidated', handleInvalidation);
    return () => { 
      isMounted = false; 
      window.removeEventListener('cache-invalidated', handleInvalidation);
    };
  }, [cacheKey, ttlMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, setData };
}
