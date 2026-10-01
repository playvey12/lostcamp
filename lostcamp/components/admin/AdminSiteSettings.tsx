import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Image as ImageIcon,
  Upload,
  Globe,
  RefreshCw,
  History,
  Package,
  FileText,
  Plus,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { VideoHistoryItem } from '../../types';
import { CatalogProduct } from '../../../server/data/products';
import { FrameSectionContent } from '../../services/siteService';
import { DEFAULT_FRAME_SECTION_CONTENT } from '../../context/ShopContext';

interface AdminSiteSettingsProps {
  heroVideoUrl?: string;
  onUpdateHeroVideo?: (url: string) => void;
  videoHistory?: VideoHistoryItem[];
  onUpdateVideoHistory?: (history: VideoHistoryItem[]) => void;
  products?: CatalogProduct[];
  frameProductId?: number | null;
  onUpdateFrameProductId?: (id: number | null) => Promise<void>;
  popularProductIds?: number[];
  onUpdatePopularProductIds?: (ids: number[]) => Promise<void>;
  promoProductIds?: number[];
  onUpdatePromoProductIds?: (ids: number[]) => Promise<void>;
  frameSectionContent?: FrameSectionContent;
  onUpdateFrameSectionContent?: (content: FrameSectionContent) => Promise<void>;
  showToast: (msg: string) => void;
}

