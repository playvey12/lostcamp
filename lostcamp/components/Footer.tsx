import React, { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { LostCampLogo } from './LostCampLogo';
import { contactService } from '../services/contactService';

interface FooterProps {
  onNavClick: (nav: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  const [contactInput, setContactInput] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim() || !message.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await contactService.submitContact(contactInput, message);
      setSubmitted(true);
      setContactInput('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      console.error('Failed to submit contact form:', err);
      setErrorMsg(err.message || 'Произошла ошибка при отправке сообщения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#121312] text-white pt-12 pb-8 border-t border-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-10">
          
          {/* Left Column (Logo + Text + Form) - 5 Cols */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Logo and Subtitle Row */}
            <div className="flex items-start space-x-4">
              <button
                onClick={() => onNavClick('home')}
                className="shrink-0 cursor-pointer focus:outline-none"
                title="На главную"
              >
                <LostCampLogo variant="white" className="h-10 sm:h-12 w-auto" />
              </button>
              <p className="text-xs text-neutral-300 font-normal leading-snug max-w-[210px] pt-1">
                Для тех, кто не ищет компромиссов наше снаряжение готово к любым испытаниям
              </p>
            </div>

            {/* "напишите нам" Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-base sm:text-lg font-normal text-white font-sans tracking-tight">
                напишите нам
              </h4>

              {submitted ? (
                <div className="p-3 bg-[#233827] text-green-200 text-xs border border-green-800">
                  Сообщение отправлено!
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2.5 max-w-sm">
                  <input
                    type="text"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder="ваш телефон или адрес электронной почты"
                    className="w-full bg-[#222322] border border-neutral-800 text-white placeholder:text-neutral-500 text-xs px-3.5 py-2.5 focus:outline-none focus:border-neutral-600 rounded-none transition-colors"
                    required
                  />

                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="сообщение"
                    className="w-full bg-[#222322] border border-neutral-800 text-white placeholder:text-neutral-500 text-xs px-3.5 py-2.5 focus:outline-none focus:border-neutral-600 rounded-none transition-colors resize-none"
                    required
                  />

                  {errorMsg && (
                    <p className="text-[11px] text-red-400 leading-tight">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#2f4333] hover:bg-[#233527] text-white text-xs font-normal transition-colors cursor-pointer disabled:opacity-50 text-center"
                  >
                    {loading ? 'отправка...' : 'отправить сообщение'}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Navigation Column (Col 2 - 3 Cols) */}
          <div className="lg:col-span-3 lg:pl-6 space-y-4 pt-2">
            <h4 className="text-base sm:text-lg font-normal text-white font-sans tracking-tight">
              навигация
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-300 font-normal">
              <li>
                <button onClick={() => onNavClick('catalog')} className="hover:text-white transition-colors cursor-pointer">
                  • каталог
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('about')} className="hover:text-white transition-colors cursor-pointer">
                  • о нас
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('delivery')} className="hover:text-white transition-colors cursor-pointer">
                  • доставка и оплата
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('faq')} className="hover:text-white transition-colors cursor-pointer">
                  • FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Information Column (Col 3 - 4 Cols) */}
          <div className="lg:col-span-4 space-y-4 pt-2">
            <h4 className="text-base sm:text-lg font-normal text-white font-sans tracking-tight">
              информация
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-300 font-normal">
              <li>
                <button onClick={() => onNavClick('contacts')} className="hover:text-white transition-colors cursor-pointer">
                  • контакты
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('news')} className="hover:text-white transition-colors cursor-pointer">
                  • новости
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('terms')} className="hover:text-white transition-colors cursor-pointer">
                  • пользовательское соглашение
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('privacy')} className="hover:text-white transition-colors cursor-pointer">
                  • политика конфиденциальности
                </button>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom Contacts & Social Row */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          
          {/* Left Contacts Info */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-neutral-300 font-mono">
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <a href="tel:+79101137526" className="hover:underline">
                +7 (910) 113-75-26
              </a>
            </div>
            <div className="flex items-center space-x-2 font-sans">
              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <a href="mailto:impall.sales@gmail.com" className="hover:underline">
                impall.sales@gmail.com
              </a>
            </div>
            <div className="flex items-center space-x-2 font-sans">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>г. Москва, ул. Промышленная, д. 11, стр. 3</span>
            </div>
          </div>

          {/* Right Social & Marketplace Logos */}
          <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0">
               
                        
  {/* Telegram */}
 <a
  href="https://t.me/Lost_Camp_ru"
  target="_blank"
  rel="noopener noreferrer"
  className="w-7 h-7 pr-0.5 rounded-full bg-black flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-sm"
  title="Telegram Канал"
>
  <svg
    className="w-[22px] h-[22px]"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M21.4 4.6L18.3 19.2C18.1 20.2 17.5 20.5 16.7 20L12.4 16.8L10.3 18.8C10.1 19 9.9 19.2 9.5 19.2L9.8 14.8L17.8 7.6C18.2 7.2 17.7 7 17.2 7.3L7.3 13.5L3 12.1C2.1 11.8 2.1 11.2 3.2 10.8L20 4.3C20.8 4 21.6 4.2 21.4 4.6Z"
      fill="#ffffff"
    />
  </svg>
</a>

  {/* VK */}
  <a
    href="https://vk.ru/lost.camp"
    target="_blank"
    rel="noopener noreferrer"
    className="w-7 h-7 pr-0.1 rounded-full bg-black flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-sm"
    title="ВКонтакте"
  >
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M13.1 17.5C8.1 17.5 5.2 14.1 5 8.5H7.5C7.6 12.6 9.4 14.3 10.8 14.7V8.5H13.2V12C14.6 11.8 16.1 10.2 16.6 8.5H19C18.6 10.6 16.9 12.2 15.8 12.9C16.9 13.5 18.8 14.9 19.7 17.5H17C16.5 15.9 15.1 14.6 13.2 14.4V17.5H13.1Z"
        fill="#ffffff"
      />
    </svg>
  </a>

  {/* MAX */}
  <a
    href="https://max.ru/join/MGVQ73hoXdiu6imgFtCwkBXRxNCxwLwNW_WhoOwQ2zs"
    target="_blank"
    rel="noopener noreferrer"
    className="w-7 h-7 pl-0.2 rounded-full bg-black flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-sm"
    title="MAX Мессенджер"
  >
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 664 664"
      fill="none"
    >
      <g transform="translate(0,664) scale(0.1,-0.1)">
        <path
          d="M3025 5593C2678 5552 2444 5487 2195 5362C1556 5043 1124 4399 996 3575C935 3180 964 2830 1116 2170C1159 1980 1175 1920 1226 1735C1285 1521 1300 1436 1306 1295C1313 1103 1315 1095 1363 1043C1432 968 1465 956 1595 966C1815 976 1997 1066 2192 1236C2306 1337 2292 1334 2358 1271C2600 1041 3151 930 3670 1035C4368 1140 4796 1401 5162 1944C5506 2453 5662 3092 5586 3669C5445 4733 4678 5492 3610 5624C3497 5638 3116 5642 3025 5593ZM3498 4364C3906 4285 4230 3989 4344 3589C4410 3358 4404 3180 4324 2947C4191 2564 3941 2315 3600 2244C3303 2168 2881 2215 2733 2340L2700 2368L2648 2322C2546 2233 2419 2181 2375 2225C2297 2276 2213 2573 2189 2882C2147 3438 2250 3822 2517 4102C2762 4358 3127 4469 3498 4364Z"
          fill="#ffffff"
        />
      </g>
    </svg>
  </a>

            {/* Wildberries Badge */}
            <a
              href="https://www.wildberries.by/seller/4150703"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-2xl bg-[#cb11ab] hover:bg-[#b00e94] text-white font-black text-[11px] tracking-wider transition-colors cursor-pointer shrink-0"
              title="Wildberries"
            >
              WB
            </a>

            {/* Ozon Badge */}
            <a
              href="https://ozon.by/seller/lost-camp/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-2xl bg-[#005bff] hover:bg-[#004edc] text-white font-black text-[11px] tracking-wider transition-colors cursor-pointer shrink-0"
              title="OZON"
            >
              OZON
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
};
