const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${currencyFormatter.format(safe)}`;
}

export function formatWholeNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return wholeNumberFormatter.format(safe);
}

export function parseNumberInput(value: string): number {
  const normalized = value.replace(/,/g, '').trim();
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
