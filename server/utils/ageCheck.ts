// Minimum age (in years) required to register or hold an account — LOST CAMP
// sells tactical/outdoor gear that isn't appropriate to sell to minors.
export const MIN_AGE = 18;

/**
 * Parses a birth date string into a Date. Accepts the UI's "ДД.ММ.ГГГГ"
 * format (e.g. "19.05.2007") as well as ISO "YYYY-MM-DD" and anything else
 * the native Date constructor can parse. Returns null if unparseable.
 */
function buildValidatedDate(day: number, month: number, year: number): Date | null {
  const d = new Date(year, month - 1, day);
  // Guard against overflowed values like 31.02.2007 silently rolling into March.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

function parseBirthDate(birthDate: string): Date | null {
  const trimmed = birthDate.trim();

  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    return buildValidatedDate(Number(day), Number(month), Number(year));
  }

  // Fallback for a raw "ДДММГГГГ" string with no separators — e.g. if the UI
  // mask didn't run (autofill, paste, older client) and the digits went
  // through unformatted. Without this, `new Date("19052007")` below is
  // simply Invalid Date and the person gets wrongly told they're under 18.
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!trimmed.includes('-') && digitsOnly.length === 8 && digitsOnly === trimmed) {
    const day = Number(digitsOnly.slice(0, 2));
    const month = Number(digitsOnly.slice(2, 4));
    const year = Number(digitsOnly.slice(4, 8));
    return buildValidatedDate(day, month, year);
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Auto-formats raw keystrokes into "ДД.ММ.ГГГГ" as the person types, so
 * digits typed without separators (e.g. "19052007") land in the field as
 * "19.05.2007" instead of being sent to parseBirthDate unformatted.
 */
export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length >= 3) out += '.' + digits.slice(2, 4);
  if (digits.length >= 5) out += '.' + digits.slice(4, 8);
  return out;
}

/**
 * Returns true if the given birth date (accepts "ДД.ММ.ГГГГ", "YYYY-MM-DD",
 * or any Date-parsable string) makes the person at least MIN_AGE years old
 * today. Returns false for missing/unparseable dates so callers can decide
 * how to handle that.
 */
export function isAtLeastMinAge(birthDate: string | undefined | null): boolean {
  if (!birthDate) return false;
  const dob = parseBirthDate(birthDate);
  if (!dob) return false;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= MIN_AGE;
}

export const MIN_AGE_ERROR_MESSAGE = `Регистрация доступна только пользователям старше ${MIN_AGE} лет`;
