import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LostCampLogo } from './LostCampLogo';
import { ContactsDropdown } from './ContactsDropdown';
import { CatalogDropdown } from './CatalogDropdown';

import { CategoryItem } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  isContactsOpen: boolean;
  onToggleContacts: () => void;
  onCloseContacts: () => void;
  isCatalogOpen: boolean;
  onToggleCatalog: () => void;
  onCloseCatalog: () => void;
  onSelectCategory: (category: string, subcategory?: string) => void;
  categories?: CategoryItem[];
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenSearch,
  activePage,
  setActivePage,
  isContactsOpen,
  onToggleContacts,
  onCloseContacts,
  isCatalogOpen,
  onToggleCatalog,
  onCloseCatalog,
  onSelectCategory,
  categories,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        if (isCatalogOpen) onCloseCatalog();
        if (isContactsOpen) onCloseContacts();
      }
    };

    if (isCatalogOpen || isContactsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCatalogOpen, isContactsOpen, onCloseCatalog, onCloseContacts]);

  const navItems = [
    { id: 'catalog', label: 'каталог' },
    { id: 'about', label: 'о нас' },
    { id: 'delivery', label: 'доставка и оплата' },
    { id: 'contacts', label: 'контакты' },
    { id: 'faq', label: 'FAQ' },
    { id: 'news', label: 'новости' },
  ];

  return (
    <>
      {/* Semi-transparent backdrop when Catalog or Contacts dropdown is open */}
      <AnimatePresence>
        {(isCatalogOpen || isContactsOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (isCatalogOpen) onCloseCatalog();
              if (isContactsOpen) onCloseContacts();
            }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-30 cursor-pointer"
          />
        )}
      </AnimatePresence>

      <header ref={headerRef} className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <button
            onClick={() => {
              if (isContactsOpen) onToggleContacts();
              if (isCatalogOpen) onToggleCatalog();
              setActivePage('home');
            }}
            className="flex items-center text-left group cursor-pointer focus:outline-none"
            title="На главную"
          >
            <LostCampLogo className="h-10 sm:h-12 w-auto" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => {
              if (item.id === 'catalog') {
                return (
                  <button
                    key={item.id}
                    onClick={onToggleCatalog}
                    className={`text-sm transition-all cursor-pointer ${
                      isCatalogOpen
                        ? 'bg-[#181818] text-white px-3 py-1.5 rounded-sm font-medium'
                        : activePage === item.id && !isContactsOpen
                        ? 'text-black font-semibold border-b-2 border-black pb-1'
                        : 'text-neutral-700 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              }

              if (item.id === 'contacts') {
                return (
                  <button
                    key={item.id}
                    onClick={onToggleContacts}
                    className={`text-sm transition-all cursor-pointer ${
                      isContactsOpen
                        ? 'bg-[#181818] text-white px-3 py-1.5 rounded-sm font-medium'
                        : activePage === item.id && !isCatalogOpen
                        ? 'text-black font-semibold border-b-2 border-black pb-1'
                        : 'text-neutral-700 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isContactsOpen) onToggleContacts();
                    if (isCatalogOpen) onToggleCatalog();
                    setActivePage(item.id);
                  }}
                  className={`text-sm transition-all cursor-pointer font-normal ${
                    activePage === item.id && !isContactsOpen && !isCatalogOpen
                      ? 'text-black font-semibold border-b-2 border-black pb-1'
                      : 'text-neutral-700 hover:text-black'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-5">
            <button
              onClick={onOpenSearch}
              className="p-2 text-neutral-800 hover:text-black transition-colors cursor-pointer"
              title="Поиск"
              aria-label="Поиск"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </button>

            <button
              onClick={() => {
                if (isContactsOpen) onToggleContacts();
                if (isCatalogOpen) onToggleCatalog();
                setActivePage('profile');
              }}
              className={`p-2 transition-colors cursor-pointer ${
                activePage === 'profile' ? 'text-black font-bold' : 'text-neutral-800 hover:text-black'
              }`}
              title="Личный кабинет"
              aria-label="Личный кабинет"
            >
              <User className="w-5 h-5 stroke-[1.8]" />
            </button>

            <button
              onClick={onOpenCart}
              className="p-2 text-neutral-800 hover:text-black transition-colors relative cursor-pointer"
              title="Корзина"
              aria-label="Корзина"
            >
              <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2e4733] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-800 cursor-pointer"
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Dropdown Panel */}
      <CatalogDropdown
        isOpen={isCatalogOpen}
        onClose={onCloseCatalog}
        onSelectCategory={onSelectCategory}
        categories={categories}
      />

      {/* Contacts Dropdown Panel */}
      <ContactsDropdown
        isOpen={isContactsOpen}
        onClose={onCloseContacts}
      />

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'catalog') {
                  onToggleCatalog();
                } else if (item.id === 'contacts') {
                  onToggleContacts();
                } else {
                  if (isContactsOpen) onToggleContacts();
                  if (isCatalogOpen) onToggleCatalog();
                  setActivePage(item.id);
                }
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 text-base font-normal ${
                (item.id === 'contacts' && isContactsOpen) || (item.id === 'catalog' && isCatalogOpen)
                  ? 'text-[#2e4733] font-bold'
                  : activePage === item.id
                  ? 'text-black font-bold'
                  : 'text-neutral-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              if (isContactsOpen) onToggleContacts();
              if (isCatalogOpen) onToggleCatalog();
              setActivePage('profile');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-base font-semibold text-[#2e4733]"
          >
            личный кабинет
          </button>
        </div>
      )}
    </header>
  </>
  );
};
