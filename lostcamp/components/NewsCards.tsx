import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { lostCampHero, frameSoldierForest, tacticalOperator } from '../assets/images';

interface NewsCardItem {
  id: number;
  title: string;
  subtitle?: string;
  image1?: string;
  image?: string;
  coverImage?: string;
  coverFocalPoint?: { x: number; y: number; zoom?: number };
}

export const NewsCards: React.FC = () => {
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState<NewsCardItem[]>([
    {
      id: 1,
      title: 'Уход за снаряжением',
      subtitle: 'Рекомендации по чистке и сохранению Cordura 1000D',
      image: frameSoldierForest,
    },
    {
      id: 2,
      title: 'Полевые испытания',
      subtitle: 'Тестирование подсумок серии «Спринт» в экстремальных условиях',
      image: tacticalOperator,
    },
    {
      id: 3,
      title: 'Новая линейка рюкзаков',
      subtitle: 'Модульные платформы с технологией быстрых креплений MOLLE',
      image: lostCampHero,
    },
  ]);

  useEffect(() => {
    fetch('/api/news', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNewsItems(data);
        }
      })
      .catch((err) => console.error('Failed to load news for home page:', err));
  }, []);

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <section className="py-[60px] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {newsItems.slice(0, 3).map((item) => {
          const focal = item.coverImage ? item.coverFocalPoint || { x: 50, y: 50 } : { x: 50, y: 50 };
          return (
          <div
            key={item.id}
            onClick={() => navigate(`/news/${item.id}`)}
            className="relative aspect-[16/9] overflow-hidden group cursor-pointer bg-neutral-900 rounded-xl"
          >
            {/* Background Image */}
            <img
              src={item.coverImage || item.image1 || item.image || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80'}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Content overlay */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <h3 className="text-xl font-bold text-white tracking-wide line-clamp-2">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-xs text-neutral-300 font-normal line-clamp-1">
                  {item.subtitle}
                </p>
              )}
              <div className="inline-flex items-center space-x-2 text-xs font-normal text-white hover:underline pt-2">
                <span>узнать больше</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
};
