'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useCachedData(cacheKey, fetchCallback) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // 1. Optimistically load from localStorage
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false); // Stop loading immediately for high-speed UX
      }

      // 2. Fetch fresh data in the background
      try {
        const freshData = await fetchCallback();
        if (isMounted) {
          setData(freshData);
          localStorage.setItem(cacheKey, JSON.stringify(freshData));
          if (!cached) setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (!cached && isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [cacheKey]);

  return { data, loading, setData };
}
