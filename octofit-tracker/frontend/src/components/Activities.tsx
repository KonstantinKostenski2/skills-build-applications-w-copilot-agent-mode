import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await getJson<{ activities?: ActivityRecord[] }>('/api/activities');
        if (!cancelled) setActivities(payload.activities ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load activity data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p role="status">Loading activities...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><div role="alert">Unable to load activities.</div></CapabilityCard>;
  }

  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p>No activities yet.</p></CapabilityCard>;
  }

  return <CapabilityCard title="Activities" description="Track student activity minutes and points."><ul className="list-unstyled mb-0">{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`}>{activity.type ?? 'Activity'} • {activity.minutes ?? 0} minutes • {activity.points ?? 0} pts</li>)}</ul></CapabilityCard>;
}
