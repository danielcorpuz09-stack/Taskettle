/** Small date helpers for cozy, human-friendly due dates. */

export function formatDueLabel(iso: string | null): string {
  if (!iso) return '';
  const due = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000);

  if (dayDiff === 0) return 'Due today';
  if (dayDiff === 1) return 'Due tomorrow';
  if (dayDiff === -1) return 'Due yesterday';
  if (dayDiff < 0) return `${Math.abs(dayDiff)} days overdue`;
  if (dayDiff <= 7) return `Due in ${dayDiff} days`;
  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export type DueState = 'none' | 'upcoming' | 'soon' | 'overdue';

export function dueState(iso: string | null, done: boolean): DueState {
  if (!iso || done) return 'none';
  const due = new Date(iso).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  if (due - now < 24 * 60 * 60 * 1000) return 'soon';
  return 'upcoming';
}

/** Converts an ISO string to a value usable by <input type="datetime-local">. */
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}
