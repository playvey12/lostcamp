import React, { useState } from 'react';
import { ShieldCheck, Lightbulb, Link as LinkIcon, Handshake, Phone } from 'lucide-react';
import { about } from '../assets/images';
import { usePageTitle } from '../hooks/usePageTitle';
import { contactService } from '../services/contactService';

export const AboutPage: React.FC = () => {
  usePageTitle('О нас');
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
      console.error('Failed to submit contact form from About page:', err);
      setErrorMsg(err.message || 'Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans">
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[380px] sm:h-[480px] md:h-[560px] bg-neutral-900 overflow-hidden">
        <img
          src={about}
          alt="Тактическое снаряжение LOST CAMP"
          className="w-full h-full object-cover object-center filter brightness-[0.82]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-3xl leading-[1.15] tracking-tight">
              Разрабатываем и производим<br />
              тактическое снаряжение,<br />
              отвечающее самым высоким<br />
              требованиям
            </h1>
          </div>
        </div>
      </div>

      {/* 2. НАША ИСТОРИЯ SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* Left Text */}
          <div className="md:col-span-7 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight">
              Наша История
            </h2>
            <div className="text-sm sm:text-base text-neutral-800 leading-relaxed space-y-4 font-normal max-w-2xl">
              <p>
                текст рыба Есть над чем задуматься: сторонники тоталитаризма в науке, инициированные исключительно синтетически, подвергнуты целой серии независимых исследований. А ещё действия представителей оппозиции смешаны с не уникальными данными до степени совершенной неузнаваемости, из-за чего возрастает их статус бесполезности. Как уже неоднократно упомянуто, интерактивные прототипы будут ограничены исключительно образом мышления. Вот вам яркий пример современных тенденций — начало повседневной работы по формированию позиции влечет за собой процесс внедрения и модернизации поэтапного и последовательного развития общества.
              </p>
            </div>
          </div>

          {/* Right Image/Placeholder Block */}
          <div className="md:col-span-5 h-[260px] sm:h-[320px] bg-[#d9dcdb] rounded-2xl w-full overflow-hidden relative shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80"
              alt="Производство"
              loading="lazy"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

        </div>
      </section>

      {/* 3. НАША ЦЕЛЬ SECTION */}
      <section className="bg-[#f0f2f1] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto">
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black text-center lowercase tracking-tight mb-4">
            наша цель
          </h2>
          
          <p className="text-center text-xs sm:text-sm text-neutral-700 max-w-2xl mx-auto mb-12 sm:mb-16 leading-relaxed">
            обеспечивать профессионалов и энтузиастов надежным, функциональным и эргономичным снаряжением, которое повышает безопасность и эффективность выполнения любых задач
          </p>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            {/* Card 1 */}
            <div className="bg-[#d9dcdb] rounded-2xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-md bg-[#2f4a35] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase text-black tracking-wide">
                  КАЧЕСТВО
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                В критических ситуациях нет места компромиссам. Каждый элемент нашего снаряжения проходит тщательный отбор материалов и контроль на всех этапах производства.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#d9dcdb] rounded-2xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-md bg-[#2f4a35] text-white flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase text-black tracking-wide">
                  ИННОВАЦИИ
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                Мы инвестируем в исследования, внедряем передовые технологии и разрабатываем новые решения, чтобы предложить вам самые актуальные и эффективные инструменты
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#d9dcdb] rounded-2xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-md bg-[#2f4a35] text-white flex items-center justify-center shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase text-black tracking-wide">
                  НАДЕЖНОСТЬ
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                Мы проектируем и тестируем снаряжение для экстремальных условий, чтобы вы могли полностью положиться на него в самых ответственных ситуациях
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#d9dcdb] rounded-2xl p-6 sm:p-8 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-md bg-[#2f4a35] text-white flex items-center justify-center shrink-0">
                  <Handshake className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase text-black tracking-wide">
                  ОТКРЫТОСТЬ
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                Для нас важны честность и доверие. Мы строим долгосрочные отношения с нашими клиентами и партнерами, основываясь на прозрачности всех процессов, открытом диалоге и взаимном уважении.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. НАШЕ ПРОИЗВОДСТВО SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black tracking-tight mb-6">
            Наше Производство
          </h2>

          <p className="text-xs sm:text-sm text-neutral-700 max-w-3xl mx-auto mb-12 sm:mb-16 leading-relaxed">
            Мы гордимся тем, что полностью контролируем весь цикл производства нашей продукции. На современном оборудовании, оснащенном передовыми технологиями, наши специалисты — инженеры, конструкторы и швеи — создают каждое изделие. Мы используем только проверенные, высококачественные материалы отечественных поставщиков, которые проходят многоступенчатый контроль. Это позволяет нам гарантировать высочайшее качество и долговечность каждой единицы нашей продукции.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#d9dcdb] rounded-2xl h-[280px] sm:h-[360px] overflow-hidden relative shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80"
                alt="Цех LOST CAMP"
                loading="lazy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-[#d9dcdb] rounded-2xl h-[280px] sm:h-[360px] overflow-hidden relative shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=1000&q=80"
                alt="Контроль качества"
                loading="lazy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 5. ГОТОВЫ ОБСУДИТЬ ВАШ ПРОЕКТ? SECTION */}
      <section className="bg-[#f0f2f1] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-neutral-200/50">
        <div className="max-w-4xl mx-auto">
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black text-center mb-10 tracking-tight">
            Готовы обсудить ваш проект?
          </h2>

          <h3 className="text-base sm:text-lg font-bold text-black text-center lowercase mb-8 tracking-wide">
            свяжитесь с нами
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Form Side */}
            <div className="md:col-span-7">
              {submitted ? (
                <div className="p-4 bg-[#2f4a35] text-white text-xs text-center rounded">
                  Спасибо! Сообщение успешно отправлено.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder="ваш телефон или адрес электронной почты"
                    className="w-full bg-[#d9dcdb] border border-transparent text-neutral-900 placeholder-neutral-600 text-xs px-4 py-3.5 focus:outline-none focus:border-neutral-500 transition-colors"
                    required
                  />

                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="сообщение"
                    className="w-full bg-[#d9dcdb] border border-transparent text-neutral-900 placeholder-neutral-600 text-xs px-4 py-3.5 focus:outline-none focus:border-neutral-500 transition-colors resize-none"
                    required
                  />

                  {errorMsg && (
                    <p className="text-xs text-red-600 font-medium">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto py-3 px-8 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-normal transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'отправка...' : 'отправить сообщение'}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Phone Side */}
            <div className="md:col-span-5 flex items-center justify-center md:justify-start space-x-3 text-black font-normal text-lg sm:text-xl">
              <Phone className="w-8 h-8 text-[#2f4a35] stroke-[1.5] shrink-0" />
              <span className="tracking-wider">+XXXXXXXXXXXX</span>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
