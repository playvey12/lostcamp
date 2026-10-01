import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Check, Plus, Minus } from 'lucide-react';
import { initialProducts, CatalogProduct } from '../../server/data/products';
import { Product, CategoryItem } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';
import { useShop } from '../context/ShopContext';

interface CatalogPageProps {
  onAddToCart: (product: Product, selectedColor?: string) => void;
  selectedCategoryProp?: string;
  selectedSubcategoryProp?: string;
  onNavigateHome?: () => void;
  products?: CatalogProduct[];
  categoriesData?: CategoryItem[];
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onAddToCart,
  selectedCategoryProp,
  selectedSubcategoryProp,
  onNavigateHome,
  products = initialProducts,
  categoriesData,
}) => {
  const { cartItems, updateQuantity, removeItem } = useShop();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (categoryId) return decodeURIComponent(categoryId);
    return selectedCategoryProp || 'все товары';
  });

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(
    selectedSubcategoryProp
  );

  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(decodeURIComponent(categoryId));
    } else if (selectedCategoryProp) {
      setSelectedCategory(selectedCategoryProp);
    } else {
      setSelectedCategory('все товары');
    }
  }, [categoryId, selectedCategoryProp]);

  useEffect(() => {
    setSelectedSubcategory(selectedSubcategoryProp);
  }, [selectedSubcategoryProp]);

  const catalogTitle = selectedCategory && selectedCategory.toLowerCase() !== 'все товары'
    ? (selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1))
    : 'Каталог';
  usePageTitle(catalogTitle);

  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory(undefined);
    if (catId === 'все товары') {
      navigate('/catalog');
    } else {
      navigate(`/catalog/${encodeURIComponent(catId)}`);
    }
  };

  const handleSelectSubcategory = (subcat: string) => {
    if (selectedSubcategory === subcat) {
      setSelectedSubcategory(undefined);
    } else {
      setSelectedSubcategory(subcat);
    }
  };

  const categories = categoriesData && categoriesData.length > 0
    ? [
        { id: 'все товары', label: 'все товары' },
        ...categoriesData.map((c) => ({ id: c.categoryId, label: c.title })),
        { id: 'акции', label: 'акции' },
      ]
    : [
        { id: 'все товары', label: 'все товары' },
        { id: 'подсумки', label: 'подсумки' },
        { id: 'чехлы', label: 'чехлы' },
        { id: 'плитники', label: 'плитники' },
        { id: 'кобуры', label: 'кобуры' },
        { id: 'разгрузки', label: 'разгрузки' },
        { id: 'акции', label: 'акции' },
      ];


  const colors = [
    { id: 'олива', label: 'олива' },
    { id: 'мох', label: 'мох' },
    { id: 'мультикам', label: 'мультикам' },
    { id: 'черный', label: 'черный' },
    { id: 'цифра', label: 'цифра' },
  ];

  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((c) => c !== colorId)
        : [...prev, colorId]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('все товары');
    setSelectedSubcategory(undefined);
    setOnlyInStock(false);
    setSelectedColors([]);
    navigate('/catalog');
  };

  // Filter products from database
  const filteredProducts = useMemo(() => {
    const result = products.filter((p) => {
      if (selectedCategory === 'акции') {
        // "акции" is a virtual filter (isPromo flag), not a real category —
        // a product can be in any category (e.g. "подсумки") AND be on promo.
        if (!p.isPromo) return false;
      } else if (selectedCategory !== 'все товары' && p.category !== selectedCategory) {
        return false;
      }
      if (selectedSubcategory && p.subcategory !== selectedSubcategory) {
        return false;
      }
      if (onlyInStock && !p.inStock) {
        return false;
      }
      if (selectedColors.length > 0) {
        const matchColor = selectedColors.some((c) =>
          p.availableColors ? p.availableColors.includes(c) : p.color === c
        );
        if (!matchColor) return false;
      }
      return true;
    });

    // Out-of-stock products always sink to the bottom (in any category/tab),
    // while keeping the relative order of in-stock and out-of-stock items intact.
    return [...result].sort((a, b) => {
      const aOut = a.inStock ? 0 : 1;
      const bOut = b.inStock ? 0 : 1;
      return aOut - bOut;
    });
  }, [products, selectedCategory, selectedSubcategory, onlyInStock, selectedColors]);

  return (
    <div className="bg-[#f0f2f1] min-h-screen text-neutral-900 font-sans pb-20 pt-8 sm:pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 sm:p-6 shadow-2xs border border-neutral-200/60 space-y-6 lg:sticky lg:top-24 self-start">
            
            {/* Header: категория + Reset X icon */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-base sm:text-sm font-bold text-black tracking-tight lowercase">
                категория
              </h2>
              <button
                onClick={resetFilters}
                title="Сбросить фильтры"
                className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories List */}
            <ul className="space-y-1.5 sm:space-y-2">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const catObj = categoriesData?.find((c) => c.categoryId === cat.id);
                const subitems = catObj?.items || [];

                return (
                  <li key={cat.id} className="space-y-1">
                    <button
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`text-left w-full py-1 text-sm sm:text-sm transition-colors cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'font-bold text-black text-base sm:text-sm'
                          : 'font-normal text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {subitems.length > 0 && isActive && (
                        <span className="text-[10px] text-emerald-700 font-mono">({subitems.length})</span>
                      )}
                    </button>

                    {/* Subcategories accordion / sublist */}
                    {isActive && subitems.length > 0 && (
                      <ul className="pl-3 border-l-2 border-[#2f4a35]/30 space-y-1 py-1 my-1">
                        {subitems.map((sub) => {
                          const isSubActive = selectedSubcategory === sub;
                          return (
                            <li key={sub}>
                              <button
                                onClick={() => handleSelectSubcategory(sub)}
                                className={`text-left w-full text-xs py-0.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
                                  isSubActive
                                    ? 'font-bold text-[#2f4a35]'
                                    : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                              >
                                <span className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-[#2f4a35]' : 'bg-neutral-300'}`} />
                                <span className="capitalize">{sub}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-neutral-200/80 my-4" />

            {/* Checkbox: только в наличии */}
            <label className="flex items-center space-x-3 cursor-pointer select-none py-1">
              <div
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`w-5 h-5 sm:w-4 sm:h-4 border rounded-xs flex items-center justify-center transition-colors shrink-0 ${
                  onlyInStock
                    ? 'bg-[#2f4a35] border-[#2f4a35] text-white'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {onlyInStock && <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 stroke-[3]" />}
              </div>
              <span className="text-sm sm:text-sm text-neutral-800 font-medium sm:font-normal">
                только в наличии
              </span>
            </label>

            <div className="border-t border-neutral-200/80 my-4" />

            {/* Section: цвет */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-sm font-bold text-black tracking-tight lowercase">
                цвет
              </h3>

              <div className="space-y-2">
                {colors.map((c) => {
                  const isChecked = selectedColors.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      onClick={() => toggleColor(c.id)}
                      className="flex items-center space-x-3 cursor-pointer select-none py-1"
                    >
                      <div
                        className={`w-5 h-5 sm:w-4 sm:h-4 border rounded-xs flex items-center justify-center transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-[#2f4a35] border-[#2f4a35] text-white'
                            : 'bg-white border-neutral-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 stroke-[3]" />}
                      </div>
                      <span className="text-sm sm:text-sm text-neutral-800 font-medium sm:font-normal">
                        {c.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Product Grid Column */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Title / Breadcrumb */}
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight flex items-center gap-2 flex-wrap lowercase">
              <span>все товары</span>
              {selectedCategory !== 'все товары' && (
                <>
                  <span className="text-neutral-400 font-normal">
                    / {selectedCategory}
                  </span>
                  {selectedSubcategory && (
                    <span className="text-[#2f4a35] font-semibold">
                      / {selectedSubcategory}
                    </span>
                  )}
                </>
              )}
            </h1>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const focal = product.imageFocalPoint || { x: 50, y: 50, zoom: 1.3 };
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col justify-between shadow-2xs hover:border-neutral-400 hover:shadow-lg transition-[border-color,box-shadow] duration-300 group"
                  >
                    {/* Top Image Container with badge */}
                    <div
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="w-full aspect-[4/3] bg-[#f8f9f8] relative overflow-hidden flex items-center justify-center cursor-pointer"
                    >
                      {/* Badge e.g. -20% */}
                      {(product.discount || product.badge) && (
                        <span className="absolute top-3 left-3 bg-[#2f4a35] text-white text-[11px] font-normal px-2.5 py-1 rounded-xs z-10">
                          {product.discount || product.badge}
                        </span>
                      )}

                      {/* Out of stock marker */}
                      {!product.inStock && (
                        <>
                          <span className="absolute top-3 right-3 bg-neutral-900/90 text-white text-[11px] font-normal px-2.5 py-1 rounded-xs z-10 lowercase">
                            нет в наличии
                          </span>
                          <div className="absolute inset-0 bg-white/50 z-[5]" />
                        </>
                      )}

                      <img
                        src={product.image}
                        alt={product.title}
                        loading="lazy"
                        className={`w-full h-full object-cover filter drop-shadow-xs transition-transform duration-300 ease-out group-hover:scale-105 ${!product.inStock ? 'grayscale opacity-60' : ''}`}
                        style={{
                          objectPosition: `${focal.x}% ${focal.y}%`,
                        }}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    {/* Product Name */}
                    <div
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="text-center text-sm sm:text-base font-normal text-black cursor-pointer hover:text-[#2f4a35] transition-colors lowercase"
                    >
                      {product.title}
                    </div>

                    {/* Price Row */}
                    <div className="text-center flex items-center justify-center space-x-2 text-xs sm:text-sm font-normal">
                      <span className="text-neutral-900 font-normal">
                        {product.price} RUB
                      </span>
                      {product.oldPrice && (
                        <span className="line-through text-neutral-400 text-xs">
                          {product.oldPrice} RUB
                        </span>
                      )}
                    </div>

                    {/* Add to Cart / Stepper Control */}
                    {(() => {
                      const cardColor =
                        product.color ||
                        (product.availableColors && product.availableColors[0]) ||
                        'олива';
                      const cartItem = cartItems.find(
                        (item) =>
                          item.product.id === product.id &&
                          (item.selectedColor === cardColor ||
                            (!item.selectedColor && (item.product.color || 'олива') === cardColor))
                      );
                      const quantityInCart = cartItem ? cartItem.quantity : 0;

                      if (quantityInCart > 0) {
                        return (
                          <div className="w-full py-1.5 px-3 border border-[#2f4a35] text-neutral-800 bg-white flex items-center justify-between text-xs font-normal">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (quantityInCart <= 1) {
                                  removeItem(product.id, cardColor);
                                } else {
                                  updateQuantity(product.id, quantityInCart - 1, cardColor);
                                }
                              }}
                              className="w-7 h-7 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer rounded-xs"
                              aria-label="Уменьшить количество"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                            <span className="font-bold text-black select-none text-xs">
                              {quantityInCart}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, quantityInCart + 1, cardColor);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer rounded-xs"
                              aria-label="Увеличить количество"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2]" />
                            </button>
                          </div>
                        );
                      }

                      if (!product.inStock) {
                        return (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 px-4 border border-neutral-200 text-neutral-400 bg-neutral-100 text-xs font-normal text-center lowercase cursor-not-allowed"
                          >
                            нет в наличии
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product as Product, cardColor);
                          }}
                          className="w-full py-2.5 px-4 border border-neutral-800 text-neutral-800 hover:bg-[#2f4a35] hover:text-white hover:border-[#2f4a35] text-xs font-normal transition-colors cursor-pointer text-center lowercase"
                        >
                          добавить в корзину
                        </button>
                      );
                    })()}

                  </div>

                </div>
              );
            })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-neutral-500 text-sm">
                Товары по выбранным фильтрам не найдены.
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
