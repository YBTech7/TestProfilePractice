import { describe, expect, it } from 'vitest';
import {
  ALL_PHONE_COUNTRIES,
  detectCountryFromInternationalInput,
  filterPhoneCountries,
  validateAndNormalizePhone,
} from '../src/lib/phone.ts';

describe('International Phone Library Helpers', () => {
  it('lists all supported countries/territories including shared dialing codes', () => {
    expect(ALL_PHONE_COUNTRIES.length).toBeGreaterThanOrEqual(240);

    const plusOneEntries = ALL_PHONE_COUNTRIES.filter((c) => c.callingCode === '1');
    expect(plusOneEntries.length).toBeGreaterThan(20);
    expect(plusOneEntries.some((c) => c.label === 'United States (+1)')).toBe(true);
    expect(plusOneEntries.some((c) => c.label === 'Canada (+1)')).toBe(true);
    expect(plusOneEntries.some((c) => c.label === 'Puerto Rico (+1)')).toBe(true);

    const plus44Entries = ALL_PHONE_COUNTRIES.filter((c) => c.callingCode === '44');
    expect(plus44Entries.some((c) => c.label === 'United Kingdom (+44)')).toBe(true);
    expect(plus44Entries.some((c) => c.code === 'GG')).toBe(true);
    expect(plus44Entries.some((c) => c.code === 'JE')).toBe(true);
    expect(plus44Entries.some((c) => c.code === 'IM')).toBe(true);

    expect(ALL_PHONE_COUNTRIES.some((c) => c.label === 'Philippines (+63)')).toBe(true);
  });

  it('filters countries by name, ISO code, and +dialing code accurately', () => {
    const byName = filterPhoneCountries('philippines');
    expect(byName.map((c) => c.code)).toContain('PH');

    const byIso = filterPhoneCountries('gb');
    expect(byIso.map((c) => c.code)).toContain('GB');

    const byPlusOne = filterPhoneCountries('+1');
    expect(byPlusOne.length).toBeGreaterThan(20);
    expect(byPlusOne.every((c) => c.callingCode.startsWith('1'))).toBe(true);
    expect(byPlusOne.some((c) => c.code === 'US')).toBe(true);
    expect(byPlusOne.some((c) => c.code === 'CA')).toBe(true);
    expect(byPlusOne.some((c) => c.code === 'AU')).toBe(false);
  });

  it('validates and normalizes Philippine, regional, shared-code, and pasted + international numbers to E.164', () => {
    // Philippine formatted local mobile number
    expect(validateAndNormalizePhone('(0917) 123-4567', 'PH')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+639171234567',
      country: 'PH',
    });

    // Another region (United Kingdom & Singapore)
    expect(validateAndNormalizePhone('020 7946 0958', 'GB')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+442079460958',
      country: 'GB',
    });
    expect(validateAndNormalizePhone('9123 4567', 'SG')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+6591234567',
      country: 'SG',
    });

    // Countries/territories sharing +1
    expect(validateAndNormalizePhone('(415) 555-0199', 'US')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+14155550199',
      country: 'US',
    });
    expect(validateAndNormalizePhone('416-555-0199', 'CA')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+14165550199',
      country: 'CA',
    });
    expect(validateAndNormalizePhone('787 555 0100', 'PR')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+17875550100',
      country: 'PR',
    });

    // Pasted complete + international number overrides local selector country cleanly
    expect(validateAndNormalizePhone('+1 (416) 555-0199', 'PH')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+14165550199',
      country: 'CA',
    });
    expect(validateAndNormalizePhone('+63 917 123 4567', 'US')).toEqual({
      valid: true,
      isEmpty: false,
      e164: '+639171234567',
      country: 'PH',
    });
  });

  it('detects country codes from pasted + numbers and handles empty or invalid numbers safely', () => {
    expect(detectCountryFromInternationalInput('+1 416 555 0199', 'PH')).toBe('CA');
    expect(detectCountryFromInternationalInput('+44 20 7946 0958', 'PH')).toBe('GB');
    expect(detectCountryFromInternationalInput('0917 123 4567', 'PH')).toBeNull();

    expect(validateAndNormalizePhone('', 'PH')).toEqual({ valid: true, isEmpty: true });
    expect(validateAndNormalizePhone('   ', 'US')).toEqual({ valid: true, isEmpty: true });
    expect(validateAndNormalizePhone(undefined, 'PH')).toEqual({ valid: true, isEmpty: true });

    expect(validateAndNormalizePhone('Call 0917 123 4567', 'PH').valid).toBe(false);
    expect(validateAndNormalizePhone('+63 917 123 4567 ext. 12', 'PH').error).toContain('without an extension');
    expect(detectCountryFromInternationalInput('+1 416 555 0199 call me', 'PH')).toBeNull();

    const invalidShort = validateAndNormalizePhone('12345', 'PH');
    expect(invalidShort.valid).toBe(false);
    expect(invalidShort.error).toContain('Philippines (+63)');

    const invalidLetters = validateAndNormalizePhone('0917abc4567', 'PH');
    expect(invalidLetters.valid).toBe(false);

    const wrongRegionLocal = validateAndNormalizePhone('0917 123 4567', 'US');
    expect(wrongRegionLocal.valid).toBe(false);
    expect(wrongRegionLocal.error).toContain('United States (+1)');

    const invalidCountryCode = validateAndNormalizePhone('+999 123 456', 'PH');
    expect(invalidCountryCode.valid).toBe(false);
  });
});
