import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api/v1';

/**
 * Fetches all comments in one call and groups them by shelter_id.
 * Returns: { commentsByShelter: { [shelterId]: comment[] }, loading, error }
 */
export function useAllComments() {
  const [commentsByShelter, setCommentsByShelter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/comments`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        // Group by shelter_id
        const grouped = arr.reduce((acc, c) => {
          const sid = c.shelter_id ?? c.hostel_id;
          if (sid == null) return acc;
          if (!acc[sid]) acc[sid] = [];
          acc[sid].push(c);
          return acc;
        }, {});
        setCommentsByShelter(grouped);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // Silently fall back to empty — scoring will use neutral review fallback
        setCommentsByShelter({});
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { commentsByShelter, loading, error };
}
