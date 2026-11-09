import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  members?: Array<string | { toString: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await getJson<{ teams?: TeamRecord[] }>('/api/teams');
        if (!cancelled) setTeams(payload.teams ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load teams.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><p role="status">Loading teams...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><div role="alert">Unable to load teams.</div></CapabilityCard>;
  }

  if (teams.length === 0) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><p>No teams yet.</p></CapabilityCard>;
  }

  return <CapabilityCard title="Teams" description="Manage teams and members."><ul className="list-unstyled mb-0">{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`}><strong>{team.name ?? 'Unnamed team'}</strong>{team.members && team.members.length > 0 ? ` • ${team.members.length} members` : ''}</li>)}</ul></CapabilityCard>;
}
