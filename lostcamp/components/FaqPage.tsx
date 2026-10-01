import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { faqNewsletterSoldier } from '../assets/images';
import { contactService } from '../services/contactService';
import { usePageTitle } from '../hooks/usePageTitle';

interface FaqItem {
  id: string;
  question: string;
  boldAnswer: string;
  answerBody: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

export const FaqPage: React.FC = () => {
  usePageTitle('Вопросы и ответы');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    's1-q1': false,
    's1-q2': false,
    's1-q3': false,
    's2-q1': false,
    's2-q2': false,
    's3-q1': false,
    's3-q2': false,
    's3-q3': false,
  });

  const [contactInput, setContactInput] = useState('');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactErrorMsg, setContactErrorMsg] = useState('');

  const [emailForNewsletter, setEmailForNewsletter] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim() || !message.trim()) return;

    setContactLoading(true);
    setContactErrorMsg('');
    try {
      await contactService.submitContact(contactInput, message);
      setFormSubmitted(true);
      setContactInput('');
      setMessage('');
      setTimeout(() => setFormSubmitted(false), 4000);
    } catch (err: any) {
      console.error('Failed to submit FAQ contact form:', err);
      setContactErrorMsg(err.message || 'Ошибка отправки');
    } finally {
      setContactLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForNewsletter || !emailForNewsletter.includes('@')) return;

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForNewsletter, source: 'faq' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterSubmitted(true);
        setEmailForNewsletter('');
        setTimeout(() => setNewsletterSubmitted(false), 5000);
      }
    } catch (err) {
      console.error('Failed to subscribe to newsletter:', err);
    }
  };

  const faqSections: FaqSection[] = [
    {
      title: 'Срок службы и совместимость',
      items: [
        {
          id: 's1-q1',
          question: 'Насколько долговечна наша продукция?',
          boldAnswer: 'Долговечность - один из наших ключевых приоритетов.',
          answerBody: 'Продукция разрабатывается с учетом экстремальных полевых условий, что подразумевает повышенную износостойкость, устойчивость к перепадам температур, влаге и механическим нагрузкам. Мы гордимся тем, что наши изделия служат долгие годы даже при интенсивном использовании.',
        },
        {
          id: 's1-q2',
          question: 'Как правильно ухаживать за изделиями, чтобы продлить их срок службы?',
          boldAnswer: 'Рекомендации по уходу зависят от конкретного материала.',
          answerBody: 'Как правило, мы советуем ручную стирку в прохладной воде с мягкими моющими средствами, избегать агрессивных химикатов и отбеливателей, а также сушить изделия вдали от прямых солнечных лучей или источников тепла.',
        },
        {
          id: 's1-q3',
          question: 'Совместима ли ваша продукция с другими брендами снаряжения?',
          boldAnswer: 'Мы стремимся к универсальности нашей продукции',
          answerBody: 'чтобы она могла эффективно интегрироваться с вашим существующим снаряжением. Многие элементы нашей экипировки имеют стандартные крепления или размеры, обеспечивающие совместимость. Если у вас есть конкретные вопросы по совместимости, пожалуйста, свяжитесь с нашей службой поддержки.',
        },
      ],
    },
    {
      title: 'Скидки и опт',
      items: [
        {
          id: 's2-q1',
          question: 'Можно ли получить скидку при оптовой покупке?',
          boldAnswer: 'Да, мы предлагаем гибкие условия сотрудничества для оптовых покупателей.',
          answerBody: 'Для обсуждения индивидуальных условий, цен и формирования заказа, пожалуйста, свяжитесь с нами по электронной почте или телефону, указанным в разделе "Контакты".',
        },
        {
          id: 's2-q2',
          question: 'Есть ли у вас программы лояльности или скидки для постоянных клиентов?',
          boldAnswer: 'Мы ценим наших постоянных клиентов',
          answerBody: 'и часто проводим специальные акции и предлагаем сезонные скидки. Информация о текущих предложениях публикуется на главной странице сайта и рассылается подписчикам нашей новостной рассылки. Рекомендуем подписаться, чтобы не пропустить выгодные предложения!',
        },
      ],
    },
    {
      title: 'Качество нашей продукции',
      items: [
        {
          id: 's3-q1',
          question: 'Какова политика вашей компании в отношении тестирования продукции?',
          boldAnswer: 'Мы проводим многоэтапное тестирование нашей продукции.',
          answerBody: 'Это включает лабораторные испытания материалов и готовых изделий, а также полевые испытания в реальных экстремальных условиях. Результаты этих тестов напрямую влияют на доработку и улучшение нашей экипировки.',
        },
        {
          id: 's3-q2',
          question: 'Насколько легкой является наша экипировка, учитывая ее прочность?',
          boldAnswer: 'Мы уделяем большое внимание балансу между прочностью и весом.',
          answerBody: 'Используя современные композитные материалы, легкие, но стойкие ткани и оптимизируя конструкцию, мы стремимся минимизировать вес экипировки, не жертвуя при этом ее надежностью и функциональностью в экстремальных условиях.',
        },
        {
          id: 's3-q3',
          question: 'В чем основные отличия вашей продукции от конкурентов?',
          boldAnswer: 'Мы предлагаем продукцию, на которую действительно можно положиться в критической ситуации.',
          answerBody: 'Наше главное отличие — бескомпромиссное сочетание исключительного исполнения, прочных материалов и ориентации на самые суровые полевые условия. Мы не идем на компромиссы в вопросах надежности и долговечности',
        },
      ],
    },
  ];

  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans pb-16">
      
      {/* Upper Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 space-y-10">
        
        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal text-black tracking-tight">
          ответы на часто задаваемые вопросы
        </h1>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: FAQ Accordions */}
          <div className="lg:col-span-8 space-y-8">
            {faqSections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-black tracking-tight pb-2">
                  {section.title}
                </h2>

                <div className="divide-y divide-neutral-200/70">
                  {section.items.map((item) => {
                    const isOpen = !!openItems[item.id];
                    return (
                      <div key={item.id} className="py-4 first:pt-1 last:pb-1">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full text-left flex items-center justify-between text-base sm:text-lg text-neutral-900 font-normal hover:text-[#2f4a35] transition-colors cursor-pointer py-1"
                        >
                          <span className="pr-4 leading-snug">{item.question}</span>
                          {isOpen ? (
                            <X className="w-4 h-4 text-neutral-400 shrink-0 hover:text-black transition-colors" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0 hover:text-black transition-colors" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="pt-3 pb-1 text-xs sm:text-sm leading-relaxed font-normal pr-6 space-y-1.5">
                            <p className="font-bold text-black">{item.boldAnswer}</p>
                            <p className="text-neutral-600">{item.answerBody}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 self-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
                нет ответа на ваш вопрос?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal">
                напишите нам
              </p>
            </div>

            {formSubmitted ? (
              <div className="p-4 bg-[#2f4a35] text-white text-xs rounded">
                Сообщение успешно отправлено!
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 pt-2">
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

                {contactErrorMsg && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {contactErrorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-3.5 px-6 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-normal transition-colors cursor-pointer disabled:opacity-50"
                >
                  {contactLoading ? 'отправка...' : 'отправить сообщение'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Newsletter Banner */}
      <section className="bg-[#404343] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          
          {/* Operator Image */}
          <div className="md:col-span-5 flex justify-center md:justify-start">
            <div className="w-full max-w-sm aspect-square bg-neutral-800 overflow-hidden relative shadow-md">
              <img
                src={faqNewsletterSoldier}
                alt="Тактический оператор"
                loading="lazy"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Text and Subscribe Button */}
          <div className="md:col-span-7 space-y-6 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              будьте в курсе событий
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 font-normal max-w-md leading-relaxed mx-auto md:mx-0">
              подпишитесь на нашу рассылку, чтоб первыми узнавать о скидках и специальных предложениях
            </p>

            {newsletterSubmitted ? (
              <div className="inline-block p-3 bg-[#2f4a35] text-white text-xs font-normal">
                Вы успешно подписаны на рассылку!
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                <input
                  type="email"
                  value={emailForNewsletter}
                  onChange={(e) => setEmailForNewsletter(e.target.value)}
                  placeholder="введите ваш email"
                  className="w-full sm:w-64 bg-neutral-700/80 text-white placeholder-neutral-400 text-xs px-4 py-3 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto py-3 px-8 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs sm:text-sm font-normal transition-colors cursor-pointer whitespace-nowrap"
                >
                  привязать почту
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};
