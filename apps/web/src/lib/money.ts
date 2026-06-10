/** Money helpers. Amounts are stored as integer minor units (e.g. cents). */

export function formatMoney(amountMinor: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
      amountMinor / 100
    );
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency}`;
  }
}

/** Parses a major-unit string (e.g. "12.50") into integer minor units. */
export function toMinor(value: string | number): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Converts integer minor units to a major-unit number for form inputs. */
export function toMajor(amountMinor: number): number {
  return amountMinor / 100;
}
