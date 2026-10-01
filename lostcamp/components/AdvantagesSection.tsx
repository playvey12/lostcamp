import React from 'react';
import { main } from '../assets/images';

export const AdvantagesSection: React.FC = () => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Column - 2 Cards */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Card 1: надежность */}
          <div className="bg-white border border-neutral-100 shadow-2xs p-8 flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-black mb-3 lowercase tracking-wide">
              надежность
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-normal">
              Каждая деталь проходит строгий контроль качества, обеспечивая максимальную прочность и безотказность в самых ответственных ситуациях.
            </p>
          </div>

          {/* Card 2: скорость */}
          <div className="bg-white border border-neutral-100 shadow-2xs p-8 flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-black mb-3 lowercase tracking-wide">
              скорость
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-normal">
              Легкость и продуманная конструкция экипировки минимизируют сопротивление и не сковывают движений, позволяя действовать быстро и эффективно.
            </p>
          </div>
        </div>

        {/* Center Column - Tall Image with text overlay */}
        <div className="relative min-h-[420px] lg:min-h-[500px] overflow-hidden group">
          <img
            src={main}
            alt="Преимущества нашей экипировки"
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold uppercase leading-tight tracking-wide">
              преимущества<br />нашей<br />экипировки
            </h2>
          </div>
        </div>

        {/* Right Column - 2 Cards */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Card 3: уверенность */}
          <div className="bg-white border border-neutral-100 shadow-2xs p-8 flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-black mb-3 lowercase tracking-wide">
              уверенность
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-normal">
              Инновационные решения и проверенные технологии обеспечивают стабильность и контроль
            </p>
          </div>

          {/* Card 4: удобство */}
          <div className="bg-white border border-neutral-100 shadow-2xs p-8 flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-black mb-3 lowercase tracking-wide">
              удобство
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-normal">
              Мы уделяем особое внимание комфорту, используя дышащие материалы и оптимальную вентиляцию, чтобы вы чувствовали себя комфортно в течение длительного времени.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
