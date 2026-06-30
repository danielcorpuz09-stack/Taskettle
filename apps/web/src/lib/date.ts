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

/** Converts an ISO string to a value usable by <input type="date">. */
export function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Builds an ISO string from a Y/M/D plus an optional "HH:MM" time. */
export function isoFromDateAndTime(
  year: number,
  month: number,
  day: number,
  time?: string | null,
): string {
  let hours = 9;
  let minutes = 0;
  if (time) {
    const [h, m] = time.split(':');
    hours = Number(h) || 0;
    minutes = Number(m) || 0;
  }
  return new Date(year, month, day, hours, minutes, 0, 0).toISOString();
}

/** "HH:MM" (24h) extracted from an ISO string, for slot positioning. */
export function timeLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Friendly clock label, e.g. "9:00 AM" or "9:00 AM – 10:30 AM". */
export function formatTimeRange(startIso: string | null, endIso: string | null, allDay: boolean): string {
  if (!startIso) return '';
  if (allDay) return 'All day';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return endIso ? `${fmt(startIso)} – ${fmt(endIso)}` : fmt(startIso);
}

/** Minutes since local midnight for an ISO time (used to place tasks on a day grid). */
export function minutesIntoDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Re-anchors a task's start to a new calendar day while preserving the time of
 * day, and shifts the end by the same delta so the duration is kept.
 */
export function rescheduleToDay(
  startIso: string | null,
  endIso: string | null,
  target: { year: number; month: number; day: number },
): { dueDate: string | null; endAt: string | null } {
  if (!startIso) return { dueDate: null, endAt: endIso };
  const start = new Date(startIso);
  const newStart = new Date(
    target.year,
    target.month,
    target.day,
    start.getHours(),
    start.getMinutes(),
    0,
    0,
  );
  const delta = newStart.getTime() - start.getTime();
  const newEnd = endIso ? new Date(new Date(endIso).getTime() + delta) : null;
  return { dueDate: newStart.toISOString(), endAt: newEnd ? newEnd.toISOString() : null };
}

/**
 * Re-anchors a task's start to an exact day + minute (drag onto a time slot),
 * preserving the original duration.
 */
export function rescheduleToSlot(
  startIso: string | null,
  endIso: string | null,
  target: { year: number; month: number; day: number; minutes: number },
): { dueDate: string; endAt: string | null } {
  const duration =
    startIso && endIso ? new Date(endIso).getTime() - new Date(startIso).getTime() : 0;
  const newStart = new Date(
    target.year,
    target.month,
    target.day,
    Math.floor(target.minutes / 60),
    target.minutes % 60,
    0,
    0,
  );
  const newEnd = duration > 0 ? new Date(newStart.getTime() + duration) : null;
  return { dueDate: newStart.toISOString(), endAt: newEnd ? newEnd.toISOString() : null };
}
