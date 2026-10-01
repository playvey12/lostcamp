import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Target,
  Video,
  Loader2,
} from 'lucide-react';
import { newsService } from '../../services/newsService';
import { NewsArticle } from '../../types';
import { compressImageFile } from '../../utils/imageCompression';
import { ImageFocalAdjustModal } from './ImageFocalAdjustModal';

interface AdminNewsProps {
  showToast: (msg: string) => void;
}

export const AdminNews: React.FC<AdminNewsProps> = ({ showToast }) => {
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [newsToDelete, setNewsToDelete] = useState<NewsArticle | null>(null);

  const [newsTitle, setNewsTitle] = useState('');
  const [newsSubtitle, setNewsSubtitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsDate, setNewsDate] = useState('');
  const [newsTags, setNewsTags] = useState('НОВОСТИ, ТАКТИКА');
  const [newsMediaLayout, setNewsMediaLayout] = useState<
    '1_photo' | '2_photo' | '3_photo' | '1_photo_1_video' | '2_photo_1_video' | '1_video'
  >('1_photo');
  const [newsImage1, setNewsImage1] = useState('');
  const [newsImage2, setNewsImage2] = useState('');
  const [newsImage3, setNewsImage3] = useState('');
  const [newsVideoUrl, setNewsVideoUrl] = useState('');
  const [newsCoverImage, setNewsCoverImage] = useState('');
  const [newsCoverFocalPoint, setNewsCoverFocalPoint] = useState<{ x: number; y: number; zoom?: number }>({
    x: 50,
    y: 50,
  });
  const [isCoverFocalModalOpen, setIsCoverFocalModalOpen] = useState(false);
  const [isUploadingVideoFile, setIsUploadingVideoFile] = useState(false);

  const fetchNews = async () => {
    setIsNewsLoading(true);
    try {
      const data = await newsService.fetchNews();
      setNewsList(data);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreateNews = () => {
    setEditingNews(null);
    setNewsTitle('');
    setNewsSubtitle('');
    setNewsContent('');
    setNewsDate(new Date().toLocaleDateString('ru-RU'));
    setNewsTags('НОВОСТИ, ТАКТИКА');
    setNewsMediaLayout('1_photo');
    setNewsImage1('');
    setNewsImage2('');
    setNewsImage3('');
    setNewsVideoUrl('');
    setNewsCoverImage('');
    setNewsCoverFocalPoint({ x: 50, y: 50 });
    setIsNewsModalOpen(true);
  };

  const handleOpenEditNews = (item: NewsArticle) => {
    setEditingNews(item);
    setNewsTitle(item.title || '');
    setNewsSubtitle(item.subtitle || '');
    setNewsContent(item.content || '');
    setNewsDate(item.date || '');
    setNewsTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));
    setNewsMediaLayout(item.mediaLayout || '1_photo');
    setNewsImage1(item.image1 || '');
    setNewsImage2(item.image2 || '');
    setNewsImage3(item.image3 || '');
    setNewsVideoUrl(item.videoUrl || '');
    setNewsCoverImage(item.coverImage || '');
    setNewsCoverFocalPoint(item.coverFocalPoint || { x: 50, y: 50 });
    setIsNewsModalOpen(true);
  };

  const handleNewsImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setter(dataUrl);
    } catch (err: any) {
      showToast('Ошибка при обработке фото: ' + (err?.message || err));
    }
  };

  const handleNewsVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setIsUploadingVideoFile(true);
    try {
      showToast('Загрузка видеофайла на сервер...');
      const response = await fetch('/api/site/upload-video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (data.url) {
        setNewsVideoUrl(data.url);
        showToast('Видео загружено');
      } else {
        showToast(data.error || 'Не удалось загрузить видео');
      }
    } catch (err: any) {
      showToast('Ошибка загрузки видео: ' + (err?.message || err));
    } finally {
      setIsUploadingVideoFile(false);
      e.target.value = '';
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      alert('Заполните заголовок и текст новости');
      return;
    }

    const payload: Partial<NewsArticle> = {
      title: newsTitle.trim(),
      subtitle: newsSubtitle.trim() || undefined,
      content: newsContent.trim(),
      date: newsDate || new Date().toLocaleDateString('ru-RU'),
      tags: newsTags.trim() || 'НОВОСТИ',
      mediaLayout: newsMediaLayout,
      image1: newsImage1.trim() || undefined,
      image2: newsImage2.trim() || undefined,
      image3: newsImage3.trim() || undefined,
      videoUrl: newsVideoUrl.trim() || undefined,
      coverImage: newsCoverImage.trim() || undefined,
      coverFocalPoint: newsCoverImage.trim() ? newsCoverFocalPoint : undefined,
    };

    try {
      if (editingNews && editingNews.id) {
        await newsService.updateNews(editingNews.id, payload);
        showToast(`Новость «${newsTitle}» успешно обновлена`);
      } else {
        await newsService.createNews(payload);
        showToast(`Новость «${newsTitle}» успешно создана`);
      }
      setIsNewsModalOpen(false);
      fetchNews();
    } catch (err: any) {
      console.error('Error saving news:', err);
      showToast(err?.message || 'Ошибка при сохранении новости');
    }
  };

  const confirmDeleteNews = async () => {
    if (!newsToDelete || newsToDelete.id === undefined) return;
    const { id, title } = newsToDelete;
    try {
      await newsService.deleteNews(id);
      showToast(`Новость «${title}» удалена`);
      await fetchNews();
    } catch (err: any) {
      console.error('Error deleting news:', err);
      showToast(err?.message || 'Ошибка при удалении новости');
    } finally {
      setNewsToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#2e4733] flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <span>Управление новостями и статьями</span>
              <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-600/40 text-emerald-400 text-[10px] rounded-full uppercase">
                Блог / Новости
              </span>
            </h2>
            <p className="text-xs text-neutral-300 font-mono mt-1 max-w-2xl leading-relaxed">
              Создавайте, редактируйте и удаляйте новости магазина. Доступны различные раскладки медиафайлов (фото и видео).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateNews}
          className="px-5 py-3 bg-[#2e4733] hover:bg-[#233827] text-white border border-emerald-600/50 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors flex items-center gap-2 shrink-0 shadow-lg"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Добавить новость</span>
        </button>
      </div>

      {isNewsLoading ? (
        <div className="p-12 text-center text-neutral-400 font-mono text-xs">
          Загрузка новостей...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-700/60 transition-all"
            >
              <div className="space-y-3">
                {(item.coverImage || item.image1) && (
                  <div className="w-full h-40 bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700/60">
                    <img
                      src={item.coverImage || item.image1}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      style={
                        item.coverImage && item.coverFocalPoint
                          ? { objectPosition: `${item.coverFocalPoint.x}% ${item.coverFocalPoint.y}%` }
                          : undefined
                      }
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span>{item.date}</span>
                    <span className="px-2 py-0.5 bg-neutral-900 text-emerald-400 rounded">
                      {item.mediaLayout}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono leading-tight">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-xs text-neutral-400 font-mono mt-1 line-clamp-2">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <p className="text-xs text-neutral-300 font-mono line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-neutral-700/60 pt-3">
                <button
                  type="button"
                  onClick={() => handleOpenEditNews(item)}
                  className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Редактировать</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewsToDelete(item)}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isNewsLoading && newsList.length === 0 && (
        <div className="p-12 bg-neutral-800/80 border border-neutral-700/80 rounded-2xl text-center text-neutral-400 font-mono text-xs">
          Новостей пока нет. Нажмите «+ Добавить новость», чтобы опубликовать первую новость.
        </div>
      )}

      {/* Delete News Confirmation Modal */}
      {newsToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-white">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Подтверждение удаления</span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Вы действительно хотите удалить новость «<strong className="text-white">{newsToDelete.title}</strong>»? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setNewsToDelete(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteNews}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit News */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsNewsModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-6 sm:p-8 text-white z-10 rounded-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setIsNewsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-mono uppercase tracking-wider text-emerald-400">
              {editingNews ? `Редактирование новости #${editingNews.id}` : 'Создание новости'}
            </h3>

            <form onSubmit={handleSaveNews} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-neutral-300 font-bold block">Заголовок *</label>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Заголовок новости"
                  className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-neutral-300 font-bold block">Подзаголовок</label>
                  <input
                    type="text"
                    value={newsSubtitle}
                    onChange={(e) => setNewsSubtitle(e.target.value)}
                    placeholder="Краткое описание"
                    className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300 font-bold block">Дата публикации</label>
                  <input
                    type="text"
                    value={newsDate}
                    onChange={(e) => setNewsDate(e.target.value)}
                    placeholder="01.10.2025"
                    className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-bold block">Теги (через запятую)</label>
                  <input
                    type="text"
                    value={newsTags}
                    onChange={(e) => setNewsTags(e.target.value)}
                    placeholder="НОВОСТИ, ТАКТИКА"
                    className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-bold block">Раскладка медиафайлов *</label>
                  <select
                    value={newsMediaLayout}
                    onChange={(e) => setNewsMediaLayout(e.target.value as any)}
                    className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="1_photo">1 Фотография</option>
                    <option value="2_photo">2 Фотографии</option>
                    <option value="3_photo">3 Фотографии</option>
                    <option value="1_photo_1_video">1 Фотография + 1 Видео</option>
                    <option value="2_photo_1_video">2 Фотографии + 1 Видео</option>
                    <option value="1_video">1 Видео</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-bold block">Текст новости / содержание *</label>
                <textarea
                  required
                  rows={5}
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Введите основной текст новости..."
                  className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Cover Image Section — separate from in-article photos, with its own crop/focal control */}
              <div className="space-y-2 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Обложка новости</span>
                  <span className="text-[10px] text-neutral-500 normal-case font-normal">
                    показывается в списке новостей и на главной
                  </span>
                </h4>
                <div className="flex items-center justify-between gap-2">
                  <label className="cursor-pointer bg-[#2e4733] hover:bg-[#233827] text-white px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>Загрузить с ПК</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleNewsImageUpload(e, setNewsCoverImage)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!newsCoverImage}
                    onClick={() => setIsCoverFocalModalOpen(true)}
                    className="px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>Настроить отображение</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newsCoverImage}
                  onChange={(e) => setNewsCoverImage(e.target.value)}
                  placeholder="URL или загруженный файл (если пусто — используется Изображение 1)"
                  className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                {newsCoverImage && (
                  <div className="w-full aspect-[16/9] max-w-xs bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
                    <img
                      src={newsCoverImage}
                      alt="Превью обложки"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${newsCoverFocalPoint.x}% ${newsCoverFocalPoint.y}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Media Upload Section */}
              <div className="space-y-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Медиаматериалы</h4>

                {/* Photo 1 */}
                {(newsMediaLayout.includes('photo') || newsMediaLayout === '1_photo') && (
                  <div className="space-y-2">
                    <label className="text-neutral-300 font-bold flex items-center justify-between">
                      <span>Изображение 1</span>
                      <label className="cursor-pointer bg-[#2e4733] hover:bg-[#233827] text-white px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>Загрузить с ПК</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleNewsImageUpload(e, setNewsImage1)}
                          className="hidden"
                        />
                      </label>
                    </label>
                    <input
                      type="text"
                      value={newsImage1}
                      onChange={(e) => setNewsImage1(e.target.value)}
                      placeholder="URL или загруженный файл"
                      className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-neutral-500">
                      {newsCoverImage
                        ? 'Обложка задана — это фото пойдёт отдельным блоком ниже в тексте статьи.'
                        : 'Обложка не задана — это фото будет также показано вверху статьи рядом с заголовком.'}
                    </p>
                  </div>
                )}

                {/* Photo 2 */}
                {(newsMediaLayout === '2_photo' || newsMediaLayout === '3_photo' || newsMediaLayout === '2_photo_1_video') && (
                  <div className="space-y-2">
                    <label className="text-neutral-300 font-bold flex items-center justify-between">
                      <span>Изображение 2</span>
                      <label className="cursor-pointer bg-[#2e4733] hover:bg-[#233827] text-white px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>Загрузить с ПК</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleNewsImageUpload(e, setNewsImage2)}
                          className="hidden"
                        />
                      </label>
                    </label>
                    <input
                      type="text"
                      value={newsImage2}
                      onChange={(e) => setNewsImage2(e.target.value)}
                      placeholder="URL или загруженный файл"
                      className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Photo 3 */}
                {newsMediaLayout === '3_photo' && (
                  <div className="space-y-2">
                    <label className="text-neutral-300 font-bold flex items-center justify-between">
                      <span>Изображение 3</span>
                      <label className="cursor-pointer bg-[#2e4733] hover:bg-[#233827] text-white px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3 text-emerald-400" />
                        <span>Загрузить с ПК</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleNewsImageUpload(e, setNewsImage3)}
                          className="hidden"
                        />
                      </label>
                    </label>
                    <input
                      type="text"
                      value={newsImage3}
                      onChange={(e) => setNewsImage3(e.target.value)}
                      placeholder="URL или загруженный файл"
                      className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Video URL */}
                {newsMediaLayout.includes('video') && (
                  <div className="space-y-2">
                    <label className="text-neutral-300 font-bold flex items-center justify-between">
                      <span>Видео (файл или ссылка YouTube / Rutube / MP4)</span>
                      <label
                        className={`cursor-pointer px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                          isUploadingVideoFile
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                            : 'bg-[#2e4733] hover:bg-[#233827] text-white'
                        }`}
                      >
                        {isUploadingVideoFile ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Video className="w-3 h-3" />
                        )}
                        <span>{isUploadingVideoFile ? 'Загрузка...' : 'Загрузить видео с ПК'}</span>
                        <input
                          type="file"
                          accept="video/*"
                          disabled={isUploadingVideoFile}
                          onChange={handleNewsVideoFileUpload}
                          className="hidden"
                        />
                      </label>
                    </label>
                    <input
                      type="text"
                      value={newsVideoUrl}
                      onChange={(e) => setNewsVideoUrl(e.target.value)}
                      placeholder="https://... или загрузите файл кнопкой выше"
                      className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-mono text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2e4733] hover:bg-[#233827] text-white font-mono text-xs font-bold rounded-lg cursor-pointer"
                >
                  {editingNews ? 'Сохранить изменения' : 'Опубликовать новость'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cover Image Focal Point Modal */}
      <ImageFocalAdjustModal
        isOpen={isCoverFocalModalOpen}
        onClose={() => setIsCoverFocalModalOpen(false)}
        imageUrl={newsCoverImage}
        initialFocalPoint={newsCoverFocalPoint}
        aspectRatio={16 / 9}
        aspectLabel="16:9"
        onSave={(fp) => setNewsCoverFocalPoint(fp)}
      />
    </div>
  );
};
