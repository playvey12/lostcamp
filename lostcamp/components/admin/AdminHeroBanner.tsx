import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Check,
  BookmarkPlus,
  Layers,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { HeroBannerConfig, HeroBannerTemplate, siteService } from '../../services/siteService';
import { DEFAULT_HERO_BANNER_CONFIG } from '../../context/ShopContext';
import { HeroBanner } from '../HeroBanner';

interface AdminHeroBannerProps {
  heroBannerConfig: HeroBannerConfig;
  heroBannerTemplates: HeroBannerTemplate[];
  onUpdateHeroBannerConfig: (config: HeroBannerConfig) => Promise<void>;
  onUpdateHeroBannerTemplates: (templates: HeroBannerTemplate[]) => Promise<void>;
  showToast: (msg: string) => void;
}

const STOCK_HERO_PHOTOS = [
  { label: 'Татический экип 1', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1920&q=80' },
  { label: 'Экипировка в поле 2', url: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1920&q=80' },
  { label: 'Горы и снаряжение 3', url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1920&q=80' },
  { label: 'Лес и камуфляж 4', url: 'https://images.unsplash.com/photo-1542332213-315a42dde89b?auto=format&fit=crop&w=1920&q=80' },
];

export const AdminHeroBanner: React.FC<AdminHeroBannerProps> = ({
  heroBannerConfig,
  heroBannerTemplates = [],
  onUpdateHeroBannerConfig,
  onUpdateHeroBannerTemplates,
  showToast,
}) => {
  const [formConfig, setFormConfig] = useState<HeroBannerConfig>(
    heroBannerConfig || DEFAULT_HERO_BANNER_CONFIG
  );
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Template Save & Delete Modal States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (heroBannerConfig) {
      setFormConfig(heroBannerConfig);
    }
  }, [heroBannerConfig]);

  const handleInputChange = (field: keyof HeroBannerConfig, value: any) => {
    setFormConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await siteService.uploadImage(file);
      setFormConfig((prev) => ({ ...prev, imageUrl: url }));
      showToast('Изображение успешно загружено на сервер');
    } catch (err: any) {
      showToast(err.message || 'Ошибка загрузки изображения');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      await onUpdateHeroBannerConfig(formConfig);
      showToast('Главный баннер успешно обновлен и сохранен!');
    } catch (err: any) {
      showToast('Ошибка при сохранении баннера: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('Сбросить настройки главного баннера к значениям по умолчанию?')) {
      setFormConfig(DEFAULT_HERO_BANNER_CONFIG);
      try {
        await onUpdateHeroBannerConfig(DEFAULT_HERO_BANNER_CONFIG);
        showToast('Баннер сброшен к настройкам по умолчанию');
      } catch (err: any) {
        showToast('Ошибка при сбросе: ' + err.message);
      }
    }
  };

  // Templates Management
  const handleSaveAsTemplate = async () => {
    if (!templateNameInput.trim()) {
      showToast('Введите название шаблона');
      return;
    }

    const newTemplate: HeroBannerTemplate = {
      id: Date.now().toString(),
      name: templateNameInput.trim(),
      createdAt: new Date().toISOString(),
      config: { ...formConfig },
    };

    const updatedTemplates = [newTemplate, ...heroBannerTemplates];

    try {
      await onUpdateHeroBannerTemplates(updatedTemplates);
      showToast(`Шаблон "${newTemplate.name}" сохранен в историю!`);
      setIsTemplateModalOpen(false);
      setTemplateNameInput('');
    } catch (err: any) {
      showToast('Ошибка при сохранении шаблона: ' + err.message);
    }
  };

  const handleApplyTemplate = async (template: HeroBannerTemplate) => {
    setFormConfig(template.config);
    try {
      await onUpdateHeroBannerConfig(template.config);
      showToast(`Шаблон "${template.name}" применен и установлен как текущий баннер!`);
    } catch (err: any) {
      showToast('Ошибка применения шаблона: ' + err.message);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    const { id, name } = templateToDelete;
    const filtered = heroBannerTemplates.filter((t) => t.id !== id);
    try {
      await onUpdateHeroBannerTemplates(filtered);
      showToast(`Шаблон "${name}" удален из истории`);
    } catch (err: any) {
      showToast('Ошибка удаления шаблона: ' + err.message);
    } finally {
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header Card */}
      <div className="bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-white tracking-wide uppercase">
                8. Главный баннер (HeroBanner)
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Полное управление главным баннером на домашней странице и сохранение истории шаблонов
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-800 text-white text-xs font-mono font-bold rounded-xl border border-neutral-600 transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 text-emerald-400" />
            <span>Сохранить как шаблон</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="flex items-center space-x-2 px-4 py-2.5 bg-neutral-700/60 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono rounded-xl border border-neutral-600/80 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сброс</span>
          </button>

          <button
            onClick={handleSaveBanner}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#2e4733] hover:bg-[#233727] active:bg-[#1a291d] text-white text-xs font-mono font-bold rounded-xl border border-emerald-500/50 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Сохранение...' : 'Сохранить баннер'}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Предпросмотр баннера в реальном времени</span>
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            Вид на главной странице сайта
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-700/80 overflow-hidden shadow-2xl bg-neutral-950">
          <HeroBanner config={formConfig} />
        </div>
      </div>

      {/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Text & Content (7 Cols) */}
        <div className="lg:col-span-7 bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/80 space-y-6 shadow-xl">
          <h3 className="text-base font-bold font-mono text-white uppercase border-b border-neutral-700 pb-3 flex items-center space-x-2">
            <span>Тексты и Наполнение баннера</span>
          </h3>

          {/* Badge Text */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Маленький бейдж / метка (Badge)
            </label>
            <input
              type="text"
              value={formConfig.badgeText || ''}
              onChange={(e) => handleInputChange('badgeText', e.target.value)}
              placeholder="LOST CAMP • TACTICAL GEAR"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Заголовок баннера (Title)
            </label>
            <input
              type="text"
              value={formConfig.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Снаряжение для специальных задач"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-base font-bold text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Описание (Description)
            </label>
            <textarea
              rows={3}
              value={formConfig.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Модульные плитники, разгрузочные системы..."
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Action Button Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Текст кнопки действия
              </label>
              <input
                type="text"
                value={formConfig.buttonText || ''}
                onChange={(e) => handleInputChange('buttonText', e.target.value)}
                placeholder="Перейти в каталог"
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Ссылка кнопки (URL / Путь)
              </label>
              <input
                type="text"
                value={formConfig.buttonLink || ''}
                onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                placeholder="/catalog"
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Photo / Image Upload & Presets (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/80 space-y-6 shadow-xl">
            <h3 className="text-base font-bold font-mono text-white uppercase border-b border-neutral-700 pb-3 flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Главное фото баннера</span>
            </h3>

            {/* Current Image Preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950 group">
              <img
                src={formConfig.imageUrl}
                alt="Предпросмотр фото"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs font-mono text-white bg-black/70 px-3 py-1.5 rounded-lg border border-neutral-600">
                  Текущее фото
                </span>
              </div>
            </div>

            {/* File Upload Option */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Загрузить фото с компьютера (Файл)
              </label>
              <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-700/60 border border-dashed border-neutral-600 hover:border-emerald-500 rounded-xl cursor-pointer transition-colors text-xs font-mono text-neutral-300 hover:text-white">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>
                  {uploadingImage ? 'Загрузка на сервер...' : 'Выбрать файл изображения'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct Image URL input */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Или вставьте URL картинки
              </label>
              <input
                type="text"
                value={formConfig.imageUrl || ''}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Stock Presets Gallery */}
            <div className="space-y-2 pt-2 border-t border-neutral-700">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Быстрый выбор из готовых авто-фото:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {STOCK_HERO_PHOTOS.map((stock, i) => {
                  const isSelected = formConfig.imageUrl === stock.url;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleInputChange('imageUrl', stock.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border transition-all text-left group cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                          : 'border-neutral-700 hover:border-neutral-500 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={stock.url}
                        alt={stock.label}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1 text-[10px] font-mono text-neutral-200 truncate">
                        {stock.label}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History & Saved Templates Section (История шаблонов) */}
      <div className="bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/80 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-700 pb-4">
          <div>
            <h3 className="text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>История и сохраненные шаблоны баннеров ({heroBannerTemplates.length})</span>
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Каждый шаблон полностью сохраняет фото и весь настроенный текст блока
            </p>
          </div>

          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#2e4733] hover:bg-[#233727] text-white text-xs font-mono font-bold rounded-xl border border-emerald-500/40 transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Сохранить текущий вид как шаблон</span>
          </button>
        </div>

        {heroBannerTemplates.length === 0 ? (
          <div className="text-center py-10 bg-neutral-900/60 rounded-xl border border-dashed border-neutral-700/80 space-y-2">
            <BookmarkPlus className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm font-mono text-neutral-400">
              История шаблонов пока пуста
            </p>
            <p className="text-xs font-sans text-neutral-500 max-w-md mx-auto">
              Настройте баннер и нажмите "Сохранить текущий вид как шаблон", чтобы быстро переключаться между сезонами и акциями.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroBannerTemplates.map((template) => {
              const dateStr = new Date(template.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isActive =
                formConfig.title === template.config.title &&
                formConfig.imageUrl === template.config.imageUrl &&
                formConfig.description === template.config.description;

              return (
                <div
                  key={template.id}
                  className={`bg-neutral-900 rounded-xl border overflow-hidden transition-all flex flex-col justify-between shadow-lg ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-neutral-700/80 hover:border-neutral-500'
                  }`}
                >
                  {/* Template Image Header */}
                  <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                    <img
                      src={template.config.imageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {isActive && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-emerald-500 text-black text-[10px] font-mono font-bold uppercase rounded-md shadow-md flex items-center space-x-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Активен сейчас</span>
                      </span>
                    )}

                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <span className="text-[10px] font-mono uppercase bg-[#2e4733] px-2 py-0.5 rounded-xs">
                        {template.config.badgeText || 'БАННЕР'}
                      </span>
                      <h4 className="text-sm font-bold truncate mt-1">
                        {template.config.title}
                      </h4>
                    </div>
                  </div>

                  {/* Template Info Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-white mb-1">
                        <span>{template.name}</span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 font-sans leading-relaxed">
                        {template.config.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                      <span>{dateStr}</span>
                      <span className="text-emerald-500/80">Шаблон баннера</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-emerald-950 hover:bg-emerald-900 active:bg-emerald-950 text-emerald-400 text-xs font-mono font-bold rounded-lg border border-emerald-600/40 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Применить</span>
                      </button>

                      <button
                        onClick={() =>
                          setTemplateToDelete({ id: template.id, name: template.name })
                        }
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                        title="Удалить из истории"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <BookmarkPlus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-mono text-white">
                Сохранить в историю шаблонов
              </h3>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Введите название для сохранения текущих настроек баннера (фотография + заголовок + описание + кнопка).
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Название шаблона
              </label>
              <input
                type="text"
                autoFocus
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAsTemplate();
                }}
                placeholder="Например: Летняя коллекция 2026"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2.5 text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="px-5 py-2.5 bg-[#2e4733] hover:bg-[#233727] text-white text-xs font-mono font-bold rounded-xl border border-emerald-500/40 shadow-lg cursor-pointer"
              >
                Сохранить шаблон
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-mono text-white">
                  Удаление шаблона
                </h3>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  Подтверждение действия
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 font-sans leading-relaxed">
              Вы действительно хотите удалить шаблон <span className="font-bold text-white">"{templateToDelete.name}"</span> из истории?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2.5 text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                className="px-5 py-2.5 bg-red-900/80 hover:bg-red-800 active:bg-red-950 text-white text-xs font-mono font-bold rounded-xl border border-red-500/50 shadow-lg cursor-pointer"
              >
                Удалить шаблон
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
