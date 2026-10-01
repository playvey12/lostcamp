import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import {
  plateCarrier,
  tacticalBelt,
  specialPouch,
  specialGunBag,
} from '../assets/images';

interface PopularProductsProps {
  onAddToCart: (product: Product, selectedColor?: string) => void;
}

export const PopularProducts: React.FC<PopularProductsProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, products: allProducts, popularProductIds } = useShop();

  // Fallback list — used only if the admin hasn't selected any popular products yet
  const fallbackProducts: Product[] = [
    {
      id: 102,
      title: 'Плитник Ракурс М3',
      price: 14500,
      badge: 'hit',
      image: plateCarrier,
      description: 'Облегченный плитник Ракурс М3 с системой быстрого сброса',
    },
    {
      id: 501,
      title: 'Разгрузочный пояс РПС «Тайфун»',
      price: 7800,
      badge: 'hit',
      image: tacticalBelt,
      description: 'Анатомический РПС комплект с 3D-сеткой',
    },
    {
      id: 202,
      title: 'Аптечный подсумок сбросной',
      price: 3600,
      badge: 'hit',
      image: specialPouch,
      description: 'Отрывная медицинская аптечка с велкро-платформой',
    },
    {
      id: 301,
      title: 'Чехол для оружия 120 см',
      price: 8900,
      badge: 'hit',
      image: specialGunBag,
      description: 'Защитный оружейный чехол с уплотнителем EVA',
    },
  ];

  // If the admin has picked products for this block, show those (in the chosen order),
  // otherwise fall back to the built-in default list.
  const products: Product[] =
    popularProductIds && popularProductIds.length > 0
      ? (popularProductIds
          .map((id) => allProducts.find((p) => p.id === id))
          .filter(Boolean) as Product[])
      : fallbackProducts;

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-black mb-12 tracking-tight lowercase">
        популярные товары
      </h2>

      {/* Standard Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const focal = product.imageFocalPoint || { x: 50, y: 50, zoom: 1.3 };
          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="group flex flex-col bg-white border border-neutral-200 overflow-hidden hover:border-neutral-400 hover:shadow-lg transition-[border-color,box-shadow] duration-300 cursor-pointer rounded-xl"
            >
              {/* Image Box */}
              <div className="w-full aspect-[4/3] bg-[#f5f5f5] relative overflow-hidden flex items-center justify-center">
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-3 left-3 bg-[#2a3e2e] text-white text-xs font-medium px-3 py-1 z-10 lowercase">
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
                  className={`w-full h-full object-cover filter drop-shadow-xs transition-transform duration-300 ease-out group-hover:scale-105 ${product.inStock === false ? 'grayscale opacity-60' : ''}`}
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
                <p className="text-sm font-normal text-neutral-800 tracking-wide lowercase">
                  {product.title}
                </p>
                <p className="text-sm font-semibold text-neutral-900">
                  {product.price ? `${product.price.toLocaleString('ru-RU')} RUB` : 'xx RUB'}
                </p>
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

                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product, cardColor);
                    }}
                    className="w-full py-2.5 px-4 border border-neutral-300 text-xs font-normal text-neutral-800 hover:bg-[#2f4a35] hover:text-white hover:border-[#2f4a35] transition-colors duration-200 cursor-pointer text-center lowercase"
                  >
                    в корзину
                  </button>
                );
              })()}
            </div>
          </div>
        );
      })}
      </div>
    </section>
  );
};

