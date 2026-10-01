import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryItem } from '../types';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories?: CategoryItem[];
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  const navigate = useNavigate();
  const displayCategories = categories && categories.length > 0
    ? [...categories.map((c) => ({ id: c.categoryId, label: c.title })), { id: 'акции', label: 'акции' }]
    : [
        { id: 'кобуры', label: 'кобуры' },
        { id: 'подсумки', label: 'подсумки' },
        { id: 'разгрузки', label: 'разгрузки' },
        { id: 'чехлы', label: 'чехлы' },
        { id: 'плитники', label: 'плитники' },
        { id: 'акции', label: 'акции' },
      ];

  return (
    <div className="w-full bg-[#f0f0f0] border-t border-b border-neutral-200 py-3.5 my-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center sm:justify-around gap-x-8 gap-y-2">
       {displayCategories.map((cat) => (
  <button
    key={cat.id}
    onClick={() => onSelectCategory(cat.id)}
    className="text-sm font-normal transition-colors cursor-pointer capitalize text-neutral-700 hover:text-black"
  >
    {cat.label}
  </button>
))}
      </div>
    </div>
  );
};

