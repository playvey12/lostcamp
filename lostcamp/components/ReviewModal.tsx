import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2 } from 'lucide-react';
import { CatalogProduct } from '../../server/data/products';
import { LostCampLogo } from './LostCampLogo';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct;
  onSubmitReview: (formData: FormData) => Promise<void> | void;
  onNavigateHome?: () => void;
}

interface PhotoItem {
  file: File;
  previewUrl: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmitReview,
  onNavigateHome,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [email, setEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 5) {
      alert('Вы можете прикрепить не более 5 фото к одному отзыву.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const newPhotoItems: PhotoItem[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert(`Файл "${file.name}" имеет недопустимый формат. Разрешены только JPEG, PNG и WebP.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        alert(`Файл "${file.name}" превышает допустимый размер (5 МБ).`);
        return;
      }
      newPhotoItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPhotos((prev) => [...prev, ...newPhotoItems]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const item = prev[index];
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      alert('Пожалуйста, заполните Ваше имя и текст отзыва.');
      return;
    }

    const formData = new FormData();
    formData.append('userName', userName.trim());
    formData.append('email', email.trim());
    formData.append('rating', String(rating));
    formData.append('text', comment.trim());
    formData.append('date', new Date().toLocaleDateString('ru-RU'));

    photos.forEach((item) => {
      formData.append('photos', item.file);
    });

    try {
      setIsSubmitting(true);
      await onSubmitReview(formData);

      // Reset fields
      setEmail('');
      setUserName('');
      setComment('');
      setRating(5);
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPhotos([]);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка при отправке отзыва.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-6 text-neutral-900 font-sans border border-neutral-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button X */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-black transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOST CAMP Header Logo */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              onClose();
              if (onNavigateHome) {
                onNavigateHome();
              }
            }}
            className="cursor-pointer hover:opacity-90 transition-opacity focus:outline-none"
            title="На главную"
          >
            <LostCampLogo className="h-10 w-auto" />
          </button>
        </div>

        {/* Product Summary Row */}
        <div className="flex items-center space-x-4 pt-1 pb-2">
          <div className="w-14 h-14 bg-[#f0f2f1] rounded-xl overflow-hidden p-1 flex-shrink-0 flex items-center justify-center border border-neutral-200">
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-black lowercase leading-snug">
              {product.title}
            </h3>
            <p className="text-xs text-neutral-400 font-normal">
              {product.price} RUB
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Interactive 5-Star Rating Selection */}
          <div className="flex justify-center items-center space-x-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeRating = hoverRating !== null ? hoverRating : rating;
              const isFilled = star <= activeRating;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-hidden cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      isFilled
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-300 fill-neutral-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Email field */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1 font-normal">
              Электронная почта<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.ru"
              className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xs text-xs focus:outline-hidden focus:border-black transition-colors bg-white"
            />
          </div>

          {/* Name field */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1 font-normal">
              Ваше имя<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xs text-xs focus:outline-hidden focus:border-black transition-colors bg-white"
            />
          </div>

          {/* Review comment field */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1 font-normal">
              Как вам товар?
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Напишите ваш отзыв..."
              className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xs text-xs focus:outline-hidden focus:border-black transition-colors bg-white resize-none"
            />
          </div>

          {/* Add photo section */}
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5 font-normal">
              Добавьте фото (до 5 шт., макс. 5 МБ)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {photos.map((item, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 bg-[#e5e7eb] border border-neutral-300 rounded-lg relative overflow-hidden group shrink-0"
                >
                  <img
                    src={item.previewUrl}
                    alt={`Preview ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Удалить фото"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="w-16 h-16 bg-[#e5e7eb] hover:bg-neutral-300 border border-dashed border-neutral-400 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Plus className="w-6 h-6 text-neutral-500" />
                  <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
                    {photos.length}/5
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-normal uppercase tracking-wider transition-colors cursor-pointer rounded-xs disabled:opacity-50"
            >
              {isSubmitting ? 'отправка...' : 'готово'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
