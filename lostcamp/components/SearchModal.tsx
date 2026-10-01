import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CatalogProduct } from '../../server/data/products';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: CatalogProduct[];
  onSelectProduct?: (productId: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredProducts = useMemo(() => {
    const normQuery = query.trim().toLowerCase();
    if (!normQuery) {
      return [];
    }

    return products.filter((p) => {
      const title = p.title ? p.title.toLowerCase() : '';
      const desc = p.description ? p.description.toLowerCase() : '';
      const cat = p.category ? p.category.toLowerCase() : '';

      // Check if any word starts with normQuery or if field contains normQuery
      const wordsMatch = (text: string) => {
        if (!text) return false;
        if (text.includes(normQuery)) return true;
        const words = text.split(/[\s,.-]+/);
        return words.some((w) => w.startsWith(normQuery));
      };

      return wordsMatch(title) || wordsMatch(desc) || wordsMatch(cat) || p.id.toString() === normQuery;
    });
  }, [products, query]);

  if (!isOpen) return null;

  const handleProductClick = (productId: number) => {
    onClose();
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else {
      navigate(`/product/${productId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 transition-opacity" />

      {/* Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white shadow-2xl z-10 p-6 space-y-6 rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div className="flex items-center space-x-3 flex-1 pr-2">
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск экипировки, подсумков, кобуры..."
              className="w-full text-base font-normal text-black placeholder-neutral-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer transition-colors"
                title="Очистить"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Популярные запросы:
          </p>
          <div className="flex flex-wrap gap-2">
            {['Glock 17', 'Плитник', 'Подсумок', 'FRAME', 'Разгрузка'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-800 transition-colors cursor-pointer rounded-xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Products Search Results (only shown when user has typed a query) */}
        {query.trim().length > 0 && (
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-medium border-b border-neutral-100 pb-2">
              <span>Результаты поиска ({filteredProducts.length})</span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex items-center justify-between p-3 bg-neutral-50/60 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors border border-neutral-100 group"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 bg-white rounded border border-neutral-200/60 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-black group-hover:text-[#2f4a35] transition-colors truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-neutral-400 capitalize">
                          {product.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-sm font-semibold text-black">
                        {product.price} RUB
                      </span>
                      {product.oldPrice && (
                        <span className="block text-[11px] text-neutral-400 line-through">
                          {product.oldPrice} RUB
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-neutral-500 text-sm font-normal">
                  Товары не найдены
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

