import React from 'react';
import { Truck, CreditCard, ShieldCheck, MapPin, Send, Store } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useShop } from '../context/ShopContext';

interface DeliveryMethod {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  footer: string;
}

const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    icon: <Truck className="w-5 h-5" />,
    title: 'СДЭК',
    subtitle: '(пвз и до двери)',
    description:
      'Доставка крупногабаритных и мелкогабаритных заказов до пункта выдачи или курьером до двери в любой город.',
    footer: 'срок: от 2 до 5 дней',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: 'ПОЧТА РОССИИ',
    subtitle: '(пвз и до двери)',
    description: 'Доставка в отдаленные населенные пункты до пункта выдачи заказов или курьером до двери.',
    footer: 'срок: от 3 до 10 дней',
  },
  {
    icon: <Send className="w-5 h-5" />,
    title: 'ЯНДЕКС ДОСТАВКА',
    subtitle: '(пвз и до двери)',
    description: 'Доставка до пункта выдачи заказов или курьером до двери в любой город.',
    footer: 'срок: от 1 до 3 дней',
  },
  {
    icon: <Store className="w-5 h-5" />,
    title: 'САМОВЫВОЗ',
    subtitle: '(бесплатно)',
    description: 'Заберите заказ самостоятельно из нашего пункта выдачи — выберите самовывоз при оформлении заказа.',
    footer: 'срок: от 1 до 2 дней',
  },
];

export const DeliveryPage: React.FC = () => {
  usePageTitle('Доставка');
  const { setIsCartOpen } = useShop();

  return (
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Title */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
            доставка и оплата
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            условия доставки и оплаты по России
          </p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="shrink-0 px-5 py-2.5 bg-[#2e4733] hover:bg-[#213227] text-white text-xs font-semibold uppercase tracking-wide rounded-md transition-colors"
        >
          перейти в корзину
        </button>
      </div>

      {/* Grid of Delivery Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DELIVERY_METHODS.map((method) => (
          <div key={method.title} className="border border-neutral-200 p-6 bg-neutral-50 space-y-3">
            <div className="w-10 h-10 bg-[#2e4733] text-white flex items-center justify-center font-bold">
              {method.icon}
            </div>
            <h3 className="font-bold text-base text-black">
              {method.title} <span className="font-normal normal-case text-neutral-500 text-sm">{method.subtitle}</span>
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{method.description}</p>
            <span className="inline-block text-xs font-mono text-neutral-500 pt-2">{method.footer}</span>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
          способы оплаты
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-neutral-200 p-6 flex gap-4 items-start">
            <CreditCard className="w-8 h-8 text-[#2e4733] shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm uppercase text-black">Банковской картой онлайн</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Оплата банковскими картами МИР, Visa, Mastercard, а также через СБП (Систему Быстрых Платежей). Комиссия 0%.
              </p>
            </div>
          </div>

          <div className="border border-neutral-200 p-6 flex gap-4 items-start">
            <ShieldCheck className="w-8 h-8 text-[#2e4733] shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm uppercase text-black">Безналичный расчет для юр. лиц</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Выставление счета без НДС для организаций и ИП. Предоставляем полный комплект закрывающих документов (УПД).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
