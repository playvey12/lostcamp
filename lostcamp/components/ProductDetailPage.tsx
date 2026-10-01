import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Star, Trash2, Plus, Minus } from 'lucide-react';
import { CatalogProduct, Review } from '../../server/data/products';
import { ReviewModal } from './ReviewModal';
import { ImageLightbox } from './ImageLightbox';
import { reviewService } from '../services/reviewService';
import { useShop } from '../context/ShopContext';
import { usePageTitle } from '../hooks/usePageTitle';

interface ProductDetailPageProps {
  product: CatalogProduct;
  onBackToCatalog: () => void;
  onAddToCart: (product: CatalogProduct, selectedColor?: string) => void;
  onNavigateHome?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBackToCatalog,
  onAddToCart,
  onNavigateHome,
}) => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, isAdminAuthenticated, showToast, products: allProducts } = useShop();
  usePageTitle(product.title);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    reviewService
      .fetchReviews(product.id)
      .then((data) => {
        if (isMounted) {
          setReviews(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load reviews for product:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  // Available colors list — only real colors that actually exist for this product,
  // never a made-up fallback list.
  const availableColorList = React.useMemo(() => {
    if (product.availableColors && product.availableColors.length > 0) {
      return product.availableColors;
    }
    return product.color ? [product.color] : [];
  }, [product.availableColors, product.color]);

  // Some products are created as SEPARATE catalog cards per color (one product per color,
  // titled "Название (Цвет)"). Find sibling cards of the same base product so the user can
  // see and switch between ALL colors that actually exist — not just the ones stored on
  // this particular product row.
  type ColorVariant = { key: string; label: string; kind: 'local' | 'sibling'; productId?: number; inStock: boolean };
  const colorVariants: ColorVariant[] = React.useMemo(() => {
    const stripColorSuffix = (t: string) => t.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const baseTitle = stripColorSuffix(product.title);

    const siblings = baseTitle
      ? allProducts.filter(
          (p) =>
            p.id !== product.id &&
            p.category === product.category &&
            stripColorSuffix(p.title) === baseTitle
        )
      : [];

    const variants: ColorVariant[] = availableColorList.map((c) => ({
      key: c.toLowerCase(),
      label: c,
      kind: 'local',
      inStock: product.inStock,
    }));

    siblings.forEach((sib) => {
      const label =
        sib.color || (sib.availableColors && sib.availableColors[0]) || sib.title;
      const key = label.toLowerCase();
      if (variants.some((v) => v.key === key)) return;
      variants.push({ key, label, kind: 'sibling', productId: sib.id, inStock: sib.inStock });
    });

    return variants;
  }, [allProducts, product, availableColorList]);

  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return product.color && availableColorList.includes(product.color)
      ? product.color
      : availableColorList[0] || 'олива';
  });

  // Calculate dynamic gallery images
  const gallery = React.useMemo(() => {
    // Check if color-specific gallery exists for selectedColor
    const colorSpecificGallery = product.colorGalleries?.[selectedColor];
    if (colorSpecificGallery && Array.isArray(colorSpecificGallery) && colorSpecificGallery.length > 0) {
      return colorSpecificGallery;
    }

    const list: string[] = [];
    
    // Add color photo if available for current selected color
    const colorPhoto = product.colorImages?.[selectedColor];
    if (colorPhoto) {
      list.push(colorPhoto);
    } else if (product.image) {
      list.push(product.image);
    }

    // Add base gallery images
    if (product.galleryImages && product.galleryImages.length > 0) {
      product.galleryImages.forEach((img) => {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      });
    } else if (product.image && !list.includes(product.image)) {
      list.push(product.image);
    }

    // Add all other color photos so user can browse them in gallery
    if (product.colorImages) {
      Object.entries(product.colorImages).forEach(([_, imgUrl]) => {
        if (typeof imgUrl === 'string' && imgUrl && !list.includes(imgUrl)) {
          list.push(imgUrl);
        }
      });
    }

    return list.length > 0 ? list : [product.image];
  }, [product, selectedColor]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Switch image and reset index when selected color changes
  React.useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor, product.colorImages, product.colorGalleries]);

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  const handleAddReview = async (formData: FormData) => {
    try {
      const saved = await reviewService.addReview(product.id, formData);
      setReviews((prev) => [saved, ...prev]);
      showToast('Ваш отзыв успешно сохранен!');
    } catch (err: any) {
      console.error('Failed to save review:', err);
      showToast(err.message || 'Не удалось сохранить отзыв');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Удалить этот отзыв?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast('Отзыв успешно удален');
    } catch (err) {
      console.error('Failed to delete review:', err);
      showToast('Ошибка при удалении отзыва');
    }
  };

  // Color Swatches color map helper
  const getColorBg = (colorName: string) => {
    const nameLower = colorName.toLowerCase().trim();
    if (nameLower.includes('олив')) return '#4a5338';
    if (nameLower.includes('мох')) return '#5f6848';
    if (nameLower.includes('мультикам')) return '#83775c';
    if (nameLower.includes('черн')) return '#1f1f1f';
    if (nameLower.includes('цифр') || nameLower.includes('емр')) return '#46523e';
    if (nameLower.includes('койот') || nameLower.includes('корич')) return '#8a6443';
    if (nameLower.includes('песок') || nameLower.includes('беж')) return '#c2a878';
    if (nameLower.includes('сер')) return '#63686e';
    if (nameLower.includes('бел')) return '#f3f3f3';
    return '#3f453c'; // default tactical green/gray
  };

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : '5.0';

  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans pb-20 pt-6 sm:pt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back to catalog button */}
        <div className="flex items-center">
          <button
            onClick={() => {
              if (onBackToCatalog) onBackToCatalog();
              else navigate(-1);
            }}
            className="bg-[#1a1a1a] hover:bg-black text-white px-5 py-2.5 text-xs font-normal uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer rounded-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>назад к каталогу</span>
          </button>
        </div>

        {/* Product Details Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Image View & Vertical Thumbnail Column */}
          <div className="lg:col-span-6 grid grid-cols-12 gap-4 items-start">
            
            {/* Main Big Image (takes 9 or 10 cols) */}
            <div className="col-span-9 sm:col-span-10 bg-[#f0f2f1] rounded-2xl h-[340px] sm:h-[420px] md:h-[460px] relative border border-neutral-200/80 overflow-hidden group">
              
              {/* Prev / Next round navigation buttons */}
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                title="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                title="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {(() => {
                const colorFocal = selectedColor ? product.colorFocalPoints?.[selectedColor] : undefined;
                const focal = colorFocal || product.imageFocalPoint || { x: 50, y: 50 };
                const posX = activeImageIndex === 0 ? focal.x : 50;
                const posY = activeImageIndex === 0 ? focal.y : 50;

                return (
                  <img
                    src={gallery[activeImageIndex]}
                    alt={product.title}
                    loading="lazy"
                    onClick={() => setIsLightboxOpen(true)}
                    className="w-full h-full object-cover filter drop-shadow-md cursor-zoom-in"
                    style={{
                      objectPosition: `${posX}% ${posY}%`,
                    }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                );
              })()}
            </div>

            {/* Vertical Thumbnail Column (takes 3 or 2 cols) */}
            {/*
              Height is reduced on mobile so exactly one fewer thumbnail is visible
              at a time (no half-cut-off thumbnail at the bottom of the column).
              Adjust the mobile value (260px) by ±10-20px if it still shows a
              partial thumbnail or looks too short on your target devices.
            */}
            <div className="col-span-3 sm:col-span-2 flex flex-col space-y-2.5 max-h-[360px] sm:max-h-[420px] md:max-h-[460px] overflow-y-auto pr-1">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-full aspect-square bg-[#f0f2f1] rounded-xl overflow-hidden p-1 border-2 transition-colors duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-[#2f4a35] bg-[#e7efe8]'
                      : 'border-transparent hover:border-[#2f4a35]/40 hover:bg-[#f0f2f1]'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </button>
              ))}
            </div>

          </div>

          {/* Right Column: Product Title, Price, Description, Colors, Add to Cart */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Subtitle & Title */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-neutral-400 font-normal uppercase tracking-wider block">
                  Lost Camp
                </span>
                {product.sku && (
                  <span className="text-xs text-neutral-500 font-mono">
                    Артикул: <span className="font-bold text-neutral-700">{product.sku}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black tracking-tight leading-tight lowercase">
                {product.title}
              </h1>
            </div>

            {/* Price */}
            <div className="text-xl sm:text-2xl font-bold text-black tracking-tight flex items-baseline gap-3">
              <span>{product.price} RUB</span>
              {product.oldPrice && (
                <span className="line-through text-neutral-400 text-base font-normal">
                  {product.oldPrice} RUB
                </span>
              )}
            </div>

            <div className="border-t border-neutral-200/80 my-2" />

            {/* Description Text matching mock */}
            <div className="text-xs sm:text-sm text-neutral-600 font-normal space-y-3 leading-relaxed">
              <p>{product.description}</p>
              
              {product.detailedParagraphs && product.detailedParagraphs.length > 0 ? (
                product.detailedParagraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))
              ) : (
                <>
                 
                </>
              )}
            </div>

            <div className="border-t border-neutral-200/80 my-2" />

            {/* Color selection swatches */}
            {colorVariants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-black lowercase tracking-tight">
                    цвет: <span className="font-mono text-xs uppercase text-[#2f4a35] font-bold">{selectedColor}</span>
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {colorVariants.map((variant) => {
                    const isSelected =
                      variant.kind === 'local' && selectedColor.toLowerCase() === variant.key;
                    const colorBg = getColorBg(variant.label);
                    const hasCustomPhoto =
                      variant.kind === 'local' &&
                      (!!product.colorImages?.[variant.label] || !!product.colorGalleries?.[variant.label]?.length);
                    return (
                      <button
                        key={`${variant.kind}-${variant.key}`}
                        onClick={() => {
                          if (variant.kind === 'local') {
                            setSelectedColor(variant.label);
                          } else if (variant.productId) {
                            navigate(`/product/${variant.productId}`);
                          }
                        }}
                        title={`${variant.label}${!variant.inStock ? ' (нет в наличии)' : ''}${hasCustomPhoto ? ' (есть уникальное фото)' : ''}`}
                        className={`h-9 px-3.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-2 border ${
                          isSelected
                            ? 'border-[#2f4a35] bg-[#2f4a35] text-white font-bold ring-2 ring-[#2f4a35]/30 shadow-sm'
                            : !variant.inStock
                            ? 'border-neutral-300 bg-neutral-100 text-neutral-400'
                            : 'border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 ${!variant.inStock ? 'opacity-40' : ''}`}
                          style={{ backgroundColor: colorBg }}
                        />
                        <span className={`capitalize ${!variant.inStock ? 'line-through' : ''}`}>
                          {variant.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart button / Stepper */}
            <div className="pt-2">
              {(() => {
                const cartItem = cartItems.find(
                  (item) =>
                    item.product.id === product.id &&
                    (item.selectedColor === selectedColor ||
                      (!item.selectedColor && (item.product.color || 'олива') === selectedColor))
                );
                const quantityInCart = cartItem ? cartItem.quantity : 0;

                if (quantityInCart > 0) {
                  return (
                    <div className="inline-flex items-center border border-[#2f4a35] bg-white rounded-xs overflow-hidden h-[46px] px-3 space-x-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quantityInCart <= 1) {
                            removeItem(product.id, selectedColor);
                          } else {
                            updateQuantity(product.id, quantityInCart - 1, selectedColor);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer rounded-xs"
                        aria-label="Уменьшить количество"
                      >
                        <Minus className="w-4 h-4 stroke-[2]" />
                      </button>
                      <span className="font-bold text-black select-none text-sm font-sans min-w-[20px] text-center">
                        {quantityInCart} в корзине
                      </span>
                      <button
                        type="button"
                        disabled={!product.inStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(product.id, quantityInCart + 1, selectedColor);
                        }}
                        className={`w-8 h-8 flex items-center justify-center text-neutral-800 transition-colors rounded-xs ${
                          product.inStock
                            ? 'hover:bg-neutral-100 active:bg-neutral-200 cursor-pointer'
                            : 'opacity-30 cursor-not-allowed'
                        }`}
                        aria-label="Увеличить количество"
                        title={product.inStock ? undefined : 'Товара нет в наличии'}
                      >
                        <Plus className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  );
                }

                if (!product.inStock) {
                  return (
                    <button
                      type="button"
                      disabled
                      className="py-3.5 px-10 bg-neutral-200 text-neutral-500 text-xs font-normal uppercase tracking-wider rounded-xs cursor-not-allowed"
                    >
                      нет в наличии
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, selectedColor)}
                    className="py-3.5 px-10 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-normal uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
                  >
                    добавить в корзину
                  </button>
                );
              })()}
            </div>

            <div className="border-t border-neutral-200/80 my-4" />

            {/* Reviews Header Row */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <h2 className="text-sm font-bold text-black uppercase tracking-wide">
                    ОТЗЫВЫ {reviews.length}
                  </h2>
                  
                  {/* Star rating icons */}
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(Number(avgRating))
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-300 fill-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="bg-[#2a2a2a] hover:bg-black text-white text-[11px] uppercase tracking-wider py-2 px-4 font-normal transition-colors cursor-pointer rounded-xs"
                >
                  оставить отзыв
                </button>
              </div>

              {/* Reviews List */}
              <div className="space-y-6 pt-2">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border-b border-neutral-100 pb-5 space-y-2 text-left relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-normal text-xs sm:text-sm text-black">
                          {rev.userName}
                        </span>
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-neutral-300 fill-neutral-100'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {isAdminAuthenticated && rev.id && (
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors cursor-pointer flex items-center space-x-1 text-xs"
                          title="Удалить отзыв"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Удалить</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                      {rev.text}
                    </p>

                    {/* Review photos thumbnails */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex items-center space-x-3 pt-2">
                        {rev.photos.map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            className="w-16 h-16 sm:w-20 sm:h-20 bg-[#d9dcdb] rounded-lg overflow-hidden shadow-2xs border border-neutral-200"
                          >
                            <img
                              src={photo}
                              alt="Review attachment"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {reviews.length === 0 && (
                  <p className="text-xs text-neutral-400 italic">
                    Будьте первым, кто оставит отзыв о данном товаре!
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        product={product}
        onSubmitReview={handleAddReview}
        onNavigateHome={onNavigateHome}
      />

      {/* Image Lightbox Modal */}
      <ImageLightbox
        images={gallery}
        activeIndex={activeImageIndex}
        onIndexChange={setActiveImageIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};