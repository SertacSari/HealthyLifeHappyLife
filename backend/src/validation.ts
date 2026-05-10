export function isEmail(value: any): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isNonEmptyString(value: any, maxLength = 200): boolean {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function isPositiveNumber(value: any): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: any): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeDateOrNow(value: any): string | null {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}
