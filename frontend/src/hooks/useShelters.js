import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api/v1';

export function useShelters() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/hostels`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setShelters(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(`Nie udało się pobrać danych: ${err.message}`);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { shelters, loading, error };
}
