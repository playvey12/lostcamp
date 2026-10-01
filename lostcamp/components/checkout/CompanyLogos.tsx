import React from 'react';
import { Store } from 'lucide-react';
import { DeliveryCompany } from '../../types/delivery';

// Logo files live in /public/assets/delivery/. To swap in real official
// carrier logos later, just replace these files (or point LOGO_SRC at new
// .png/.svg paths) — no component code changes needed. "pickup" has no
// carrier logo file — it renders an icon instead, see below.
const LOGO_SRC: Partial<Record<DeliveryCompany, string>> = {
  post: '/assets/delivery/post_russia.svg',
  cdek: '/assets/delivery/cdek.svg',
  yandex: '/assets/delivery/yandex_delivery.svg',
};

const LOGO_ALT: Record<DeliveryCompany, string> = {
  post: 'Почта России',
  cdek: 'СДЭК',
  yandex: 'Яндекс Доставка',
  pickup: 'Самовывоз',
};

export const CompanyVisualLogo: React.FC<{ company: DeliveryCompany; className?: string }> = ({
  company,
  className = 'w-12 h-12',
}) => {
  if (company === 'pickup') {
    return (
      <div className={`${className} flex items-center justify-center select-none`}>
        <Store className="w-[65%] h-[65%] text-[#2e4733]" />
      </div>
    );
  }

  return (
    <img
      src={LOGO_SRC[company]}
      alt={LOGO_ALT[company]}
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
};
