import React, { useState } from 'react';
import { Phone, Mail, MapPin, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contactService } from '../services/contactService';

interface ContactsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactsDropdown: React.FC<ContactsDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim() || !message.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await contactService.submitContact(contactInfo, message);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setContactInfo('');
        setMessage('');
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit contact dropdown:', err);
      setErrorMsg(err.message || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -15, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -15, height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white overflow-hidden font-sans z-30 relative max-h-[85vh] md:max-h-none overflow-y-auto shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8 relative">
            
            {/* Title & Top Close Button */}
            <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-black tracking-tight font-sans lowercase">
                напишите нам
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-black bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-md transition-colors cursor-pointer"
                aria-label="Закрыть контакты"
                title="Закрыть контакты"
              >
                <span>закрыть</span>
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* 3-Column Grid matching rows 1:1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 lg:gap-x-12 items-start">
              
              {/* Left Column: Form (5 cols) */}
              <div className="md:col-span-5 lg:col-span-4 space-y-3">
                {submitted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-center space-y-2 py-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                    <p className="text-xs font-semibold text-emerald-800">
                      Сообщение успешно отправлено!
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      Наш менеджер ответит вам в ближайшее время.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Row 1: Contact input */}
                    <div>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="ваш телефон или адрес электронной почты"
                        required
                        className="w-full h-[38px] bg-[#e2e2e2] border border-black px-3.5 text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:bg-[#dedede] rounded-none"
                      />
                    </div>

                    {/* Row 2 & 3: Message textarea (spans height of row 2 + gap + row 3) */}
                    <div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="сообщение"
                        required
                        className="w-full h-[88px] bg-[#e2e2e2] border border-black px-3.5 py-2.5 text-xs text-black placeholder:text-neutral-500 focus:outline-none focus:bg-[#dedede] rounded-none resize-none"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-[11px] text-red-600 font-medium">
                        {errorMsg}
                      </p>
                    )}

                    {/* Row 4: Green Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-[38px] bg-[#2d4233] hover:bg-[#1f2e22] text-white text-xs sm:text-sm font-normal text-center transition-colors cursor-pointer rounded-none disabled:opacity-50 lowercase tracking-wide flex items-center justify-center"
                    >
                      {loading ? 'отправка...' : 'отправить сообщение'}
                    </button>
                  </form>
                )}
              </div>

              {/* Center Column: Messenger buttons aligned with Rows 1, 2, 3 (3 or 4 cols) */}
              <div className="md:col-span-3 lg:col-span-4 space-y-3 pt-3 md:pt-0">
                {/* Row 1 Button */}
                <a
                  href="https://t.me/Impall_sales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[38px] border border-black bg-white px-4 text-xs sm:text-sm text-black font-normal flex items-center justify-center rounded-none hover:bg-neutral-50 transition-colors cursor-pointer block lowercase"
                >
                  напишите нам в Telrgram
                </a>

                {/* Row 2 Button */}
                <a
                  href="viber://chat?number=%2B79101137526"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[38px] border border-black bg-white px-4 text-xs sm:text-sm text-black font-normal flex items-center justify-center rounded-none hover:bg-neutral-50 transition-colors cursor-pointer block lowercase"
                >
                  напишите нам в Viber
                </a>

                {/* Row 3 Button */}
                <a
                  href="https://max.ru/Impall_sales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[38px] border border-black bg-white px-4 text-xs sm:text-sm text-black font-normal flex items-center justify-center rounded-none hover:bg-neutral-50 transition-colors cursor-pointer block lowercase"
                >
                  напишите нам в Max
                </a>
              </div>

              {/* Right Column: Contact details (Rows 1, 2, 3) & Social badges (Row 4) */}
              <div className="md:col-span-4 lg:col-span-4 space-y-3 pt-3 md:pt-0">
                {/* Row 1 Contact: Phone */}
                <div className="h-[38px] flex items-center space-x-3 text-xs sm:text-sm text-black">
                  <Phone className="w-4 h-4 text-neutral-600 stroke-[1.25] shrink-0" />
                  <a href="tel:+79101137526" className="hover:underline font-light text-black">
                    +7 910 113 7526
                  </a>
                </div>

                {/* Row 2 Contact: Email */}
                <div className="h-[38px] flex items-center space-x-3 text-xs sm:text-sm text-black">
                  <Mail className="w-4 h-4 text-neutral-600 stroke-[1.25] shrink-0" />
                  <a href="mailto:impall.sales@gmail.com" className="hover:underline font-light text-black">
                    impall.sales@gmail.com
                  </a>
                </div>

                {/* Row 3 Contact: Address */}
                <div className="h-[38px] flex items-center space-x-3 text-xs sm:text-sm text-black">
                  <MapPin className="w-4 h-4 text-neutral-600 stroke-[1.25] shrink-0" />
                  <span className="font-light text-black">xxxxxxxxxxxx</span>
                </div>

                {/* Row 4: Social Badges aligned on bottom right */}
                <div className="h-[38px] flex items-center justify-start md:justify-end space-x-2.5 pt-1">
                  

                              
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
                  {/* WB Badge */}
                  <a
                    href="https://www.wildberries.by/seller/4150703"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-full bg-[#d81b9c] hover:bg-[#b00e94] text-white font-black text-[11px] tracking-wider transition-colors cursor-pointer shrink-0"
                    title="Wildberries"
                  >
                    WB
                  </a>

                  {/* Ozon Badge */}
                  <a
                    href="https://ozon.by/seller/lost-camp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1 rounded-full bg-[#005bff] hover:bg-[#004edc] text-white font-black text-[11px] tracking-wider transition-colors cursor-pointer shrink-0"
                    title="OZON"
                  >
                    OZON
                  </a>

                </div>
              </div>

            </div>

            {/* Mobile Close Button at bottom */}
            <div className="mt-6 md:hidden pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#2d4233] text-white text-xs font-medium lowercase tracking-wide rounded-md hover:bg-[#1f2e22] active:bg-[#18241b] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>закрыть контакты</span>
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Full-width bottom divider line matching screenshot */}
          <div className="w-full border-b border-neutral-300" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

