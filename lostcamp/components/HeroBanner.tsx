import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroBannerConfig } from '../services/siteService';
import { useShop } from '../context/ShopContext';
import { ArrowRight } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1920&q=80',
];

interface HeroBannerProps {
  imageUrl?: string;
  config?: HeroBannerConfig;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ imageUrl, config: propConfig }) => {
  const shopContext = useShop();
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(0);

  const activeConfig: HeroBannerConfig = propConfig || shopContext?.heroBannerConfig || {
    badgeText: 'LOST CAMP • TACTICAL GEAR',
    title: 'Снаряжение для специальных задач',
    description: 'Модульные плитники, разгрузочные системы и подсумки из Cordura 1000D. Собственное производство, надежность в любых условиях.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1920&q=80',
    buttonText: 'Перейти в каталог',
    buttonLink: '/catalog',
    features: [
      '10+ лет опыта в сфере',
      'собственное производство',
      'индивидуальный подход',
      'строгий контроль качества',
    ],
  };

  const currentImage = imageUrl || activeConfig.imageUrl || DEFAULT_FALLBACK_IMAGES[imageIndex] || DEFAULT_FALLBACK_IMAGES[0];

  const handleImageError = () => {
    if (imageIndex < DEFAULT_FALLBACK_IMAGES.length - 1) {
      setImageIndex((prev) => prev + 1);
    }
  };

  const handleButtonClick = () => {
    if (!activeConfig.buttonLink) return;
    if (activeConfig.buttonLink.startsWith('http://') || activeConfig.buttonLink.startsWith('https://')) {
      window.open(activeConfig.buttonLink, '_blank');
    } else {
      if (shopContext?.handleNavigate) {
        shopContext.handleNavigate(activeConfig.buttonLink);
      } else {
        navigate(activeConfig.buttonLink);
      }
    }
  };

  return (
    <section className="w-full relative">
      {/* Hero Media Container */}
      <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[560px] bg-neutral-900 overflow-hidden flex items-center justify-center">
        <img
          src={currentImage}
          alt={activeConfig.title || 'LOST CAMP Снаряжение'}
          className="w-full h-full object-cover object-center transition-opacity duration-500"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />

        {/* Dark subtle overlay gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 sm:pb-16 text-white pointer-events-none">
          <div className="max-w-2xl space-y-3 sm:space-y-4 pointer-events-auto">
            {activeConfig.badgeText && (
              <span className="inline-block px-3 py-1 bg-[#2e4733] text-white text-[10px] sm:text-xs font-semibold uppercase tracking-widest rounded-xs shadow-xs">
                {activeConfig.badgeText}
              </span>
            )}
            {activeConfig.title && (
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                {activeConfig.title}
              </h1>
            )}
            {activeConfig.description && (
              <p className="text-xs sm:text-base text-neutral-300 font-light max-w-lg leading-relaxed">
                {activeConfig.description}
              </p>
            )}

            {activeConfig.buttonText && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#2e4733] hover:bg-[#233727] active:bg-[#1a291d] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer shadow-lg hover:shadow-emerald-950/40"
                >
                  <span>{activeConfig.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

