import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  ALL_PHONE_COUNTRIES,
  detectCountryFromInternationalInput,
  filterPhoneCountries,
  getPhoneCountryOption,
  type CountryCode,
} from '../lib/phone';

interface PhoneNumberFieldProps {
  country: CountryCode;
  value: string;
  error?: string | null;
  onCountryChange: (country: CountryCode) => void;
  onValueChange: (value: string) => void;
}

export const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  country,
  value,
  error,
  onCountryChange,
  onValueChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const telInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(() => getPhoneCountryOption(country), [country]);
  const filteredCountries = useMemo(() => filterPhoneCountries(query), [query]);

  useEffect(() => {
    if (!open) return;
    const selectedIdx = filteredCountries.findIndex((c) => c.code === country);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [open, filteredCountries, country]);

  useEffect(() => {
    if (!open) return;
    const raf = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const activeOption = filteredCountries[activeIndex];
    if (!activeOption || !listboxRef.current) return;
    const el = listboxRef.current.querySelector<HTMLElement>(
      `#consult-phone-country-opt-${activeOption.code}`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, filteredCountries]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const selectCountry = (nextCountry: CountryCode) => {
    onCountryChange(nextCountry);
    setOpen(false);
    setQuery('');
    window.requestAnimationFrame(() => {
      telInputRef.current?.focus();
    });
  };

  const closeMenuToButton = () => {
    setOpen(false);
    setQuery('');
    window.requestAnimationFrame(() => {
      buttonRef.current?.focus();
    });
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      closeMenuToButton();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredCountries.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % filteredCountries.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredCountries.length === 0) return;
      setActiveIndex((prev) => (prev - 1 + filteredCountries.length) % filteredCountries.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (filteredCountries.length > 0) setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (filteredCountries.length > 0) setActiveIndex(filteredCountries.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredCountries[activeIndex];
      if (chosen) selectCountry(chosen.code);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenuToButton();
    } else if (e.key === 'Tab') {
      setOpen(false);
      setQuery('');
    }
  };

  const handleTelChange = (nextValue: string) => {
    onValueChange(nextValue);
    const detected = detectCountryFromInternationalInput(nextValue, country);
    if (detected && detected !== country) {
      onCountryChange(detected);
    }
  };

  const activeOption = filteredCountries[activeIndex];
  const describedBy = error
    ? 'consult-phone-error consult-phone-hint'
    : 'consult-phone-hint';

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="consult-phone"
        className="block text-xs font-medium text-[#DFC585]"
      >
        Contact Number <span className="font-normal text-[#C2D0D6]/80">(Optional)</span>
      </label>

      <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div className="relative min-w-0">
          <button
            ref={buttonRef}
            id="consult-phone-country"
            type="button"
            aria-label={`Country or territory calling code, selected ${selectedOption.label}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls="consult-phone-country-listbox"
            onClick={() => setOpen((prev) => !prev)}
            onKeyDown={handleButtonKeyDown}
            className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-[#C8A253]/25 bg-[#06141E] px-3 py-2 text-left text-sm text-[#F5F2EB] transition-colors hover:border-[#C8A253]/50 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
          >
            <span className="truncate">{selectedOption.label}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#DFC585]/80 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {open && (
            <div className="absolute left-0 top-full z-40 mt-1.5 w-full min-w-[260px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-[#C8A253]/30 bg-[#0A202B] shadow-2xl sm:w-80">
              <div className="border-b border-[#C8A253]/15 p-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#DFC585]/70"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    id="consult-phone-country-search"
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls="consult-phone-country-listbox"
                    aria-activedescendant={
                      activeOption
                        ? `consult-phone-country-opt-${activeOption.code}`
                        : undefined
                    }
                    aria-label="Search country or territory"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search country, ISO, or +code..."
                    className="min-h-[38px] w-full rounded-lg border border-[#C8A253]/25 bg-[#06141E] pl-8 pr-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:border-[#C8A253] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
                  />
                </div>
              </div>

              <ul
                ref={listboxRef}
                id="consult-phone-country-listbox"
                role="listbox"
                aria-label="Countries and territories"
                className="max-h-60 overflow-y-auto py-1"
              >
                {filteredCountries.length === 0 ? (
                  <li className="px-3.5 py-3 text-xs text-[#C2D0D6]">
                    No matching countries or territories.
                  </li>
                ) : (
                  filteredCountries.map((option, idx) => {
                    const isSelected = option.code === country;
                    const isActive = idx === activeIndex;
                    return (
                      <li
                        key={option.code}
                        id={`consult-phone-country-opt-${option.code}`}
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCountry(option.code)}
                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs transition-colors ${
                          isActive
                            ? 'bg-[#123846] text-[#F5F2EB]'
                            : 'text-[#C2D0D6] hover:bg-[#123846]/70'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate">{option.name}</span>
                          <span className="shrink-0 font-mono text-[11px] text-[#DFC585]">
                            ({option.dialCode})
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#DFC585]" aria-hidden="true" />
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="border-t border-[#C8A253]/10 bg-[#06141E]/80 px-3 py-1.5 text-[10px] text-[#C2D0D6]/70">
                {ALL_PHONE_COUNTRIES.length} countries &amp; territories supported
              </div>
            </div>
          )}
        </div>

        <input
          ref={telInputRef}
          id="consult-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(e) => handleTelChange(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          placeholder={
            country === 'PH'
              ? 'e.g. 0917 123 4567 or +63 917 123 4567'
              : `Local number or ${selectedOption.dialCode} international`
          }
          className={`min-h-[42px] w-full rounded-lg border bg-[#06141E] px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#F5F2EB]/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253] ${
            error
              ? 'border-amber-400/75 focus:border-amber-300'
              : 'border-[#C8A253]/25 focus:border-[#C8A253]'
          }`}
        />
      </div>

      {error && (
        <p id="consult-phone-error" role="alert" className="mt-1.5 text-xs font-medium text-amber-300">
          {error}
        </p>
      )}
      <p id="consult-phone-hint" className="mt-1.5 text-[11px] text-[#C2D0D6]/75">
        Enter a local number for the selected country or paste a complete + international number.
      </p>
    </div>
  );
};
