import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { specialVest, tacticalBackpack, specialHelmet } from '../assets/images';

interface SpecialOffersProps {
  onAddToCart: (product: Product, selectedColor?: string) => void;
  onViewAllPromos: () => void;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({
  onAddToCart,
  onViewAllPromos,
}) => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, products: allProducts, promoProductIds } = useShop();

  // Fallback list — used only if the admin hasn't selected any promo products yet
  const fallbackOfferProducts: Product[] = [
    {
      id: 601,
      title: 'Комплект Плитник + 4 Подсумка АК',
      price: 16800,
      oldPrice: 22000,
      badge: '-23%',
      image: specialVest,
      description: 'Готовое решение: модульный плитник + 4 подсумка под АК',
    },
    {
      id: 602,
      title: 'Набор Экипировки Скаут Gold',
      price: 24500,
      oldPrice: 32000,
      badge: '-23%',
      image: tacticalBackpack,
      description: 'Рюкзак штурмовой + Разгрузочный пояс + Кавер на шлем',
    },
    {
      id: 302,
      title: 'Тактический шлем БР2 + кавер Мох',
      price: 12900,
      oldPrice: 16000,
      badge: '-19%',
      image: specialHelmet,
      description: 'Безухий шлем с велкро-панелями и кавером',
    },
  ];

  // If the admin has picked products for this block, show those (in the chosen order),
  // otherwise fall back to the built-in default list.
  const offerProducts: Product[] =
    promoProductIds && promoProductIds.length > 0
      ? (promoProductIds
          .map((id) => allProducts.find((p) => p.id === id))
          .filter(Boolean) as Product[])
      : fallbackOfferProducts;

  if (offerProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-black mb-12 tracking-tight">
        воспользуйтесь лучшими предложениями
      </h2>

      {/* Grid of 3 Special Offer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {offerProducts.map((product) => {
          const focal = product.imageFocalPoint || { x: 50, y: 50 };
          return (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            className="group flex flex-col bg-white border border-neutral-200 overflow-hidden hover:border-neutral-400 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl"
          >
            {/* Image Box */}
            <div className="relative w-full aspect-[4/3] bg-[#f5f5f5] overflow-hidden flex items-center justify-center">
              {product.badge && (
                <div className="absolute top-3 left-3 bg-[#2a3d2e] text-white text-xs font-semibold px-2.5 py-1 z-10">
                  {product.badge}
                </div>
              )}

              {/* Out of stock marker */}
              {product.inStock === false && (
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
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out ${product.inStock === false ? 'grayscale opacity-60' : ''}`}
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

            {/* Content Box */}
            <div className="p-5 flex flex-col flex-grow justify-between bg-white space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-normal text-neutral-800 tracking-wide">
                  {product.title}
                </p>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-neutral-900">
                    {product.price.toLocaleString('ru-RU')} RUB
                  </span>
                  {product.oldPrice && (
                    <span className="text-xs font-normal text-neutral-400 line-through">
                      {product.oldPrice.toLocaleString('ru-RU')} RUB
                    </span>
                  )}
                </div>
              </div>

              {/* Button / Stepper */}
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
                    <div className="relative z-20 w-full py-1.5 px-3 border border-neutral-900 bg-white flex items-center justify-between text-xs sm:text-sm font-normal">
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
                      <span className="font-bold text-black select-none text-xs sm:text-sm">
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

                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product, cardColor);
                    }}
                    className="relative z-20 w-full py-2.5 px-4 border border-neutral-300 text-xs sm:text-sm font-normal text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-black transition-colors duration-200 cursor-pointer text-center"
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

      {/* View All Promos Action Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onViewAllPromos}
          className="px-10 py-3.5 border border-black text-sm font-normal text-black hover:bg-black hover:text-white transition-all duration-200 cursor-pointer"
        >
          посмотреть все акции
        </button>
      </div>
    </section>
  );
};
