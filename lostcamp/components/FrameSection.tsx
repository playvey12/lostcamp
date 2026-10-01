import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, ShieldCheck, Cpu } from 'lucide-react';
import { Product } from '../types';
import { frameSoldierForest, frameCampfire } from '../assets/images';

import { CatalogProduct } from '../../server/data/products';
import { FrameSectionContent } from '../services/siteService';
import { DEFAULT_FRAME_SECTION_CONTENT } from '../context/ShopContext';

interface FrameSectionProps {
  onAddToCart: (product: Product) => void;
  videoUrl?: string;
  frameProductId?: number | null;
  products?: CatalogProduct[];
  content?: FrameSectionContent;
}

const DB_NAME = 'LostCampMedia';
const STORE_NAME = 'videos';
const KEY_NAME = '0714.mp4';

// Helper to load video blob from IndexedDB if previously saved
const loadVideoFromDB = async (): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY_NAME);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

export const FrameSection: React.FC<FrameSectionProps> = ({
  onAddToCart,
  videoUrl,
  frameProductId,
  products,
  content = DEFAULT_FRAME_SECTION_CONTENT,
}) => {
  const navigate = useNavigate();

  const fallbackProduct: Product = {
    id: 99,
    title: 'LOST CAMP FRAME',
    price: 18500,
    image: frameCampfire,
    description: 'Многофункциональная тактическая рама для транспортировки спецгрузов',
  };

  const selectedProduct = products?.find((p) => p.id === frameProductId);
  const frameProduct: Product = selectedProduct
    ? {
        id: selectedProduct.id,
        title: selectedProduct.title,
        price: selectedProduct.price,
        image: selectedProduct.image || frameCampfire,
        description: selectedProduct.description || fallbackProduct.description,
      }
    : (products && products.length > 0 ? products[0] : fallbackProduct);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const safePlay = async () => {
    if (!videoRef.current) return;
    try {
      videoRef.current.muted = true;
      const promise = videoRef.current.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        await promise;
      }
      if (videoRef.current) {
        setIsPlaying(true);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // Silently swallow play interruption errors or autoplay restrictions
      }
      setIsPlaying(false);
    } finally {
      playPromiseRef.current = null;
    }
  };

  const safePause = async () => {
    if (!videoRef.current) return;
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // Ignore play rejection when pausing
      }
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  // Load user video from prop or IndexedDB on mount if available
  useEffect(() => {
    if (videoUrl) {
      setVideoSrc(videoUrl);
    } else {
      loadVideoFromDB().then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setVideoSrc(url);
        }
      });
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoSrc]);

  // IntersectionObserver to auto-play when scrolled into view and loop
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadVideo(true);
            safePlay();
          } else {
            safePause();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [videoSrc]);

  const togglePlay = () => {
    if (isPlaying) {
      safePause();
    } else {
      safePlay();
    }
  };

  return (
    <section className="py-12 bg-[#fafafa]">
      {/* Section Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2e4733]/10 text-[#2e4733] text-xs font-mono uppercase tracking-widest rounded-full">
          <Cpu className="w-3.5 h-3.5" />
          <span>{content.badgeText}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wider text-black">
          {content.heading}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mx-auto">
          {content.description}
        </p>
      </div>

      {/* Main Video Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div
          ref={videoContainerRef}
          onClick={togglePlay}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full h-[340px] sm:h-[500px] md:h-[580px] overflow-hidden bg-black shadow-2xl border border-neutral-800 cursor-pointer group rounded-xs"
        >
          {/* Video element */}
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload="auto"
            poster={frameSoldierForest}
            className="w-full h-full object-cover object-center transition-opacity duration-500"
          >
            {videoSrc && <source src={videoSrc} type="video/mp4" />}
            {shouldLoadVideo && (
              <>
                <source src="/0714.mp4" type="video/mp4" />
                <source src="/lost-camp-frame.mp4" type="video/mp4" />
              </>
            )}
            Ваш браузер не поддерживает видео.
          </video>

          {/* Dark gradient vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Bottom Info & Play/Pause Control in bottom right */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between pointer-events-none">
            <div className="space-y-1">
              <span className="text-[10px] sm:text-xs text-neutral-300 font-mono tracking-widest uppercase block">
                {content.videoOverlayLabel}
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-white uppercase tracking-wide">
                {content.videoOverlayTitle}
              </h3>
            </div>

            {/* Play/Pause Button in bottom-right corner */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="pointer-events-auto p-3 bg-black/70 hover:bg-black text-white rounded-xs border border-white/20 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center shadow-lg hover:scale-105"
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Details Card Box */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-neutral-200 shadow-2xs grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Text & Features Content */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2e4733]" />
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-black">
                  {content.featuresHeading}
                </h3>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                {content.featuresSubheading}
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                {content.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-[#2e4733] font-bold">•</span>
                    <span>
                      {feat.title && <strong>{feat.title}: </strong>}
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-xs sm:text-sm font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                {content.ctaText}
              </p>
            </div>

            {/* Price and Add to Cart Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-neutral-500 uppercase block font-mono">Стоимость комплекта</span>
                <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-mono">
                  {frameProduct.price.toLocaleString('ru-RU')} RUB
                </span>
              </div>
              <button
                onClick={() => onAddToCart(frameProduct)}
                className="py-3 px-8 bg-[#2e4733] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-[#1f3022] transition-colors duration-200 cursor-pointer shadow-sm"
              >
                добавить в корзину
              </button>
            </div>
          </div>

          {/* Right Product Image */}
          <div
            onClick={() => navigate(`/product/${frameProduct.id}`)}
            className="lg:col-span-5 relative h-[320px] sm:h-[400px] lg:h-auto lg:min-h-[320px] bg-neutral-900 cursor-pointer group overflow-hidden"
          >
            <img
              src={frameProduct.image}
              alt={frameProduct.title}
              loading="lazy"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 text-white text-[11px] font-mono border border-white/10 uppercase">
              {frameProduct.title} • ДЕМОНСТРАЦИЯ
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};


