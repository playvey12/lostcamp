import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryItem } from '../types';

interface CatalogDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string, subcategory?: string) => void;
  categories?: CategoryItem[];
}

export const CatalogDropdown: React.FC<CatalogDropdownProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  categories,
}) => {
  const defaultCatalogData: CategoryItem[] = [
    {
      categoryId: 'подсумки',
      title: 'подсумки',
      items: [
        'под сброс',
        'под магазины',
        'под рацию',
        'утилитарный',
        'под аптечку',
        'прочее',
      ],
    },
    {
      categoryId: 'разгрузки',
      title: 'разгрузки',
      items: ['СТРИЖ', 'БЕРКУТ', 'АК4', 'АК10'],
    },
    {
      categoryId: 'кобуры',
      title: 'кобуры',
      items: ['универсальная', 'для ПМ'],
    },
    {
      categoryId: 'чехлы',
      title: 'чехлы',
      items: [
        'для наручников',
        'для баллончика',
        'для дубинки',
        'для магазина ПМ',
        'для турникета',
      ],
    },
    {
      categoryId: 'плитники',
      title: 'плитники',
      items: ['РУБЕЖ', 'ДОТ-1'],
    },
  ];

  const catalogData = categories && categories.length > 0 ? categories : defaultCatalogData;

  const handleCategoryClick = (category: string, sub?: string) => {
    onSelectCategory(category, sub);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white border-b border-neutral-900 shadow-xl overflow-hidden font-sans z-30 max-h-[85vh] md:max-h-none overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3 mb-5">
              <h3 className="text-base sm:text-lg font-bold text-black tracking-tight font-sans uppercase">
                каталог товаров
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-black bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-md transition-colors cursor-pointer"
                aria-label="Закрыть каталог"
                title="Закрыть каталог"
              >
                <span>закрыть</span>
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Category Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-6 lg:gap-8 items-start">
              {catalogData.map((col) => (
                <div key={col.categoryId} className="space-y-3">
                  {/* Category Title */}
                  <button
                    onClick={() => handleCategoryClick(col.categoryId)}
                    className="text-base sm:text-lg font-bold text-black tracking-tight hover:text-[#2a3d2e] transition-colors text-left block w-full cursor-pointer uppercase font-sans"
                  >
                    {col.title}
                  </button>

                  {/* Subitems */}
                  {col.items && col.items.length > 0 && (
                    <ul className="space-y-2 text-xs sm:text-sm text-neutral-600 font-normal">
                      {col.items.map((item) => (
                        <li key={item}>
                          <button
                            onClick={() => handleCategoryClick(col.categoryId, item)}
                            className="hover:text-black transition-colors cursor-pointer text-left block w-full leading-tight lowercase"
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Horizontal Line Divider */}
            <div className="w-full border-b border-black mt-8 mb-4" />

            {/* Bottom Row: все товары -> */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleCategoryClick('все товары')}
                className="text-sm sm:text-base font-bold text-black hover:text-[#2a3d2e] transition-colors cursor-pointer tracking-tight"
              >
                все товары
              </button>
              <button
                onClick={() => handleCategoryClick('все товары')}
                className="text-black hover:text-[#2a3d2e] transition-colors p-1 cursor-pointer"
                title="Все товары"
              >
                <ArrowRight className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

