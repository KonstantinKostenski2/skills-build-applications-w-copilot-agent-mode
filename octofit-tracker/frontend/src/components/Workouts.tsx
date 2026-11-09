import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await getJson<{ suggestions?: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!cancelled) setWorkouts(payload.suggestions ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load workout suggestions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p role="status">Loading workout suggestions...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><div role="alert">Unable to load workout suggestions.</div></CapabilityCard>;
  }

  if (workouts.length === 0) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p>No workout suggestions.</p></CapabilityCard>;
  }

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><ul className="list-unstyled mb-0">{workouts.map((workout, index) => <li key={`${workout.title ?? 'workout'}-${index}`}><strong>{workout.title ?? 'Workout'}</strong>{workout.focus ? ` • ${workout.focus}` : ''}{workout.reason ? ` • ${workout.reason}` : ''}</li>)}</ul></CapabilityCard>;
}
