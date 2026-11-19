import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export type { CountryCode };

export interface PhoneCountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
  dialCode: string;
  label: string;
}

export interface NormalizedPhoneResult {
  valid: boolean;
  isEmpty: boolean;
  e164?: string;
  country?: CountryCode;
  error?: string;
}

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'PH';

const regionDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

function resolveRegionName(code: CountryCode): string {
  try {
    const resolved = regionDisplayNames?.of(code);
    if (resolved && resolved !== code) {
      return resolved;
    }
  } catch {
    // Fallback to ISO code if runtime lacks display data for a code
  }
  return code;
}

export const ALL_PHONE_COUNTRIES: PhoneCountryOption[] = getCountries()
  .map((code) => {
    const name = resolveRegionName(code);
    const callingCode = getCountryCallingCode(code);
    const dialCode = `+${callingCode}`;
    return {
      code,
      name,
      callingCode,
      dialCode,
      label: `${name} (${dialCode})`,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

const COUNTRY_MAP = new Map<CountryCode, PhoneCountryOption>(
  ALL_PHONE_COUNTRIES.map((entry) => [entry.code, entry])
);

export function getPhoneCountryOption(code: CountryCode): PhoneCountryOption {
  return (
    COUNTRY_MAP.get(code) ??
    COUNTRY_MAP.get(DEFAULT_PHONE_COUNTRY) ??
    ALL_PHONE_COUNTRIES[0]
  );
}

export function isValidCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && isSupportedCountry(value.toUpperCase());
}

export function filterPhoneCountries(
  query: string,
  countries: readonly PhoneCountryOption[] = ALL_PHONE_COUNTRIES
): PhoneCountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...countries];

  const digits = q.replace(/[^\d]/g, '');
  const startsWithPlus = q.startsWith('+');

  const matches = countries.filter((country) => {
    if (country.name.toLowerCase().includes(q)) return true;
    if (country.code.toLowerCase().includes(q)) return true;
    if (country.dialCode.toLowerCase().includes(q)) return true;
    if (digits.length > 0) {
      return startsWithPlus
        ? country.callingCode.startsWith(digits)
        : country.callingCode.includes(digits);
    }
    return false;
  });

  if (digits.length > 0 && (startsWithPlus || /^\d+$/.test(q))) {
    return matches.sort((a, b) => {
      const aExact = a.callingCode === digits ? 0 : 1;
      const bExact = b.callingCode === digits ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.name.localeCompare(b.name, 'en');
    });
  }

  return matches;
}

export function detectCountryFromInternationalInput(
  value: string,
  currentCountry: CountryCode
): CountryCode | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return null;

  const parsed = parsePhoneNumberFromString(trimmed, { extract: false });
  if (!parsed?.country || !isSupportedCountry(parsed.country)) {
    return null;
  }

  const currentCallingCode = getCountryCallingCode(currentCountry);
  if (parsed.countryCallingCode === currentCallingCode && !parsed.isValid()) {
    return null;
  }

  return parsed.country;
}

export function validateAndNormalizePhone(
  rawInput: unknown,
  defaultCountry?: CountryCode
): NormalizedPhoneResult {
  if (rawInput === undefined || rawInput === null) {
    return { valid: true, isEmpty: true };
  }
  if (typeof rawInput !== 'string') {
    return {
      valid: false,
      isEmpty: false,
      error: 'Please enter a valid international contact number.',
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: true, isEmpty: true };
  }

  if (trimmed.length > 40) {
    return {
      valid: false,
      isEmpty: false,
      error: 'Contact number must be 40 characters or fewer.',
    };
  }

  const isInternational = trimmed.startsWith('+');
  const safeDefaultCountry =
    defaultCountry && isSupportedCountry(defaultCountry) ? defaultCountry : undefined;

  if (!isInternational && !safeDefaultCountry) {
    return {
      valid: false,
      isEmpty: false,
      error: 'Please include a + country code or select a country/territory.',
    };
  }

  const parsed = parsePhoneNumberFromString(trimmed, {
    defaultCountry: isInternational ? undefined : safeDefaultCountry,
    extract: false,
  });

  if (parsed?.ext) {
    return {
      valid: false,
      isEmpty: false,
      error: 'Please enter the main contact number without an extension.',
    };
  }

  if (!parsed || !parsed.isValid()) {
    if (!isInternational && safeDefaultCountry) {
      const countryOption = getPhoneCountryOption(safeDefaultCountry);
      return {
        valid: false,
        isEmpty: false,
        error: `Please enter a valid contact number for ${countryOption.label}, or enter a full + international number.`,
      };
    }
    return {
      valid: false,
      isEmpty: false,
      error: 'Please enter a valid international contact number (e.g., +63 917 123 4567).',
    };
  }

  return {
    valid: true,
    isEmpty: false,
    e164: parsed.number,
    country: parsed.country ?? safeDefaultCountry,
  };
}
