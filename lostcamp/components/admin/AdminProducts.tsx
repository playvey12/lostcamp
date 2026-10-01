import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  Target,
} from 'lucide-react';
import { CatalogProduct } from '../../../server/data/products';
import { CategoryItem } from '../../types';
import { compressImageFile } from '../../utils/imageCompression';
import { ImageFocalAdjustModal } from './ImageFocalAdjustModal';
import {
  specialVest,
  specialPouch,
  tacticalBelt,
  tacticalBackpack,
  specialGunBag,
  specialHelmet,
  tacticalHolster,
  plateCarrier,
  tacticalOperator,
} from '../../assets/images';

interface AdminProductsProps {
  products: CatalogProduct[];
  categories?: CategoryItem[];
  categoriesList?: CategoryItem[];
  onUpdateProducts: (products: CatalogProduct[]) => void;
  onAddProduct?: (product: Partial<CatalogProduct>) => Promise<void>;
  onUpdateProduct?: (id: number, product: Partial<CatalogProduct>) => Promise<void>;
  onDeleteProduct?: (id: number) => Promise<void>;
  showToast: (msg: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  categoriesList: categoriesListProp,
  onUpdateProducts,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  showToast,
}) => {
  const categoriesList = categories || categoriesListProp || [];
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('все');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('все');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [focalModalTarget, setFocalModalTarget] = useState<{ type: 'main' | 'color'; colorName?: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [createSeparateCardsPerColor, setCreateSeparateCardsPerColor] = useState(true);

  const availableSubcategoriesForFilter = useMemo(() => {
    if (selectedCategoryFilter === 'все') return [];
    const cat = categoriesList.find((c) => c.categoryId === selectedCategoryFilter);
    return cat?.items || [];
  }, [categoriesList, selectedCategoryFilter]);

  const [formData, setFormData] = useState<{
    id?: number;
    title: string;
    price: number;
    oldPrice: number | string;
    discount: string;
    badge: string;
    category: string;
    subcategory: string;
    sku: string;
    image: string;
    galleryImages: string[];
    colorImages: Record<string, string>;
    colorGalleries: Record<string, string[]>;
    colorFocalPoints: Record<string, { x: number; y: number; zoom?: number }>;
    inStock: boolean;
    isPromo: boolean;
    description: string;
    color: string;
    availableColors: string;
    imageFocalPoint?: { x: number; y: number; zoom?: number };
  }>({
    title: '',
    price: 0,
    oldPrice: '',
    discount: '',
    badge: '',
    category: categoriesList[0]?.categoryId || 'плитники',
    subcategory: categoriesList[0]?.items?.[0] || '',
    sku: '',
    image: '',
    galleryImages: [],
    colorImages: {},
    colorGalleries: {},
    colorFocalPoints: {},
    inStock: true,
    isPromo: false,
    description: '',
    color: 'олива',
    availableColors: 'олива, мох, мультикам, черный, цифра',
    imageFocalPoint: { x: 50, y: 50 },
  });

  // The real cover photo shown on the site is always derived fresh from the current
  // per-color photos (see handleSaveProduct) — NOT the `formData.image` snapshot taken
  // when the edit form was opened, which goes stale the moment a color's photo is
  // replaced. Using this same live computation everywhere (form save AND the focal
  // point editor) guarantees the admin always adjusts focus on the exact photo that
  // will actually be shown, instead of an outdated one.
  const currentCoverImage = useMemo(() => {
    const parsedColorsList = formData.availableColors
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const firstColorName = parsedColorsList[0] || formData.color;
    return (
      (firstColorName && formData.colorImages[firstColorName]) ||
      (firstColorName && formData.colorGalleries[firstColorName]?.[0]) ||
      (formData.colorImages ? Object.values(formData.colorImages)[0] : '') ||
      (formData.colorGalleries ? Object.values(formData.colorGalleries)[0]?.[0] : '') ||
      formData.image ||
      ''
    );
  }, [formData.availableColors, formData.color, formData.colorImages, formData.colorGalleries, formData.image]);

  // Same idea for the focal point itself: the only place the admin can actually set a
  // focal point is the per-color "Настроить точку фокуса" button, which writes into
  // colorFocalPoints[colorName] — it never touches formData.imageFocalPoint. But the
  // catalog card reads the top-level imageFocalPoint field. Without this, whatever the
  // admin configures per-color is silently discarded on save and the card falls back to
  // a stale/default focal point that was never actually shown to the admin.
  const currentCoverFocalPoint = useMemo(() => {
    const parsedColorsList = formData.availableColors
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const firstColorName = parsedColorsList[0] || formData.color;
    return (
      (firstColorName && formData.colorFocalPoints[firstColorName]) ||
      formData.imageFocalPoint || { x: 50, y: 50 }
    );
  }, [formData.availableColors, formData.color, formData.colorFocalPoints, formData.imageFocalPoint]);

  const handleCategoryChange = (catId: string) => {
    const catObj = categoriesList.find((c) => c.categoryId === catId);
    const subcat = catObj && catObj.items && catObj.items.length > 0 ? catObj.items[0] : '';
    setFormData((prev) => ({
      ...prev,
      category: catId,
      subcategory: subcat,
    }));
  };

  const handleColorFileUpload = async (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setFormData((prev) => ({
        ...prev,
        colorImages: {
          ...prev.colorImages,
          [colorName.trim()]: dataUrl,
        },
      }));
    } catch (err: any) {
      showToast('Ошибка загрузки фото цвета: ' + (err?.message || err));
    }
  };

  const handleColorGalleryFileUpload = async (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const cleanColor = colorName.trim();
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      try {
        const dataUrl = await compressImageFile(file);
        newUrls.push(dataUrl);
      } catch (err: any) {
        showToast('Ошибка загрузки фото в галерею цвета: ' + (err?.message || err));
      }
    }
    if (newUrls.length > 0) {
      setFormData((prev) => {
        const currentGalleries = prev.colorGalleries?.[cleanColor] || [];
        return {
          ...prev,
          colorGalleries: {
            ...prev.colorGalleries,
            [cleanColor]: [...currentGalleries, ...newUrls],
          },
        };
      });
    }
  };

  const handleRemoveColorImage = (colorName: string) => {
    setFormData((prev) => {
      const nextColorImages = { ...prev.colorImages };
      delete nextColorImages[colorName.trim()];
      return {
        ...prev,
        colorImages: nextColorImages,
      };
    });
  };

  const handleRemoveColorGalleryImage = (colorName: string, indexToRemove: number) => {
    const cleanColor = colorName.trim();
    setFormData((prev) => {
      const currentList = prev.colorGalleries?.[cleanColor] || [];
      const nextList = currentList.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        colorGalleries: {
          ...prev.colorGalleries,
          [cleanColor]: nextList,
        },
      };
    });
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setCreateSeparateCardsPerColor(true);
    const initialCat = categoriesList[0]?.categoryId || 'плитники';
    const initialCatObj = categoriesList.find((c) => c.categoryId === initialCat);
    const initialSubcat = initialCatObj?.items?.[0] || '';
    setFormData({
      title: '',
      price: 5000,
      oldPrice: '',
      discount: '',
      badge: '',
      category: initialCat,
      subcategory: initialSubcat,
      sku: '',
      image: '',
      galleryImages: [],
      colorImages: {},
      colorGalleries: {},
      colorFocalPoints: {},
      inStock: true,
      isPromo: false,
      description: 'Высококачественное тактическое снаряжение LOST CAMP.',
      color: 'олива',
      availableColors: 'олива, мох, мультикам, черный, цифра',
      imageFocalPoint: { x: 50, y: 50 },
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: CatalogProduct) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      title: product.title,
      price: product.price,
      oldPrice: product.oldPrice || '',
      discount: product.discount || '',
      badge: product.badge || '',
      category: product.category,
      subcategory: product.subcategory || '',
      sku: product.sku || '',
      image: product.image,
      galleryImages: product.galleryImages && product.galleryImages.length > 0
        ? product.galleryImages
        : [product.image],
      colorImages: product.colorImages || {},
      colorGalleries: product.colorGalleries || {},
      colorFocalPoints: product.colorFocalPoints || {},
      inStock: product.inStock,
      isPromo: !!product.isPromo,
      description: product.description || '',
      color: product.color || 'олива',
      availableColors: product.availableColors
        ? product.availableColors.join(', ')
        : 'олива, мох, мультикам, черный',
      imageFocalPoint: product.imageFocalPoint || { x: 50, y: 50 },
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Укажите название товара');
      return;
    }

    const parsedColors = formData.availableColors
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const capitalizeColor = (str: string) => {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const isMultiColorCreation = !editingProduct && createSeparateCardsPerColor && parsedColors.length >= 2;

    if (isMultiColorCreation) {
      let createdCount = 0;
      let lastError: string | null = null;

      for (const colorName of parsedColors) {
        const colorImg = formData.colorImages[colorName];
        const firstImg = colorImg || '';
        const colorOwnGallery = formData.colorGalleries[colorName] || [];
        const itemGallery = colorOwnGallery.length > 0
          ? colorOwnGallery
          : (firstImg ? [firstImg] : []);

        const colorPayload: Partial<CatalogProduct> = {
          title: `${formData.title} (${capitalizeColor(colorName)})`,
          price: Number(formData.price),
          oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
          discount: formData.discount || undefined,
          badge: formData.badge || undefined,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          sku: formData.sku ? `${formData.sku}-${colorName}` : undefined,
          image: firstImg,
          galleryImages: itemGallery,
          colorImages: {},
          colorGalleries: formData.colorGalleries[colorName] ? { [colorName]: formData.colorGalleries[colorName] } : {},
          inStock: formData.inStock,
          isPromo: formData.isPromo,
          description: formData.description,
          color: colorName,
          availableColors: [colorName],
          imageFocalPoint: formData.colorFocalPoints[colorName] || formData.imageFocalPoint,
        };

        try {
          if (onAddProduct) {
            await onAddProduct(colorPayload);
          } else {
            const newId = Math.max(...products.map((p) => p.id), 100) + 1 + createdCount;
            onUpdateProducts([{ ...colorPayload, id: newId, reviews: [] } as CatalogProduct, ...products]);
          }
          createdCount++;
        } catch (err: any) {
          lastError = err?.message || 'Ошибка сохранения товара';
          break;
        }
      }

      if (lastError) {
        showToast(`Создано ${createdCount} из ${parsedColors.length} товаров. Ошибка: ${lastError}`);
      } else {
        const colorsListStr = parsedColors.join(', ');
        showToast(`Добавлено ${createdCount} товаров: ${formData.title} (${colorsListStr})`);
      }
      setIsProductModalOpen(false);
      return;
    }

    // Derive main image + top-level gallery purely from per-color photos (no manual main image/gallery anymore)
    const defaultMainImage = currentCoverImage;

    const finalGallery: string[] = [];
    Object.values(formData.colorGalleries).forEach((imgs) => {
      (imgs || []).forEach((img) => {
        if (img && !finalGallery.includes(img)) finalGallery.push(img);
      });
    });
    if (finalGallery.length === 0) {
      Object.values(formData.colorImages).forEach((img) => {
        if (img && !finalGallery.includes(img)) finalGallery.push(img);
      });
    }
    if (defaultMainImage && !finalGallery.includes(defaultMainImage)) {
      finalGallery.unshift(defaultMainImage);
    }

    try {
      if (editingProduct) {
        const productPayload: Partial<CatalogProduct> = {
          title: formData.title,
          price: Number(formData.price),
          oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
          discount: formData.discount || undefined,
          badge: formData.badge || undefined,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          sku: formData.sku || undefined,
          image: defaultMainImage,
          galleryImages: finalGallery,
          colorImages: formData.colorImages,
          colorGalleries: formData.colorGalleries,
          colorFocalPoints: formData.colorFocalPoints,
          inStock: formData.inStock,
          isPromo: formData.isPromo,
          description: formData.description,
          color: formData.color,
          availableColors: parsedColors.length > 0 ? parsedColors : ['олива', 'мох', 'мультикам'],
          imageFocalPoint: currentCoverFocalPoint,
        };

        if (onUpdateProduct) {
          await onUpdateProduct(editingProduct.id, productPayload);
        } else {
          const updatedList = products.map((p) =>
            p.id === editingProduct.id ? { ...p, ...productPayload } : p
          );
          onUpdateProducts(updatedList);
        }
        showToast(`Товар «${formData.title}» успешно обновлен`);
      } else {
        const newProductPayload: Partial<CatalogProduct> = {
          title: formData.title,
          price: Number(formData.price),
          oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
          discount: formData.discount || undefined,
          badge: formData.badge || undefined,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          sku: formData.sku || undefined,
          image: defaultMainImage,
          galleryImages: finalGallery,
          colorImages: formData.colorImages,
          colorGalleries: formData.colorGalleries,
          colorFocalPoints: formData.colorFocalPoints,
          inStock: formData.inStock,
          isPromo: formData.isPromo,
          description: formData.description,
          color: formData.color,
          availableColors: parsedColors.length > 0 ? parsedColors : ['олива', 'мох', 'мультикам'],
          imageFocalPoint: currentCoverFocalPoint,
        };

        if (onAddProduct) {
          await onAddProduct(newProductPayload);
        } else {
          const newId = Math.max(...products.map((p) => p.id), 100) + 1;
          onUpdateProducts([{ ...newProductPayload, id: newId, reviews: [] } as CatalogProduct, ...products]);
        }
        showToast(`Новый товар «${formData.title}» добавлен в каталог`);
      }

      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(err?.message || 'Ошибка сохранения товара');
    }
  };

  const handleDeleteProduct = (id: number) => {
    const target = products.find((p) => p.id === id);
    if (onDeleteProduct) {
      onDeleteProduct(id);
    } else {
      const updated = products.filter((p) => p.id !== id);
      onUpdateProducts(updated);
    }
    setDeletingProductId(null);
    showToast(`Товар «${target?.title || id}» удален`);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        p.id.toString().includes(q);
      const matchesCategory =
        selectedCategoryFilter === 'все' ||
        (selectedCategoryFilter === 'акции' ? !!p.isPromo : p.category === selectedCategoryFilter);
      const matchesSubcategory =
        selectedSubcategoryFilter === 'все' || p.subcategory === selectedSubcategoryFilter;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, productSearch, selectedCategoryFilter, selectedSubcategoryFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Toolbar */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Поиск товара по названию..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            {productSearch && (
              <button
                onClick={() => setProductSearch('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => {
              setSelectedCategoryFilter(e.target.value);
              setSelectedSubcategoryFilter('все');
            }}
            className="w-full sm:w-44 px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer capitalize"
          >
            <option value="все">Все категории</option>
            {categoriesList.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.title}
              </option>
            ))}
            <option value="акции">акции (по флагу)</option>
          </select>

          {availableSubcategoriesForFilter.length > 0 && (
            <select
              value={selectedSubcategoryFilter}
              onChange={(e) => setSelectedSubcategoryFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer capitalize"
            >
              <option value="все">Все подкатегории</option>
              {availableSubcategoriesForFilter.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#2e4733] hover:bg-[#233827] text-white rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition-all shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить товар</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-neutral-200">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4">Фото</th>
                <th className="p-4">ID / Название</th>
                <th className="p-4">Категория / Подкатегория</th>
                <th className="p-4">Цена</th>
                <th className="p-4">Скидка / Значок</th>
                <th className="p-4">Наличие</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700/60">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-700/40 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-700 rounded-lg p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-white text-sm lowercase">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-neutral-400">ID: {p.id}{p.sku ? ` • Арт: ${p.sku}` : ''}</div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-md text-[11px] capitalize">
                        {p.category}
                      </span>
                      {p.subcategory && (
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-md text-[10px] capitalize font-medium">
                          › {p.subcategory}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-emerald-400 text-sm">
                      {p.price.toLocaleString('ru-RU')} RUB
                    </div>
                    {p.oldPrice && (
                      <div className="text-[11px] text-neutral-500 line-through">
                        {p.oldPrice.toLocaleString('ru-RU')} RUB
                      </div>
                    )}
                  </td>

                  <td className="p-4">
                    {p.discount || p.badge ? (
                      <span className="px-2 py-0.5 bg-[#2e4733] text-emerald-200 border border-emerald-700/50 rounded-xs text-[10px] font-bold">
                        {p.discount || p.badge}
                      </span>
                    ) : (
                      <span className="text-neutral-500 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-1 rounded-xs text-[10px] font-bold ${
                          p.inStock
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {p.inStock ? 'В наличии' : 'Нет в наличии'}
                      </span>
                      {p.isPromo && (
                        <span className="px-2 py-1 rounded-xs text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          Акция
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors cursor-pointer"
                      title="Изменить"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingProductId(p.id)}
                      className="p-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-lg transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-neutral-400 font-mono text-xs">
            Товары не найдены по запросу «{productSearch}».
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProductId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-mono text-white">
              Подтверждение удаления
            </h3>
            <p className="text-xs text-neutral-300 font-mono">
              Вы уверены, что хотите удалить товар ID #{deletingProductId}? Это действие нельзя будет отменить.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteProduct(deletingProductId)}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Create/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>{editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono">
              {/* Title & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-300 mb-1 font-bold">Название товара *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Плитник LOST CAMP М2 Тактика"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Артикул (SKU)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="LC-PLT-001"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Price & Old Price & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1 font-bold">Цена (RUB) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Старая цена (необязательно)</label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                    placeholder="18000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Скидка / Значок</label>
                  <input
                    type="text"
                    value={formData.discount || formData.badge}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value, badge: e.target.value })}
                    placeholder="-15% или ХИТ"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category, Subcategory, Stock & Promo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1 font-bold">Категория *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500 capitalize"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-bold">Подкатегория</label>
                  {(() => {
                    const currentCatObj = categoriesList.find((c) => c.categoryId === formData.category);
                    const items = currentCatObj?.items || [];
                    if (items.length > 0) {
                      return (
                        <select
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500 capitalize"
                        >
                          <option value="">(Без подкатегории)</option>
                          {items.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      );
                    }
                    return (
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        placeholder="Подкатегория..."
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    );
                  })()}
                </div>

                <div className="flex items-center sm:pt-6 space-x-2">
                  <input
                    type="checkbox"
                    id="inStockCheck"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="inStockCheck" className="text-neutral-200 cursor-pointer font-bold">
                    В наличии
                  </label>
                </div>

                <div className="flex items-center sm:pt-6 space-x-2">
                  <input
                    type="checkbox"
                    id="isPromoCheck"
                    checked={formData.isPromo}
                    onChange={(e) => setFormData({ ...formData, isPromo: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isPromoCheck" className="text-neutral-200 cursor-pointer font-bold">
                    Акция (показать в разделе «акции»)
                  </label>
                </div>
              </div>

              {/* Photos are managed per color below — no separate main image/gallery upload */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-[11px] text-neutral-400">
                Отдельной загрузки главного фото и общей галереи больше нет — фотографии (обложка и галерея)
                настраиваются для каждого цвета ниже. Обложкой товара в каталоге станет фото первого цвета.
              </div>

              {/* Color Images per Color variant */}
              <div>
                <label className="block text-neutral-300 mb-1 font-bold">
                  Фото для доступных расцветок
                </label>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Укажите доступные цвета через запятую, затем можно загрузить конкретное фото под каждый цвет:
                </p>
                <input
                  type="text"
                  value={formData.availableColors}
                  onChange={(e) => setFormData({ ...formData, availableColors: e.target.value })}
                  placeholder="олива, мох, мультикам, черный, цифра"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500 mb-3"
                />

                {!editingProduct &&
                  formData.availableColors
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0).length >= 2 && (
                    <div className="flex items-center space-x-2.5 mb-3 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
                      <input
                        type="checkbox"
                        id="createSeparateCardsCheck"
                        checked={createSeparateCardsPerColor}
                        onChange={(e) => setCreateSeparateCardsPerColor(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="createSeparateCardsCheck" className="text-emerald-300 text-xs font-bold cursor-pointer select-none">
                        Создать отдельную карточку в каталоге для каждого цвета
                      </label>
                    </div>
                  )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  {formData.availableColors
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0)
                    .map((colorName) => {
                      const hasColorImg = !!formData.colorImages[colorName];
                      return (
                        <div key={colorName} className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-xs">
                          <span className="text-neutral-200 capitalize font-bold">{colorName}:</span>
                          <div className="flex items-center space-x-2">
                            {hasColorImg && (
                              <>
                                <div className="w-6 h-6 rounded bg-neutral-800 overflow-hidden border border-emerald-500 relative">
                                  <img src={formData.colorImages[colorName]} alt={colorName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFocalModalTarget({ type: 'color', colorName })}
                                  className="p-1 bg-[#2e4733] hover:bg-[#233827] text-emerald-300 border border-emerald-600/50 rounded flex items-center justify-center transition-colors shrink-0"
                                  title="Настроить точку фокуса обложки цвета"
                                >
                                  <Target className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <label className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded cursor-pointer text-[10px]">
                              {hasColorImg ? 'Заменить' : 'Загрузить фото'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleColorFileUpload(colorName, e)}
                                className="hidden"
                              />
                            </label>
                            {hasColorImg && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColorImage(colorName)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Color Galleries per Color variant */}
              <div>
                <label className="block text-neutral-300 mb-1 font-bold">
                  Галерея фотографий для каждого цвета
                </label>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Загрузите несколько подробных фотографий под каждый выбранный цвет товара:
                </p>
                <div className="space-y-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  {formData.availableColors
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0)
                    .map((colorName) => {
                      const gallery = formData.colorGalleries?.[colorName] || [];
                      return (
                        <div key={colorName} className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-neutral-200 capitalize font-bold text-xs">{colorName}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">({gallery.length} фото)</span>
                            </div>
                            <label className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-600/40 rounded cursor-pointer font-bold flex items-center gap-1.5 text-xs">
                              <Upload className="w-3 h-3" />
                              <span>Добавить фото</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleColorGalleryFileUpload(colorName, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {gallery.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                              {gallery.map((imgUrl, idx) => (
                                <div key={idx} className="relative group aspect-square bg-neutral-950 rounded-md border border-neutral-800 overflow-hidden p-1">
                                  <img src={imgUrl} alt={`${colorName} ${idx}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorGalleryImage(colorName, idx)}
                                    className="absolute top-1 right-1 p-0.5 bg-red-950 text-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Удалить фото из галереи цвета"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-300 mb-1 font-bold">Описание товара</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Введите описание назначения, материалов и особенностей товара..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2e4733] hover:bg-[#233827] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-lg flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Сохранить товар</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Image Focal Point Adjustment Modal */}
      <ImageFocalAdjustModal
        isOpen={focalModalTarget !== null}
        onClose={() => setFocalModalTarget(null)}
        imageUrl={
          focalModalTarget?.type === 'color' && focalModalTarget.colorName
            ? formData.colorImages[focalModalTarget.colorName] || ''
            : currentCoverImage
        }
        initialFocalPoint={
          focalModalTarget?.type === 'color' && focalModalTarget.colorName
            ? formData.colorFocalPoints[focalModalTarget.colorName] || { x: 50, y: 50 }
            : currentCoverFocalPoint
        }
        onSave={(focalPoint) => {
          if (focalModalTarget?.type === 'color' && focalModalTarget.colorName) {
            const cName = focalModalTarget.colorName;
            setFormData((prev) => ({
              ...prev,
              colorFocalPoints: {
                ...prev.colorFocalPoints,
                [cName]: focalPoint,
              },
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              imageFocalPoint: focalPoint,
            }));
          }
        }}
      />
    </div>
  );
};
