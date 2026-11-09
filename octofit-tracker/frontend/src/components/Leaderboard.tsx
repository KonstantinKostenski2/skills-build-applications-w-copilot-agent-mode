import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (!cancelled) setEntries(payload.leaderboard ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load leaderboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p role="status">Loading leaderboard...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><div role="alert">Unable to load leaderboard.</div></CapabilityCard>;
  }

  if (entries.length === 0) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p>No leaderboard yet.</p></CapabilityCard>;
  }

  return <CapabilityCard title="Leaderboard" description="Compare team point totals."><ol className="mb-0">{entries.map((entry) => <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 0}`}>{entry.teamName ?? 'Unknown team'} — {entry.totalPoints ?? 0} points</li>)}</ol></CapabilityCard>;
}
