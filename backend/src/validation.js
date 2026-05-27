function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isNonEmptyString(value, maxLength = 200) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function normalizeDateOrNow(value) {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function toDateKey(isoString) {
  return isoString.slice(0, 10);
}

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) {
    return false;
  }
  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}

module.exports = {
  isEmail,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  normalizeDateOrNow,
  toDateKey,
  isDateKey
};
