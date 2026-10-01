import React, { useState } from 'react';
import { Layers, Plus, Trash2, X } from 'lucide-react';
import { CategoryItem } from '../../types';
import { categoryService } from '../../services/categoryService';

interface AdminCategoriesProps {
  categories?: CategoryItem[];
  categoriesList?: CategoryItem[];
  onUpdateCategories?: (categories: CategoryItem[]) => void;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
  showToast: (msg: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  categoriesList: categoriesListProp,
  onUpdateCategories,
  onDeleteCategory,
  showToast,
}) => {
  const categoriesList = categories || categoriesListProp || [];
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newCatSubItems, setNewCatSubItems] = useState('');
  const [inlineSubInputs, setInlineSubInputs] = useState<Record<string, string>>({});
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    const generatedId = newCatId.trim()
      ? newCatId.trim().toLowerCase()
      : newCatTitle.trim().toLowerCase().replace(/\s+/g, '-');

    if (categoriesList.some((c) => c.categoryId === generatedId)) {
      alert('Категория с таким ID уже существует!');
      return;
    }

    const parsedSubItems = newCatSubItems
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newCategory: CategoryItem = {
      title: newCatTitle.trim(),
      categoryId: generatedId,
      items: parsedSubItems,
    };

    if (onUpdateCategories) {
      onUpdateCategories([...categoriesList, newCategory]);
    }
    showToast(`Категория «${newCategory.title}» успешно создана`);
    setNewCatTitle('');
    setNewCatId('');
    setNewCatSubItems('');
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete.categoryId || categoryToDelete.title;
    const title = categoryToDelete.title;

    setIsDeleting(true);
    try {
      if (onDeleteCategory) {
        await onDeleteCategory(catId);
      } else {
        const updated = await categoryService.deleteCategory(catId);
        if (onUpdateCategories) {
          onUpdateCategories(updated);
        }
      }
      showToast(`Категория «${title}» удалена`);
      setCategoryToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении категории');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSubItemToExisting = (categoryId: string) => {
    const text = (inlineSubInputs[categoryId] || '').trim();
    if (!text) return;

    const updated = categoriesList.map((cat) => {
      if (cat.categoryId === categoryId) {
        const existingItems = cat.items || [];
        if (existingItems.includes(text)) return cat;
        return {
          ...cat,
          items: [...existingItems, text],
        };
      }
      return cat;
    });

    onUpdateCategories(updated);
    setInlineSubInputs({ ...inlineSubInputs, [categoryId]: '' });
    showToast(`Подкатегория «${text}» добавлена`);
  };

  const handleRemoveSubItemFromExisting = (categoryId: string, subItemName: string) => {
    const updated = categoriesList.map((cat) => {
      if (cat.categoryId === categoryId) {
        return {
          ...cat,
          items: (cat.items || []).filter((item) => item !== subItemName),
        };
      }
      return cat;
    });

    onUpdateCategories(updated);
    showToast(`Подкатегория «${subItemName}» удалена`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Creation Banner */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#2e4733] text-emerald-400 rounded-xl border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono text-white uppercase">
              Управление категориями и подкатегориями
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Создавайте новые категории для каталога и добавляйте подкатегории для выпадающего меню.
            </p>
          </div>
        </div>

        {/* New Category Form */}
        <form onSubmit={handleCreateCategory} className="pt-2 border-t border-neutral-700/80 space-y-3 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 mb-1 font-bold">
                Название категории *
              </label>
              <input
                type="text"
                required
                value={newCatTitle}
                onChange={(e) => setNewCatTitle(e.target.value)}
                placeholder="Например: Шлемы и Защита"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">
                ID Категории (необязательно)
              </label>
              <input
                type="text"
                value={newCatId}
                onChange={(e) => setNewCatId(e.target.value)}
                placeholder="shlemy (по умолчанию из названия)"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">
                Подкатегории (через запятую)
              </label>
              <input
                type="text"
                value={newCatSubItems}
                onChange={(e) => setNewCatSubItems(e.target.value)}
                placeholder="безухие, купол, каверы"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2e4733] hover:bg-[#233827] text-white rounded-lg font-bold transition-all shadow-md cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Создать категорию</span>
            </button>
          </div>
        </form>
      </div>

      {/* Categories Grid */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Существующие категории каталога ({categoriesList.length}):
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat) => (
            <div
              key={cat.categoryId}
              className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm capitalize">
                      {cat.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      (ID: {cat.categoryId})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(cat)}
                    className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors flex items-center gap-1 text-[11px]"
                    title="Удалить категорию"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>

                {/* Subcategories List */}
                <div className="pt-3 space-y-3 font-mono">
                  <span className="text-xs text-neutral-400 font-bold block">
                    Подкатегории ({(cat.items || []).length}):
                  </span>

                  {(cat.items || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((sub) => (
                        <span
                          key={sub}
                          className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-md flex items-center gap-1.5"
                        >
                          <span className="lowercase">{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubItemFromExisting(cat.categoryId, sub)}
                            className="text-neutral-500 hover:text-red-400 cursor-pointer ml-0.5"
                            title="Удалить подкатегорию"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 italic block">
                      Подкатегории отсутствуют
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Add Subcategory inline */}
              <div className="pt-3 border-t border-neutral-700/60 font-mono">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inlineSubInputs[cat.categoryId] || ''}
                    onChange={(e) =>
                      setInlineSubInputs({
                        ...inlineSubInputs,
                        [cat.categoryId]: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubItemToExisting(cat.categoryId);
                      }
                    }}
                    placeholder="+ Новая подкатегория..."
                    className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubItemToExisting(cat.categoryId)}
                    className="px-3 py-1.5 bg-[#2e4733] hover:bg-[#233827] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 font-mono">
            <div className="flex items-center space-x-3 text-red-400 border-b border-neutral-800 pb-3">
              <div className="p-2 bg-red-950/60 border border-red-800/80 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold uppercase text-white">
                Удаление категории
              </h3>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <p>
                Вы действительно хотите удалить категорию{' '}
                <span className="font-bold text-white uppercase">
                  «{categoryToDelete.title}»
                </span>{' '}
                (ID: {categoryToDelete.categoryId})?
              </p>
              <p className="text-neutral-500 italic">
                Все товары, относящиеся к этой категории, перейдут в категорию «без категории».
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-2"
              >
                {isDeleting ? (
                  <span>Удаление...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить категорию</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
