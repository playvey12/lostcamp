import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { contactService } from '../services/contactService';
import { usePageTitle } from '../hooks/usePageTitle';

export const ContactsPage: React.FC = () => {
  usePageTitle('Контакты');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setLoading(true);
    setErrorMsg('');
    const contactString = `Имя: ${name.trim()}, Тел: ${phone.trim()}${email.trim() ? `, Email: ${email.trim()}` : ''}`;
    try {
      await contactService.submitContact(contactString, message);
      setFormSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (err: any) {
      console.error('Failed to submit contact page form:', err);
      setErrorMsg(err.message || 'Ошибка отправки формы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Title */}
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
          КОНТАКТЫ
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Свяжитесь с отделом продаж и технической поддержкой LOST CAMP
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-5">
            <h2 className="font-bold text-base uppercase text-black border-b border-neutral-200 pb-3">
              ОФИС И ПРОИЗВОДСТВО
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-800">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2e4733] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-black">Адрес:</span>
                  <span>г. Москва, ул. Промышленная, д. 11, стр. 3</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#2e4733] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-black">Телефон / Viber:</span>
                  <a href="tel:+79101137526" className="hover:underline font-mono">
                    +7 (910) 113-75-26
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#2e4733] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-black">Электронная почта:</span>
                  <a href="mailto:impall.sales@gmail.com" className="hover:underline font-mono">
                    impall.sales@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#2e4733] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-black">График работы:</span>
                  <span>Пн — Пт: с 09:00 до 19:00 (МСК)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black text-white p-6 space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider">Оптовые закупки и спецзаказы</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              По вопросам снабжения подразделений, оптовых поставок и изготовления по ТЗ обращайтесь к менеджеру:
            </p>
            <div className="space-y-1">
              <a href="mailto:impall.sales@gmail.com" className="block text-xs font-mono font-bold text-[#a0cfa8] hover:underline">
                impall.sales@gmail.com
              </a>
              <a href="https://t.me/Impall_sales" target="_blank" rel="noopener noreferrer" className="block text-xs font-mono font-bold text-[#a0cfa8] hover:underline">
                Telegram: @Impall_sales
              </a>
            </div>
          </div>

          {/* Socials & Marketplaces Block */}
          <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase text-black border-b border-neutral-200 pb-2">
              МАРКЕТПЛЕЙСЫ И СОЦСЕТИ
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="https://ozon.by/seller/lost-camp/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#005bff] text-white font-bold rounded-xs hover:bg-[#004edc] transition-colors"
              >
                OZON Магазин
              </a>
              <a
                href="https://www.wildberries.by/seller/4150703"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#cb11ab] text-white font-bold rounded-xs hover:bg-[#b00e94] transition-colors"
              >
                WB Магазин
              </a>
              <a
                href="https://t.me/Lost_Camp_ru"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#24A1DE] text-white font-medium rounded-xs hover:bg-[#1d82b3] transition-colors"
              >
                Telegram Канал
              </a>
              <a
                href="https://vk.ru/lost.camp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0077FF] text-white font-medium rounded-xs hover:bg-[#005ccc] transition-colors"
              >
                ВКонтакте
              </a>
              <a
                href="https://max.ru/Impall_sales"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#111111] text-white font-medium rounded-xs hover:bg-[#222222] transition-colors"
                title="MAX Мессенджер"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 664 664">
                  <g transform="translate(0,664) scale(0.1,-0.1)">
                    <path d="M3025 5593 c-347 -41 -581 -106 -830 -231 -639 -319 -1071 -963 -1199 -1787 -61 -395 -32 -745 120 -1405 43 -190 59 -250 110 -435 59 -214 74 -299 80 -440 7 -192 9 -200 57 -252 69 -75 102 -87 232 -80 220 10 402 90 597 260 114 101 100 98 166 35 242 -230 793 -341 1312 -262 698 105 1126 366 1492 909 344 509 500 1148 424 1725 -141 1064 -908 1823 -1976 1955 -113 14 -494 19 -585 8z m473 -1229 c408 -79 732 -375 846 -775 66 -231 60 -409 -20 -642 -133 -383 -383 -632 -724 -719 -297 -76 -719 -29 -867 96 l-33 28 -52 -46 c-102 -89 -229 -141 -273 -112 -78 51 -162 348 -186 657 -42 556 61 940 328 1220 245 256 610 365 981 293z" />
                  </g>
                </svg>
                <span>Канал в MAX</span>
              </a>
              <a
                href="https://t.me/Impall_sales"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#2a3d2e] text-white font-medium rounded-xs hover:bg-[#1f2e22] transition-colors"
              >
                Написать менеджеру в Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Feedback Form Side */}
        <div className="lg:col-span-7 self-start border border-neutral-200 p-6 sm:p-8 bg-white space-y-6">
          <h2 className="font-bold text-lg uppercase text-black border-b border-neutral-200 pb-3">
            ФОРМА ОБРАТНОЙ СВЯЗИ
          </h2>

          {formSubmitted ? (
            <div className="bg-[#f2f8f3] border border-[#2e4733] p-6 text-center space-y-2">
              <h3 className="font-bold text-base text-[#2e4733]">Сообщение успешно отправлено!</h3>
              <p className="text-xs text-neutral-600">Наш специалист свяжется с вами в ближайшее время.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-700 mb-1">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Иван"
                    className="w-full border border-neutral-300 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-700 mb-1">
                    Телефон / Telegram *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+7 (900) 000-00-00"
                    className="w-full border border-neutral-300 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full border border-neutral-300 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-neutral-700 mb-1">
                  Ваше сообщение / Вопрос *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Опишите ваш вопрос или необходимую экипировку..."
                  className="w-full border border-neutral-300 p-2.5 text-xs text-black focus:outline-none focus:border-black resize-none"
                ></textarea>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 font-medium">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-[#2e4733] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#233827] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Отправка...' : 'Отправить сообщение'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
