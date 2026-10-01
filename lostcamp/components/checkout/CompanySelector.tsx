import React from 'react';
import { DeliveryCompany } from '../../types/delivery';
import { CompanyVisualLogo } from './CompanyLogos';

const COMPANIES: { id: DeliveryCompany; label: string }[] = [
  { id: 'post', label: 'почта России' },
  { id: 'cdek', label: 'СДЭК' },
  { id: 'yandex', label: 'яндекс доставка' },
  { id: 'pickup', label: 'самовывоз' },
];

interface CompanySelectorProps {
  activeCompany: DeliveryCompany;
  onSelect: (company: DeliveryCompany) => void;
  disabled?: boolean;
}

// Simple, static row — all four options laid out side by side at the same
// size. The active one is just highlighted (border + light background), not
// resized or repositioned, so nothing ever overlaps regardless of how many
// carriers are in the list.
export const CompanySelector: React.FC<CompanySelectorProps> = ({ activeCompany, onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mx-auto max-w-md">
      {COMPANIES.map((company) => {
        const isActive = company.id === activeCompany;
        return (
          <button
            key={company.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(company.id)}
            className="flex flex-col items-center gap-2 focus:outline-none"
          >
            <div
              className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 p-2.5 sm:p-3 bg-[#d8d8d8] rounded-md transition-colors ${
                isActive
                  ? 'border-[2.5px] border-neutral-900 shadow-md bg-neutral-100'
                  : 'border border-transparent opacity-75 hover:opacity-100 hover:border-neutral-400'
              }`}
            >
              <CompanyVisualLogo company={company.id} className="w-full h-full drop-shadow-sm" />
            </div>
            <span
              className={`text-center leading-tight transition-colors ${
                isActive ? 'text-[10px] sm:text-xs font-bold text-neutral-900' : 'text-[10px] text-neutral-500'
              }`}
            >
              {company.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
