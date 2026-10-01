import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { frameSoldierForest, newsBannerSmoke } from '../assets/images';
import { usePageTitle } from '../hooks/usePageTitle';

export interface NewsArticleItem {
  id: number;
  title: string;
  subtitle?: string;
  date: string;
  tags?: string;
  content: string;
  mediaLayout?: '1_photo' | '2_photo' | '3_photo' | '1_video' | '1_photo_1_video' | '2_photo_1_video';
  image1?: string;
  image2?: string;
  image3?: string;
  videoUrl?: string;
  coverImage?: string;
  coverFocalPoint?: { x: number; y: number; zoom?: number };
  image?: string;
  titleLine1?: string;
  titleLine2?: string;
  fullTitle?: string;
  isPlaceholder?: boolean;
}

export const NewsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState<NewsArticleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNewsList(data);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching news from API:', err);
    }
    
    // Fallback default news items matching the mockups exactly
    setNewsList([
      {
        id: 1,
        title: 'выставка «Национальная безопасность Беларусь 2026»',
        subtitle: 'Выставка «Национальная безопасность 2026»',
        date: '00.00.2026',
        tags: 'новости | выставка | безопасность',
        content: `В Беларуси проходит выставка «Национальная безопасность Беларусь 2026». Это не просто выставка, это место, где встречаются профессионалы, ищущие лучшие решения для защиты, поэтому продукция Lost Camp представлена на международной выставке индустрии безопасности.\n\nТовары бренда Lost Camp – это не просто демонстрация продукции, а отражение стремления к высочайшим стандартам качества и надежности, которые необходимы в условиях повышенных требований к безопасности. Мы знаем, что в мире, где ставки высоки, доверие – это главное. Наша цель – дать вам уверенность в каждом элементе экипировки. Видеть ваш интерес и признание на такой площадке – лучшее подтверждение того, что мы на правильном пути.\n---SPLIT---\nВыбирая экипировку Lost Camp, вы выбираете:\n· Надежность: Проверенная в реальных условиях.\n· Инновации: Передовые технологии для вашей безопасности.\n· Экспертизу: Знания и опыт, воплощенные в каждом изделии.\n\nВаша безопасность – наш приоритет.`,
        mediaLayout: '3_photo',
        image1: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
        image2: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        image3: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80',
        videoUrl: '',
      },
      {
        id: 2,
        title: 'Как правильно ухаживать за плитником?',
        subtitle: 'инструкция/советы | видео/фото',
        date: '00.00.2026',
        tags: 'инструкция/советы | видео/фото',
        content: `Ваш плитник — это ваша надежная защита, поэтому важно заботиться о нем правильно. Хороший уход сохраняет его эффективность и продлевает срок службы. Вот основные моменты, которые нужно знать:\n\nЧего стоит избегать:\n·  Машинная стирка: Использование стиральной машины повредит материалы, особенно баллистические волокна. Их структура нежная, и механическое трение снизит защитные свойства.\n·  Высокие температуры: Сушка или хранение при жаре (свыше 50°С) сильно повреждают волокна, делая защиту менее надежной со временем.\n·  Влага и деформация: Храните плитник в сухом месте, избегайте сдавливания или хранения в сложенных положениях. Влага вызывает гниение и снижение прочности материалов.\n·  Игнорирование проверки: Регулярно осматривайте защитное снаряжение на наличие трещин, разрывов или износа.\n·  Химикаты и агрессивные средства: Не используйте ацетон, растворители, сильные моющие средства. Они разрушают волокна и снижают свойства материала.\n\nЛучшие способы ухода:\n·  Мягкая ручная стирка: Используйте теплую воду с мягким, небьющимся мылом (например, кастильским или деликатным средством). Тщательно очистите, избегая жестких губок или щеток, чтобы не повредить структуру.\n·  Высушивание на воздухе: После мытья расправьте и высушите в тени или в прохладном помещении. Не допускайте прямого солнечного света — ультрафиолет разрушает волокна.\n·  Правильное хранение: Храните плитник в горизонтальном положении, в сухом месте, в специальной сумке или мешке для защиты от пыли и загрязнений. Не складывайте и не крутите их — это снижает эффективность.\n\nДополнительные советы:\n·  Следите за состоянием: Проверяйте регулярно на наличие повреждений и износа.\n·  Избегайте экстремальных условий: Не оставляйте защиту под дождем, в сильной жаре или на морозе — эти условия сокращают срок службы материалов.\n\n[SUMMARY]\nСледуя этим простым рекомендациям, вы обеспечите вашей защите долгую службу и сохраните её эффективность.`,
        mediaLayout: '1_photo_1_video',
        image1: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const currentArticle = id ? newsList.find((item) => String(item.id) === String(id)) : null;
  const articleTitle = currentArticle ? (currentArticle.title || currentArticle.fullTitle || 'Новость') : null;
  usePageTitle(articleTitle || 'Новости');

  // Helper to render video element
  const renderVideo = (url: string) => {
    if (!url) return null;
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    let embedUrl = url;
    if (isYouTube) {
      const videoId = url.includes('youtu.be/') 
        ? url.split('youtu.be/')[1]?.split('?')[0] 
        : url.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    return (
      <div className="w-full aspect-[16/9] md:aspect-[21/9] sm:h-[380px] md:h-[420px] rounded-2xl overflow-hidden bg-[#d9dcdb] border border-neutral-200/80 shadow-2xs relative my-8">
        {isYouTube ? (
          <iframe
            src={embedUrl}
            title="Видео статьи"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={embedUrl}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  };

  // Helper to render image element
  const renderImg = (
    src: string,
    alt: string,
    extraClasses: string = 'aspect-[16/10]',
    focalPoint?: { x: number; y: number }
  ) => (
    <div className={`w-full ${extraClasses} rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-2xs`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover filter brightness-[0.98]"
        style={focalPoint ? { objectPosition: `${focalPoint.x}% ${focalPoint.y}%` } : undefined}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80';
        }}
      />
    </div>
  );

  // If an article ID is in URL, render 1:1 Detail View or redirect if not found
  if (id !== undefined) {
    if (loading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-neutral-500">
          <div className="w-8 h-8 border-4 border-[#374f3f]/30 border-t-[#374f3f] rounded-full animate-spin" />
        </div>
      );
    }

    if (!currentArticle) {
      return <Navigate to="/news" replace />;
    }

    const articleTitle = currentArticle.title || currentArticle.fullTitle || `${currentArticle.titleLine1 || ''} ${currentArticle.titleLine2 || ''}`;
    const img1 = currentArticle.image1 || currentArticle.image || frameSoldierForest;
    const img2 = currentArticle.image2 || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
    const img3 = currentArticle.image3 || 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80';
    // The cover photo (set separately in admin) is what's shown at the very top, next to the
    // title — it replaces image1 in that slot. If no dedicated cover was set (older articles),
    // fall back to image1 there, same as before. Once a cover exists, image1 is freed up and
    // shown further down among the regular article photos instead of being hidden.
    const headerImg = currentArticle.coverImage || img1;
    const extraBodyImage1 = currentArticle.coverImage && currentArticle.image1 ? currentArticle.image1 : null;
    const layout = currentArticle.mediaLayout || (currentArticle.image3 ? '3_photo' : '1_photo');
    const hasVideoLayout = layout.includes('video') || layout === '1_video';
    const video = currentArticle.videoUrl || (hasVideoLayout ? 'https://www.w3schools.com/html/mov_bbb.mp4' : '');
    const showImage2 = (layout === '2_photo_1_video' || layout === '2_photo') && (currentArticle.image2 || img2);

    // Layout 1: 3-Photos Layout (Exhibition Mockup 1)
    if (layout === '3_photo' || (currentArticle.image1 && currentArticle.image2 && currentArticle.image3)) {
      let part1 = currentArticle.content;
      let part2 = '';

      if (currentArticle.content.includes('---SPLIT---')) {
        const parts = currentArticle.content.split('---SPLIT---');
        part1 = parts[0].trim();
        part2 = parts[1].trim();
      } else if (currentArticle.content.includes('Выбирая экипировку')) {
        const idx = currentArticle.content.indexOf('Выбирая экипировку');
        part1 = currentArticle.content.substring(0, idx).trim();
        part2 = currentArticle.content.substring(idx).trim();
      }

      return (
        <div className="bg-white min-h-screen text-neutral-900 font-sans pb-20 pt-8 sm:pt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            {/* Header Grid: Cover Photo on Left, Title & Meta on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                {renderImg(headerImg, articleTitle, 'aspect-[16/10] h-[260px] sm:h-[320px]', currentArticle.coverImage ? currentArticle.coverFocalPoint : undefined)}
              </div>

              <div className="flex flex-col justify-center space-y-4 text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-neutral-900 leading-[1.25] tracking-tight">
                  {articleTitle}
                </h1>
                <div className="text-xs sm:text-sm text-neutral-400 font-light tracking-wide">
                  {currentArticle.date}
                </div>
              </div>
            </div>

            {/* Extra photo below header (image1), shown once a dedicated cover frees it up */}
            {extraBodyImage1 && (
              <div className="pt-2">
                {renderImg(extraBodyImage1, articleTitle, 'aspect-[16/10] sm:h-[380px] md:h-[420px]')}
              </div>
            )}

            {/* Section 1: Text Part 1 on Left, Portrait Image 2 on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start pt-4">
              <div className="text-sm sm:text-base text-neutral-800 leading-relaxed font-normal whitespace-pre-line space-y-4">
                {part1}
              </div>
              <div>
                {renderImg(img2, articleTitle, 'h-[440px] sm:h-[480px] md:h-[520px]')}
              </div>
            </div>

            {/* Section 2: Portrait Image 3 on Left, Text Part 2 on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start pt-4">
              <div>
                {renderImg(img3, articleTitle, 'h-[440px] sm:h-[480px] md:h-[520px]')}
              </div>
              <div className="text-sm sm:text-base text-neutral-800 leading-relaxed font-normal whitespace-pre-line space-y-4">
                {part2}
              </div>
            </div>

            {/* Back to News Button */}
            <div className="flex justify-center pt-8">
              <button
                onClick={() => navigate('/news')}
                className="py-3.5 px-8 bg-[#374f3f] hover:bg-[#2c4033] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer rounded-xs shadow-2xs"
              >
                К ОСТАЛЬНЫМ НОВОСТЯМ
              </button>
            </div>

          </div>
        </div>
      );
    }

    // Layout 2: 1 Photo + 1 Video (Care Guide Mockup 2)
    let mainBody = currentArticle.content;
    let summaryText = '';

    if (mainBody.includes('[SUMMARY]')) {
      const parts = mainBody.split('[SUMMARY]');
      mainBody = parts[0].trim();
      summaryText = parts[1].trim();
    } else if (mainBody.includes('Следуя этим простым рекомендациям')) {
      const idx = mainBody.indexOf('Следуя этим простым рекомендациям');
      summaryText = mainBody.substring(idx).trim();
      mainBody = mainBody.substring(0, idx).trim();
    }

    return (
      <div className="bg-white min-h-screen text-neutral-900 font-sans pb-20 pt-8 sm:pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header Grid: Cover Photo on Left, Title & Meta/Tags on Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              {renderImg(headerImg, articleTitle, 'aspect-[16/10] h-[260px] sm:h-[320px]', currentArticle.coverImage ? currentArticle.coverFocalPoint : undefined)}
            </div>

            <div className="flex flex-col justify-center space-y-4 text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-neutral-900 leading-[1.25] tracking-tight">
                {articleTitle}
              </h1>
              <div className="text-xs sm:text-sm text-neutral-400 font-light tracking-wide flex items-center gap-3">
                <span>{currentArticle.date}</span>
                {currentArticle.tags && (
                  <span>{currentArticle.tags}</span>
                )}
              </div>
            </div>
          </div>

          {/* Article Full Main Text */}
          <div className="text-sm sm:text-base text-neutral-800 leading-relaxed font-normal whitespace-pre-line space-y-4 pt-4">
            {mainBody}
          </div>

          {/* Extra photo below text (image1), shown once a dedicated cover frees it up */}
          {extraBodyImage1 && (
            <div className="my-6">
              {renderImg(extraBodyImage1, articleTitle, 'aspect-[16/10] sm:h-[380px] md:h-[420px]')}
            </div>
          )}

          {/* Second image for 2_photo_1_video and 2_photo layouts */}
          {showImage2 && (
            <div className="my-6">
              {renderImg(img2, articleTitle, 'aspect-[16/10] sm:h-[380px] md:h-[420px]')}
            </div>
          )}

          {/* Lower Rectangular Video Section */}
          {hasVideoLayout && video && renderVideo(video)}

          {/* Summary line below video */}
          {summaryText && (
            <div className="text-center font-normal text-base sm:text-lg lg:text-xl text-neutral-800 leading-relaxed max-w-3xl mx-auto pt-4 pb-2">
              {summaryText}
            </div>
          )}

          {/* Back to News Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={() => navigate('/news')}
              className="py-3.5 px-8 bg-[#374f3f] hover:bg-[#2c4033] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer rounded-xs shadow-2xs"
            >
              К ОСТАЛЬНЫМ НОВОСТЯМ
            </button>
          </div>

        </div>
      </div>
    );
  }

  // News List Grid View
  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans pb-16">
      
      {/* HERO BANNER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="relative w-full h-[200px] sm:h-[260px] md:h-[300px] bg-neutral-900 rounded-2xl overflow-hidden shadow-xs">
          <img
            src={newsBannerSmoke}
            alt="Наши новости"
            className="w-full h-full object-cover filter brightness-[0.80]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight text-center lowercase">
              наши новости
            </h1>
          </div>
        </div>
      </div>

      {/* NEWS GRID */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="text-center py-12 text-neutral-500">Загрузка новостей...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {newsList.map((item) => {
              const cardImage = item.coverImage || item.image1 || item.image || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
              const cardFocal = item.coverImage ? item.coverFocalPoint || { x: 50, y: 50 } : { x: 50, y: 50 };
              const displayTitle = item.title || item.fullTitle || `${item.titleLine1 || ''} ${item.titleLine2 || ''}`;

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/news/${item.id}`)}
                  className="bg-white border border-neutral-300 rounded-2xl overflow-hidden flex flex-col hover:border-neutral-400 hover:shadow-md transition-all cursor-pointer shadow-2xs group"
                >
                  {/* Top Image */}
                  <div className="w-full aspect-[16/9] bg-[#d9dcdb] overflow-hidden relative">
                    <img
                      src={cardImage}
                      alt={displayTitle}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      style={{ objectPosition: `${cardFocal.x}% ${cardFocal.y}%` }}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>

                  {/* Bottom Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Date */}
                    <div className="text-[11px] text-neutral-400 font-normal text-left tracking-wide">
                      {item.date}
                    </div>

                    {/* Title */}
                    <div className="font-semibold text-base sm:text-lg text-neutral-900 leading-snug tracking-tight line-clamp-2">
                      {displayTitle}
                    </div>

                    {/* Tags / Subtitle */}
                    <div className="text-left text-[11px] text-neutral-500 font-normal min-h-[16px]">
                      {item.subtitle || item.tags || ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
