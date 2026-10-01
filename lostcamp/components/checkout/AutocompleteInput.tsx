import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, User, Check, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { FIELD_HINTS } from '../../data/deliveryData';
import { SuggestResult } from '../../services/deliverySuggestService';

interface AutocompleteInputProps {
  id?: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  fieldKey?: keyof typeof FIELD_HINTS;
  // Static suggestion list (used as a fallback when no async fetcher is given,
  // or while the async fetcher is still loading).
  suggestions?: string[];
  // Optional async suggestion source (DaData, etc). Called with the current
  // input text; returns the matches plus an optional error message so failures
  // are visible instead of silently looking like "nothing found".
  fetchSuggestions?: (query: string) => Promise<SuggestResult>;
  lkValue?: string;
  className?: string;
  type?: string;
  required?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  fieldKey,
  suggestions = [],
  fetchSuggestions,
  lkValue,
  className = '',
  type = 'text',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [asyncSuggestions, setAsyncSuggestions] = useState<string[] | null>(null);
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const [isLoadingAsync, setIsLoadingAsync] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (hintRef.current && !hintRef.current.contains(e.target as Node)) {
        setShowHint(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced async suggestion fetch (e.g. DaData) whenever the query changes.
  useEffect(() => {
    if (!fetchSuggestions) return;
    const query = (value || filterQuery).trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query) {
      setAsyncSuggestions(null);
      setAsyncError(null);
      setIsLoadingAsync(false);
      return;
    }

    setIsLoadingAsync(true);
    const myRequestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await fetchSuggestions(query);
        if (myRequestId === requestIdRef.current) {
          setAsyncSuggestions(result.suggestions);
          setAsyncError(result.error || null);
        }
      } catch (_e) {
        if (myRequestId === requestIdRef.current) {
          setAsyncSuggestions([]);
          setAsyncError('Не удалось получить подсказки');
        }
      } finally {
        if (myRequestId === requestIdRef.current) setIsLoadingAsync(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, filterQuery]);

  const hintInfo = fieldKey ? FIELD_HINTS[fieldKey] : null;

  // Filter suggestions alphabetically or by input
  const filteredSuggestions = React.useMemo(() => {
    if (fetchSuggestions) {
      return asyncSuggestions || [];
    }
    if (!suggestions || suggestions.length === 0) return [];
    const query = (value || filterQuery).toLowerCase().trim();
    if (!query) {
      // Return sorted alphabetically (first 15)
      return [...suggestions].sort((a, b) => a.localeCompare('ru')).slice(0, 15);
    }
    const filtered = suggestions.filter((item) => item.toLowerCase().includes(query));
    return filtered.slice(0, 15);
  }, [suggestions, value, filterQuery, fetchSuggestions, asyncSuggestions]);

  const hasLkSuggestion = lkValue && lkValue.trim() !== '' && lkValue !== value;

  // The dropdown chevron only makes sense once there's something worth
  // opening. For static suggestion lists it's always available; for async
  // (DaData-style) sources it only appears once the user starts typing,
  // so empty fields like "город" / "улица" don't show a chevron that does
  // nothing until you type a letter.
  const hasTypedQuery = (value || filterQuery).trim().length > 0;
  const showDropdownIcon = suggestions.length > 0 || (!!fetchSuggestions && hasTypedQuery);

  // How many icon slots will actually render on the right side of the
  // input. Used to reserve just enough padding so the value text never
  // runs under the icons instead of guessing a single fixed padding for
  // every field.
  const iconCount =
    (isLoadingAsync ? 1 : 0) + (hasLkSuggestion ? 1 : 0) + (hintInfo ? 1 : 0) + (showDropdownIcon ? 1 : 0);
  // ~18px per icon slot + 10px outer inset, plus a little breathing room.
  const inputPaddingRight = iconCount > 0 ? 10 + iconCount * 20 + 6 : 12;

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      <div className="relative flex items-center">
        <input
          id={id || `field-${name}`}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFilterQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          style={{ paddingRight: inputPaddingRight }}
          className="w-full h-11 pl-3 py-2 text-xs sm:text-sm bg-white text-neutral-900 border border-neutral-300 rounded-[2px] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-800 transition-colors shadow-none"
        />

        {/* Action icons inside input: LK hint & info popup */}
        <div className="absolute right-2.5 flex items-center gap-1.5 text-neutral-400">
          {isLoadingAsync && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />}

          {hasLkSuggestion && (
            <button
              type="button"
              onClick={() => {
                onChange(lkValue);
                setIsOpen(false);
              }}
              title={`Заполнить из профиля: ${lkValue}`}
              className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          )}

          {hintInfo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHint(!showHint);
              }}
              title="Подсказка по полю"
              className="p-1 rounded hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {showDropdownIcon && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:text-neutral-700 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Field Hint Popover */}
      {showHint && hintInfo && (
        <div
          ref={hintRef}
          className="absolute z-50 top-full mt-1.5 right-0 w-72 p-3 bg-neutral-900 text-white rounded-md shadow-xl text-xs space-y-1.5 border border-neutral-700 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center justify-between font-semibold text-neutral-200">
            <span>{hintInfo.title}</span>
            <button onClick={() => setShowHint(false)} className="text-neutral-400 hover:text-white">
              ✕
            </button>
          </div>
          <p className="text-neutral-300 leading-relaxed">{hintInfo.hint}</p>
          <div className="pt-1 border-t border-neutral-800 text-[11px] text-neutral-400">
            <span className="text-neutral-500">Например: </span>
            <span className="text-blue-300">{hintInfo.example}</span>
          </div>
        </div>
      )}

      {/* Dropdown Suggestions */}
      {isOpen &&
        (hasLkSuggestion || filteredSuggestions.length > 0 || isLoadingAsync || (!!fetchSuggestions && !!(value || filterQuery).trim())) && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-white border border-neutral-300 rounded-[2px] shadow-lg max-h-60 overflow-y-auto divide-y divide-neutral-100 text-xs">
          {/* LK Profile Suggestion Banner */}
          {hasLkSuggestion && (
            <div
              onClick={() => {
                onChange(lkValue);
                setIsOpen(false);
              }}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 cursor-pointer flex items-center justify-between text-blue-900 font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                    Из вашего профиля ЛК
                  </div>
                  <div className="font-bold">{lkValue}</div>
                </div>
              </div>
              <span className="text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                Применить
              </span>
            </div>
          )}

          {/* Alphabetical / Filtered / async (DaData) suggestions */}
          {filteredSuggestions.map((item, idx) => {
            const isSelected = item === value;
            return (
              <div
                key={idx}
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
                className={`p-2.5 px-3 cursor-pointer flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                  isSelected ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-700'
                }`}
              >
                <span>{item}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900" />}
              </div>
            );
          })}

          {isLoadingAsync && filteredSuggestions.length === 0 && (
            <div className="p-3 text-neutral-400 text-center flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> ищем совпадения…
            </div>
          )}

          {!isLoadingAsync && asyncError && filteredSuggestions.length === 0 && (
            <div className="p-3 text-red-600 text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {asyncError}
            </div>
          )}

          {!isLoadingAsync && !asyncError && filteredSuggestions.length === 0 && !hasLkSuggestion && (
            <div className="p-3 text-neutral-400 text-center">
              Ничего не найдено. Можно ввести значение вручную.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
