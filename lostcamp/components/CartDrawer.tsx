import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, delta: number, selectedColor?: string) => void;
  onRemoveItem: (productId: number, selectedColor?: string) => void;
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
  onGoToCatalog?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  isLoggedIn = false,
  onOpenAuth,
  onGoToCatalog,
}) => {
  const navigate = useNavigate();

  const handleProductClick = (productId: number) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const rawTotal = cartItems.reduce(
    (sum, item) => sum + (item?.product?.price || 0) * (item?.quantity || 1),
    0
  );

  const rawOldTotal = cartItems.reduce(
    (sum, item) =>
      sum + (item?.product?.oldPrice || item?.product?.price || 0) * (item?.quantity || 1),
    0
  );


  const handleGoToCheckout = () => {
    onClose();
    navigate('/checkout');
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 pt-16 sm:pt-20">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Floating Cart Card (Exact 1-in-1 replica of design mockup) */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[460px] bg-white rounded-[24px] shadow-2xl border border-neutral-100 flex flex-col z-10 font-sans p-6 sm:p-7 max-h-[90vh] overflow-hidden"
          >
            {/* Header Row */}
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-2xl font-normal tracking-tight text-black font-sans">
                ваша корзина
              </h2>

              <div className="flex items-center space-x-3">
                {!isLoggedIn && (
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="px-3.5 py-1.5 bg-[#2d4334] hover:bg-[#213227] text-white text-xs font-semibold rounded-md uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    войти
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-black transition-colors p-1 cursor-pointer"
                  title="Закрыть"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Total Price Bar */}
            <div className="pt-2 pb-4">
              <div className="flex justify-between items-baseline text-base sm:text-lg font-normal text-black mb-1.5">
                <span>итого:</span>
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-black">
                    {rawTotal > 0 ? `${rawTotal.toLocaleString('ru-RU')} RUB` : '0 RUB'}
                  </span>
                  {rawOldTotal > rawTotal && (
                    <span className="text-xs text-neutral-400 line-through">
                      {rawOldTotal.toLocaleString('ru-RU')} RUB
                    </span>
                  )}
                </div>
              </div>
              {/* Light horizontal bar */}
              <div className="w-full h-[3px] bg-[#e0e0e0] rounded-full" />
            </div>

            {/* Main Content */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm font-medium text-neutral-500">
                  Ваша корзина пока пуста
                </p>
                <button
                  onClick={() => {
                    onClose();
                    if (onGoToCatalog) {
                      onGoToCatalog();
                    }
                  }}
                  className="px-5 py-2 bg-[#2d4334] text-white text-xs font-semibold rounded-lg hover:bg-[#213227] transition-colors cursor-pointer"
                >
                  перейти в каталог
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 my-2">
                <AnimatePresence initial={false}>
                  {cartItems.map(({ product, quantity, selectedColor }) => {
                    if (!product) return null;
                    const itemColor =
                      selectedColor || product.color || 'окончательная скидка';

                    const lineTotal = (product.price || 0) * quantity;
                    const lineOldTotal =
                      (product.oldPrice || product.price || 0) * quantity;

                    return (
                      <motion.div
                        key={`${product.id}-${selectedColor || ''}`}
                        layout
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: -40, scale: 0.9, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex items-start justify-between space-x-3 pt-1 overflow-hidden"
                      >
                        {/* Left: Square Thumbnail (Clickable) */}
                        <div
                          onClick={() => handleProductClick(product.id)}
                          className="w-20 h-20 sm:w-22 sm:h-22 bg-[#dedede] rounded-none shrink-0 overflow-hidden flex items-center justify-center relative cursor-pointer hover:opacity-90 transition-opacity"
                          title="Открыть карточку товара"
                        >
                          <img
                            src={product.image}
                            alt={product.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                        </div>

                        {/* Middle: Details & Quantity Box */}
                        <div className="flex-1 min-w-0 space-y-1.5 self-stretch flex flex-col justify-between">
                          <div>
                            <h4
                              onClick={() => handleProductClick(product.id)}
                              className="text-sm sm:text-base font-bold text-black leading-tight truncate cursor-pointer hover:underline"
                              title="Открыть карточку товара"
                            >
                              {product.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 font-light lowercase">
                              {itemColor}
                            </p>
                          </div>

                          {/* Quantity Control Box */}
                          <div className="flex items-center space-x-3 pt-1">
                            <div className="inline-flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden text-xs sm:text-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(product.id, -1, selectedColor);
                                }}
                                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
                                aria-label="Уменьшить количество"
                              >
                                <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2]" />
                              </button>
                              <span className="w-9 sm:w-8 text-center font-bold text-black select-none text-sm">
                                {quantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(product.id, 1, selectedColor);
                                }}
                                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 transition-colors cursor-pointer"
                                aria-label="Увеличить количество"
                              >
                                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2]" />
                              </button>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(product.id, selectedColor);
                              }}
                              className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-500 hover:text-red-600 active:bg-red-100 transition-colors cursor-pointer shrink-0"
                              title="Удалить из корзины"
                              aria-label="Удалить из корзины"
                            >
                              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[1.8]" />
                            </button>
                          </div>
                        </div>

                        {/* Right: Item Price */}
                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-sm sm:text-base font-normal text-black tracking-tight">
                            {lineTotal.toLocaleString('ru-RU')} RUB
                          </div>
                          {lineOldTotal > lineTotal && (
                            <div className="text-xs text-neutral-400 line-through">
                              {lineOldTotal.toLocaleString('ru-RU')} RUB
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Bottom Checkout Button */}
            {cartItems.length > 0 && (
              <div className="pt-4 mt-2 border-t border-neutral-100">
                <button
                  onClick={handleGoToCheckout}
                  className="w-full py-3.5 bg-[#2d4334] hover:bg-[#213227] text-white text-sm sm:text-base font-medium rounded-lg transition-all cursor-pointer shadow-xs active:scale-[0.99] text-center"
                >
                  продолжить оформление
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
