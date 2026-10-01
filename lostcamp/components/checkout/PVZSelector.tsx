import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Check, ChevronDown } from 'lucide-react';
import { DeliveryCompany, PVZPoint } from '../../types/delivery';
import { PVZ_POINTS } from '../../data/deliveryData';

interface PVZSelectorProps {
  company: DeliveryCompany;
  selectedCity: string;
  selectedPvzId?: string;
  onSelectPvz: (pvz: PVZPoint) => void;
  placeholder?: string;
}

// Typable address field — no separate search box, no filters/chips. Clicking
// it (or clearing it) shows every PVZ address for the chosen carrier (scoped
// to the city once one is typed above); typing a substring narrows that same
// list by address text, same interaction pattern as the city/street fields.
export const PVZSelector: React.FC<PVZSelectorProps> = ({
  company,
  selectedCity,
  selectedPvzId,
  onSelectPvz,
  placeholder = 'выберите пункт выдачи',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPoint = useMemo(() => PVZ_POINTS.find((p) => p.id === selectedPvzId), [selectedPvzId]);

  const points = useMemo(() => {
    let list = PVZ_POINTS.filter((p) => p.company === company);

    const city = selectedCity.trim().toLowerCase();
    if (city) {
      const scoped = list.filter((p) => p.city.toLowerCase().includes(city));
      if (scoped.length > 0) list = scoped;
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.address.toLowerCase().includes(q));
    }

    return list;
  }, [company, selectedCity, query]);

  const displayValue = isOpen ? query : selectedPoint ? selectedPoint.address : '';

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`w-full h-11 px-3 flex items-center bg-white border rounded-[2px] transition-colors ${
          isOpen ? 'border-neutral-900' : 'border-neutral-300 hover:border-neutral-400'
        }`}
      >
        <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mr-2" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="flex-1 min-w-0 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent truncate"
        />
        <ChevronDown
          onClick={() => setIsOpen((v) => !v)}
          className={`w-4 h-4 text-neutral-500 shrink-0 ml-2 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-white border border-neutral-300 rounded-[2px] shadow-lg max-h-60 overflow-y-auto divide-y divide-neutral-100 text-sm">
          {points.length === 0 && (
            <div className="p-3 text-neutral-400 text-center text-xs">Ничего не найдено</div>
          )}
          {points.map((p) => {
            const isSelected = p.id === selectedPvzId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPvz(p);
                  setQuery('');
                  setIsOpen(false);
                }}
                className={`p-2.5 px-3 cursor-pointer flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                  isSelected ? 'bg-neutral-100 font-semibold text-neutral-900' : 'text-neutral-700'
                }`}
              >
                <span className="truncate">{p.address}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