export const AdminSiteSettings: React.FC<AdminSiteSettingsProps> = ({
  heroVideoUrl = '',
  onUpdateHeroVideo,
  videoHistory = [],
  onUpdateVideoHistory,
  products = [],
  frameProductId,
  onUpdateFrameProductId,
  popularProductIds = [],
  onUpdatePopularProductIds,
  promoProductIds = [],
  onUpdatePromoProductIds,
  frameSectionContent,
  onUpdateFrameSectionContent,
  showToast,
}) => {
  const [videoInputUrl, setVideoInputUrl] = useState(heroVideoUrl);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // FrameSection text content draft state
  const [frameDraft, setFrameDraft] = useState<FrameSectionContent>(
    frameSectionContent || DEFAULT_FRAME_SECTION_CONTENT
  );
  const [isSavingFrameText, setIsSavingFrameText] = useState(false);
  const [popularSearch, setPopularSearch] = useState('');
  const [isSavingPopular, setIsSavingPopular] = useState(false);
  const [promoSearch, setPromoSearch] = useState('');
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  useEffect(() => {
    if (frameSectionContent) {
      setFrameDraft(frameSectionContent);
    }
  }, [frameSectionContent]);

  const handleSaveFrameText = async () => {
    if (!onUpdateFrameSectionContent) return;
    setIsSavingFrameText(true);
    try {
      await onUpdateFrameSectionContent(frameDraft);
      showToast('Текстовое содержимое блока FrameSection успешно сохранено!');
    } catch (err) {
      console.error('Failed to save frame section content:', err);
      showToast('Ошибка при сохранении текстов блока');
    } finally {
      setIsSavingFrameText(false);
    }
  };

  const handleResetFrameText = () => {
    setFrameDraft(DEFAULT_FRAME_SECTION_CONTENT);
    showToast('Тексты сброшены на значения по умолчанию. Нажмите "Сохранить", чтобы применить.');
  };

  const handleFeatureChange = (index: number, field: 'title' | 'text', value: string) => {
    const nextFeatures = [...frameDraft.features];
    nextFeatures[index] = { ...nextFeatures[index], [field]: value };
    setFrameDraft({ ...frameDraft, features: nextFeatures });
  };

  const handleAddFeature = () => {
    setFrameDraft({
      ...frameDraft,
      features: [...frameDraft.features, { title: '', text: '' }],
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFrameDraft({
      ...frameDraft,
      features: frameDraft.features.filter((_, i) => i !== index),
    });
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name || 'Загруженное видео';
    const formData = new FormData();
    formData.append('video', file);

    setIsUploadingVideo(true);
    try {
      showToast('Загрузка видеофайла на сервер...');
      const response = await fetch('/api/site/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();

      if (data.url) {
        const videoUrl = data.url;
        setVideoInputUrl(videoUrl);
        if (onUpdateHeroVideo) {
          onUpdateHeroVideo(videoUrl);
        }

        const newItem: VideoHistoryItem = {
          id: Date.now().toString(),
          url: videoUrl,
          name: fileName,
          date: new Date().toLocaleDateString('ru-RU'),
        };

        if (onUpdateVideoHistory) {
          const nextHistory = [
            newItem,
            ...videoHistory.filter((item) => item.url !== videoUrl),
          ];
          onUpdateVideoHistory(nextHistory);
        }

        showToast(
          'Новое видео успешно загружено, сохранено на сервере и установлено на сайт!'
        );
      } else {
        showToast(data.error || 'Ошибка при загрузке видео');
      }
    } catch (err) {
      console.error('Video upload error:', err);
      showToast('Ошибка сети при загрузке видео');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleApplyVideoUrl = (urlToApply: string, customTitle?: string) => {
    setVideoInputUrl(urlToApply);
    if (onUpdateHeroVideo) {
      onUpdateHeroVideo(urlToApply);
    }

    if (urlToApply) {
      const name =
        customTitle ||
        (urlToApply.length > 35
          ? urlToApply.substring(0, 35) + '...'
          : urlToApply);
      const newItem: VideoHistoryItem = {
        id: Date.now().toString(),
        url: urlToApply,
        name: name,
        date: new Date().toLocaleDateString('ru-RU'),
      };

      if (onUpdateVideoHistory) {
        const nextHistory = [
          newItem,
          ...videoHistory.filter((item) => item.url !== urlToApply),
        ];
        onUpdateVideoHistory(nextHistory);
      }
    }

    showToast(
      urlToApply
        ? 'Видео на главной и в FrameSection обновлено!'
        : 'Видео сброшено на фото'
    );
  };

  const handleSelectFromHistory = (item: VideoHistoryItem) => {
    setVideoInputUrl(item.url);
    if (onUpdateHeroVideo) {
      onUpdateHeroVideo(item.url);
    }
    showToast(`Выбрано видео из истории: "${item.name}"`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-400" />
            <span>Редактирование внешнего вида сайта</span>
          </h3>
          <p className="text-xs text-neutral-400 font-mono">
            Управляйте заставкой, видео-баннером и медиа-контентом на главной странице
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-950 border border-emerald-600/50 text-emerald-400 text-xs font-mono rounded-full font-bold">
          ● Прямой эфир (Live)
        </span>
      </div>

      {/* Video Edit Card */}
      <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Видео-презентация в блоке LOST CAMP FRAME (FrameSection)</span>
            </h4>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Загрузите фоновое видео с компьютера или укажите прямую ссылку MP4/WEBM. Видео будет отображаться в блоке FrameSection на главной странице.
            </p>
          </div>

          {videoInputUrl ? (
            <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-xs font-mono font-bold rounded-lg shrink-0">
              Видео активно
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-neutral-400 text-xs font-mono rounded-lg shrink-0">
              Фото-баннер
            </span>
          )}
        </div>

        {/* Video Preview Box */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-neutral-300 block font-bold">
            Предпросмотр активного баннера:
          </label>
          <div className="relative w-full h-64 sm:h-80 bg-neutral-950 rounded-xl border border-neutral-700 overflow-hidden flex items-center justify-center">
            {videoInputUrl ? (
              <video
                src={videoInputUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto" />
                <p className="text-xs font-mono text-neutral-400">
                  Сейчас на главной странице используется стандартный сменяющийся фото-баннер LOST CAMP.
                </p>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-md border border-white/10 text-[11px] font-mono text-white">
              {videoInputUrl ? 'Видео-баннер включен' : 'Фото-баннер'}
            </div>
          </div>
        </div>

        {/* Upload controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Option A: Upload File */}
          <div className="bg-neutral-950/70 p-5 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold font-mono text-xs">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Способ 1: Загрузить видео с ПК</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
              Выберите видеофайл MP4, WEBM или MOV (до 100 МБ). Загрузка может занять некоторое время в зависимости от размера файла и скорости интернета.
            </p>
            <label
              className={`flex items-center justify-center gap-2 w-full py-3 px-4 font-mono text-xs font-bold rounded-xl text-center border shadow-lg transition-colors ${
                isUploadingVideo
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-400 cursor-not-allowed'
                  : 'bg-[#2e4733] hover:bg-[#233827] text-white border-emerald-600/40 cursor-pointer'
              }`}
            >
              {isUploadingVideo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Загрузка видео на сервер, подождите...</span>
                </>
              ) : (
                <span>Загрузить новое видео</span>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoFileUpload}
                disabled={isUploadingVideo}
                className="hidden"
              />
            </label>
          </div>

          {/* Option B: Enter URL */}
          <div className="bg-neutral-950/70 p-5 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold font-mono text-xs">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Способ 2: Вставить URL видео</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
              Укажите прямую ссылку на видео файл:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoInputUrl}
                onChange={(e) => setVideoInputUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleApplyVideoUrl(videoInputUrl)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors shrink-0"
              >
                Применить
              </button>
            </div>
          </div>
        </div>

        {/* Reset button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleApplyVideoUrl('')}
            className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 rounded-lg text-xs font-mono cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Сбросить на фото</span>
          </button>
        </div>
      </div>

      {/* Product Selection Card for FrameSection */}
      <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Товар в блоке LOST CAMP FRAME (FrameSection)</span>
            </h4>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Выберите товар из каталога, который будет отображаться в презентационном блоке FrameSection рядом с видео.
            </p>
          </div>
          {frameProductId ? (
            <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-xs font-mono font-bold rounded-lg shrink-0">
              ID товара: {frameProductId}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-neutral-400 text-xs font-mono rounded-lg shrink-0">
              По умолчанию
            </span>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-mono text-neutral-300 block font-bold">
            Выберите товар для отображения:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={frameProductId ?? ''}
              onChange={async (e) => {
                const val = e.target.value;
                const newId = val ? Number(val) : null;
                if (onUpdateFrameProductId) {
                  await onUpdateFrameProductId(newId);
                  showToast(
                    newId
                      ? 'Товар для блока FrameSection успешно обновлен!'
                      : 'Товар сброшен на стандартный'
                  );
                }
              }}
              className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">-- Стандартный (LOST CAMP FRAME / по умолчанию) --</option>
              {products?.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  [{prod.id}] {prod.title} — {prod.price.toLocaleString('ru-RU')} ₽
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Popular Products Selection Card (homepage "Популярное" block) */}
      <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Популярные товары на главной странице</span>
            </h4>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Выберите товары из каталога, которые будут показаны в блоке "Популярное" на главной.
              Если ничего не выбрано — показываются стандартные товары по умолчанию.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-neutral-400 text-xs font-mono rounded-lg shrink-0 whitespace-nowrap">
            Выбрано: {popularProductIds.length}
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <input
            type="text"
            value={popularSearch}
            onChange={(e) => setPopularSearch(e.target.value)}
            placeholder="Поиск товара по названию..."
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
          />

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {(products || [])
              .filter((prod) =>
                popularSearch.trim()
                  ? prod.title.toLowerCase().includes(popularSearch.trim().toLowerCase())
                  : true
              )
              .map((prod) => {
                const isChecked = popularProductIds.includes(prod.id);
                return (
                  <label
                    key={prod.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-700/60'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isSavingPopular}
                      onChange={async () => {
                        const next = isChecked
                          ? popularProductIds.filter((id) => id !== prod.id)
                          : [...popularProductIds, prod.id];
                        if (onUpdatePopularProductIds) {
                          setIsSavingPopular(true);
                          try {
                            await onUpdatePopularProductIds(next);
                            showToast(
                              isChecked
                                ? `«${prod.title}» убран из популярных`
                                : `«${prod.title}» добавлен в популярные`
                            );
                          } finally {
                            setIsSavingPopular(false);
                          }
                        }
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-9 h-9 rounded-md object-cover border border-neutral-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono text-white truncate">{prod.title}</div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        [{prod.id}] {prod.price.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  </label>
                );
              })}
            {(products || []).length === 0 && (
              <p className="text-xs text-neutral-500 font-mono py-2">Нет товаров в каталоге.</p>
            )}
          </div>
        </div>
      </div>

      {/* Promo/Sale Products Selection Card (homepage "Акции" block) */}
      <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Акции на главной странице</span>
            </h4>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Выберите товары из каталога, которые будут показаны в блоке "Воспользуйтесь лучшими
              предложениями" на главной. Если ничего не выбрано — показываются стандартные товары по умолчанию.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-neutral-400 text-xs font-mono rounded-lg shrink-0 whitespace-nowrap">
            Выбрано: {promoProductIds.length}
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <input
            type="text"
            value={promoSearch}
            onChange={(e) => setPromoSearch(e.target.value)}
            placeholder="Поиск товара по названию..."
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
          />

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {(products || [])
              .filter((prod) =>
                promoSearch.trim()
                  ? prod.title.toLowerCase().includes(promoSearch.trim().toLowerCase())
                  : true
              )
              .map((prod) => {
                const isChecked = promoProductIds.includes(prod.id);
                return (
                  <label
                    key={prod.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-700/60'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isSavingPromo}
                      onChange={async () => {
                        const next = isChecked
                          ? promoProductIds.filter((id) => id !== prod.id)
                          : [...promoProductIds, prod.id];
                        if (onUpdatePromoProductIds) {
                          setIsSavingPromo(true);
                          try {
                            await onUpdatePromoProductIds(next);
                            showToast(
                              isChecked
                                ? `«${prod.title}» убран из акций`
                                : `«${prod.title}» добавлен в акции`
                            );
                          } finally {
                            setIsSavingPromo(false);
                          }
                        }
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-9 h-9 rounded-md object-cover border border-neutral-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono text-white truncate">{prod.title}</div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        [{prod.id}] {prod.price.toLocaleString('ru-RU')} ₽
                        {prod.oldPrice ? ` (старая: ${prod.oldPrice.toLocaleString('ru-RU')} ₽)` : ''}
                      </div>
                    </div>
                  </label>
                );
              })}
            {(products || []).length === 0 && (
              <p className="text-xs text-neutral-500 font-mono py-2">Нет товаров в каталоге.</p>
            )}
          </div>
        </div>
      </div>

      {/* History of Uploaded / Used Videos List */}
      <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-700/80 pb-3 gap-2">
          <div>
            <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>История сохраненных видеозаписей</span>
            </h4>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Все ранее добавленные видео. Выберите любое видео из списка ниже для установки на сайт и в блок FrameSection:
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-300 bg-neutral-900 px-3 py-1 rounded-md border border-neutral-700 shrink-0 self-start sm:self-auto font-bold">
            Записей: {videoHistory.length}
          </span>
        </div>

        {/* History Items Grid */}
        {videoHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {videoHistory.map((item) => {
              const isActive = heroVideoUrl === item.url;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isActive
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/50'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-20 h-16 bg-black rounded-lg overflow-hidden border border-neutral-700 shrink-0 flex items-center justify-center">
                      <video
                        src={item.url}
                        muted
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-4 h-4 text-white opacity-80" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 font-mono">
                      <span className="text-xs font-bold text-white truncate block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        Добавлено: {item.date}
                      </span>

                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-[10px] font-bold rounded-md">
                          ● Активно на сайте (FrameSection)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-400 text-[10px] rounded-md">
                          В архиве истории
                        </span>
                      )}
                    </div>
                  </div>

                  {!isActive && (
                    <div className="pt-2 border-t border-neutral-800/80 flex justify-end font-mono">
                      <button
                        type="button"
                        onClick={() => handleSelectFromHistory(item)}
                        className="px-3 py-1.5 bg-[#2e4733] hover:bg-[#233827] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        <span>Установить на сайт</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-500 font-mono text-xs">
            История видеозаписей пуста. Загрузите или укажите первое видео.
          </div>
        )}
      </div>

      {/* Text Content Editor Card for FrameSection */}
      <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Тексты и характеристики блока LOST CAMP FRAME</span>
            </h4>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Настройте заголовки, описания, маркированный список преимуществ и призыв к действию для промо-блока на главной странице.
            </p>
          </div>
        </div>

        <div className="space-y-5 font-mono text-xs">
          {/* Badge & Main Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">
                Бейдж над заголовком:
              </label>
              <input
                type="text"
                value={frameDraft.badgeText}
                onChange={(e) => setFrameDraft({ ...frameDraft, badgeText: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="Экзоскелетная рама второго поколения"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">
                Главный заголовок блока:
              </label>
              <input
                type="text"
                value={frameDraft.heading}
                onChange={(e) => setFrameDraft({ ...frameDraft, heading: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="LOST CAMP FRAME"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-bold block">
              Описание под главным заголовком:
            </label>
            <textarea
              rows={2}
              value={frameDraft.description}
              onChange={(e) => setFrameDraft({ ...frameDraft, description: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
              placeholder="Инновационная анатомическая рама из полимерного композита..."
            />
          </div>

          {/* Video Overlays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-700/50">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">
                Метка поверх видео (верхняя строчка):
              </label>
              <input
                type="text"
                value={frameDraft.videoOverlayLabel}
                onChange={(e) => setFrameDraft({ ...frameDraft, videoOverlayLabel: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="LOST CAMP FRAME • В ПОЛЕВЫХ УСЛОВИЯХ"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">
                Заголовок поверх видео (крупный текст):
              </label>
              <input
                type="text"
                value={frameDraft.videoOverlayTitle}
                onChange={(e) => setFrameDraft({ ...frameDraft, videoOverlayTitle: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="Тактическая разгрузочная платформа"
              />
            </div>
          </div>

          {/* Features Headings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-700/50">
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">
                Заголовок карточки характеристик:
              </label>
              <input
                type="text"
                value={frameDraft.featuresHeading}
                onChange={(e) => setFrameDraft({ ...frameDraft, featuresHeading: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="Характеристики LOST CAMP FRAME"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-bold block">
                Подзаголовок списка характеристик:
              </label>
              <input
                type="text"
                value={frameDraft.featuresSubheading}
                onChange={(e) => setFrameDraft({ ...frameDraft, featuresSubheading: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                placeholder="Ключевые преимущества конструкции:"
              />
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3 pt-2 border-t border-neutral-700/50">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-bold block">
                Список преимуществ / характеристик ({frameDraft.features.length}):
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить пункт</span>
              </button>
            </div>

            <div className="space-y-3">
              {frameDraft.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-emerald-400 font-bold text-[11px]">
                      Пункт #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                      title="Удалить пункт"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                      className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Заголовок (например: Высокая функциональность)"
                    />
                    <textarea
                      rows={2}
                      value={feat.text}
                      onChange={(e) => handleFeatureChange(idx, 'text', e.target.value)}
                      className="sm:col-span-2 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Текст описания пункта..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Text */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-700/50">
            <label className="text-neutral-300 font-bold block">
              Текст призыва к действию (перед кнопкой добавления в корзину):
            </label>
            <textarea
              rows={2}
              value={frameDraft.ctaText}
              onChange={(e) => setFrameDraft({ ...frameDraft, ctaText: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
              placeholder="Повысьте эффективность и выносливость при выполнении боевых задач с LOST CAMP FRAME!"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-700/80 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetFrameText}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить на стандартные</span>
            </button>

            <button
              type="button"
              onClick={handleSaveFrameText}
              disabled={isSavingFrameText}
              className="px-6 py-2.5 bg-[#2e4733] hover:bg-[#233827] text-white border border-emerald-600/40 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg flex items-center gap-2"
            >
              {isSavingFrameText ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Сохранить тексты блока</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};