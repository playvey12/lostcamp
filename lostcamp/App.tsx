import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { Product, CartItem, UserProfile, UserOrder } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { PopularProducts } from './components/PopularProducts';
import { CategoryBar } from './components/CategoryBar';
import { AdvantagesSection } from './components/AdvantagesSection';
import { NewsCards } from './components/NewsCards';
import { FrameSection } from './components/FrameSection';
import { SpecialOffers } from './components/SpecialOffers';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { AdminAuthModal } from './components/AdminAuthModal';

const AdminPage = React.lazy(() =>
  import('./components/AdminPage').then((m) => ({ default: m.AdminPage }))
);

import { AboutPage } from './components/AboutPage';
import { FaqPage } from './components/FaqPage';
import { NewsPage } from './components/NewsPage';
import { DeliveryPage } from './components/DeliveryPage';
import { CheckoutPage } from './components/CheckoutPage';
import { ContactsPage } from './components/ContactsPage';
import { ProfilePage } from './components/ProfilePage';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MaintenancePage } from './components/MaintenancePage';

import { ShopProvider, useShop } from './context/ShopContext';
import { useAuthStore } from './store/useAuthStore';

// Remembers how far down the page the user scrolled for each history entry,
// so pressing "back" returns them to that spot instead of jumping to the top
// (e.g. back from a product card to the exact place in the catalog/homepage).
const scrollPositions: Record<string, number> = {};

function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoringKeyRef = useRef<string | null>(null);

  // Let the app own scroll restoration instead of the browser (which can
  // otherwise race with our own restore below on back/forward navigation).
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Continuously remember the scroll position for the CURRENT history entry
  // while the user scrolls, so it's available if they navigate away and back.
  useEffect(() => {
    const key = location.key;
    const handleScroll = () => {
      // Ignore scroll events fired while we're programmatically restoring.
      if (restoringKeyRef.current === key) return;
      scrollPositions[key] = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  useEffect(() => {
    if (navigationType === 'POP') {
      const savedY = scrollPositions[location.key];
      if (typeof savedY === 'number') {
        restoringKeyRef.current = location.key;
        // Content (products, etc.) may still be finishing its render, so retry
        // the restore over a short window until the page has settled.
        const attempts = [0, 30, 80, 150, 300];
        attempts.forEach((delay) => {
          window.setTimeout(() => {
            window.scrollTo(0, savedY);
            if (delay === attempts[attempts.length - 1]) {
              restoringKeyRef.current = null;
            }
          }, delay);
        });
        return;
      }
    }
    // New navigation (clicked a link/banner/card) — start at the top.
    window.scrollTo(0, 0);
  }, [location.key, navigationType]);

  return null;
}

function ProductDetailRouteWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading, addToCart, handleNavigate } = useShop();

  const product = products.find((p) => String(p.id) === String(id));

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-neutral-500">
        <div className="w-8 h-8 border-4 border-[#2f4a35]/30 border-t-[#2f4a35] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/catalog" replace />;
  }

  return (
    <ProductDetailPage
      key={product.id}
      product={product}
      onBackToCatalog={() => navigate(-1)}
      onAddToCart={(prod, col) => addToCart(prod, 1, col)}
      onNavigateHome={() => handleNavigate('home')}
    />
  );
}

function MainAppContent() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, []);

  const {
    products,
    categories,
    orders,
    heroVideoUrl,
    videoHistory,
    frameProductId,
    frameSectionContent,
    popularProductIds,
    updatePopularProductIds,
    promoProductIds,
    updatePromoProductIds,
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    activePage,
    setActivePage,
    previousPage,
    handleNavigate,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    handleSelectCategoryFromDropdown,
    isSearchOpen,
    setIsSearchOpen,
    isAuthOpen,
    setIsAuthOpen,
    isAdminAuthOpen,
    setIsAdminAuthOpen,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    isContactsOpen,
    setIsContactsOpen,
    isCatalogOpen,
    setIsCatalogOpen,
    toastMessage,
    showToast,
    updateCategories,
    deleteCategory,
    updateProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrders,
    createOrder,
    deleteOrder,
    updateHeroVideoUrl,
    updateVideoHistory,
    updateFrameProductId,
    updateFrameSectionContent,
    heroBannerConfig,
    heroBannerTemplates,
    updateHeroBannerConfig,
    updateHeroBannerTemplates,
  } = useShop();

  const [isAgeVerified, setIsAgeVerified] = useState(false);

  // Helper for adding simple product from components
  const handleAddToCart = (product: Product, selectedColor?: string) => {
    addToCart(product, 1, selectedColor || product.color || 'олива');
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);



  return (
    <>
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col selection:bg-[#2e4733] selection:text-white">
      <ScrollToTop />
      {/* Navigation Header */}
      {activePage !== 'admin' && (
        <Header
         cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          activePage={activePage}
          setActivePage={(page) => handleNavigate(page)}
          isContactsOpen={isContactsOpen} 
          onToggleContacts={() => {
            setIsCatalogOpen(false);
            setIsContactsOpen(!isContactsOpen);
          }}
          onCloseContacts={() => setIsContactsOpen(false)}
          isCatalogOpen={isCatalogOpen}
          onToggleCatalog={() => {
            setIsContactsOpen(false);
            setIsCatalogOpen(!isCatalogOpen);
          }}
          onCloseCatalog={() => setIsCatalogOpen(false)}
          onSelectCategory={handleSelectCategoryFromDropdown}
          categories={categories}
        />
      )}

      {/* Main Content View */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroBanner />
                <PopularProducts onAddToCart={handleAddToCart} />
                <CategoryBar
                 selectedCategory={selectedCategory}
                  categories={categories}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory(undefined);
                    handleNavigate(cat === 'все товары' ? 'catalog' : `catalog/${encodeURIComponent(cat)}`);
                  }}
                />
                <AdvantagesSection />
                <NewsCards />
                <FrameSection
                  onAddToCart={handleAddToCart}
                  videoUrl={heroVideoUrl}
                  frameProductId={frameProductId}
                  products={products}
                  content={frameSectionContent}
                />
                <SpecialOffers
                  onAddToCart={handleAddToCart}
                  onViewAllPromos={() => {
                    setSelectedCategory('акции');
                    setSelectedSubcategory(undefined);
                    handleNavigate(`catalog/${encodeURIComponent('акции')}`);
                  }}
                />
              </>
            }
          />
          <Route
            path="/catalog"
            element={
              <CatalogPage
                products={products}
                categoriesData={categories}
                onAddToCart={handleAddToCart}
                selectedCategoryProp={selectedCategory}
                selectedSubcategoryProp={selectedSubcategory}
                onNavigateHome={() => handleNavigate('home')}
              />
            }
          />
          <Route
            path="/catalog/:categoryId"
            element={
              <CatalogPage
                products={products}
                categoriesData={categories}
                onAddToCart={handleAddToCart}
                selectedCategoryProp={selectedCategory}
                selectedSubcategoryProp={selectedSubcategory}
                onNavigateHome={() => handleNavigate('home')}
              />
            }
          />
          <Route path="/product/:id" element={<ProductDetailRouteWrapper />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsPage />} />
          <Route
            path="/terms"
            element={<TermsPage onClose={() => handleNavigate(previousPage || 'home')} />}
          />
          <Route
            path="/privacy"
            element={<PrivacyPolicyPage onClose={() => handleNavigate(previousPage || 'home')} />}
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                orders={orders}
                onNavigateToCatalog={() => handleNavigate('catalog')}
                onAddOrder={(newOrder) => createOrder(newOrder)}
                onNavigateToTerms={() => handleNavigate('terms')}
                onNavigateToPrivacy={() => handleNavigate('privacy')}
              />
            }
          />
          <Route
            path="/lostcampadmin"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6 text-white font-mono">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold tracking-wider uppercase text-emerald-400">
                      Загрузка админ-панели...
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">LOST CAMP ADMIN SYSTEM</p>
                  </div>
                }
              >
                <AdminPage
                  products={products}
                  orders={orders}
                  categories={categories}
                  onUpdateCategories={updateCategories}
                  onDeleteCategory={deleteCategory}
                  onUpdateProducts={updateProducts}
                  onAddProduct={addProduct}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  onUpdateOrders={updateOrders}
                  onDeleteOrder={deleteOrder}
                  onExitAdmin={() => handleNavigate('home')}
                  showToast={showToast}
                  heroVideoUrl={heroVideoUrl}
                  onUpdateHeroVideo={updateHeroVideoUrl}
                  videoHistory={videoHistory}
                  onUpdateVideoHistory={updateVideoHistory}
                  frameProductId={frameProductId}
                  onUpdateFrameProductId={updateFrameProductId}
                  popularProductIds={popularProductIds}
                  onUpdatePopularProductIds={updatePopularProductIds}
                  promoProductIds={promoProductIds}
                  onUpdatePromoProductIds={updatePromoProductIds}
                  frameSectionContent={frameSectionContent}
                  onUpdateFrameSectionContent={updateFrameSectionContent}
                  heroBannerConfig={heroBannerConfig}
                  heroBannerTemplates={heroBannerTemplates}
                  onUpdateHeroBannerConfig={updateHeroBannerConfig}
                  onUpdateHeroBannerTemplates={updateHeroBannerTemplates}
                />
              </Suspense>
            }
          />
          <Route path="/admin" element={<Navigate to="/lostcampadmin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {activePage !== 'admin' && (
      <Footer onNavClick={(page) => handleNavigate(page)} />
      )}

      {/* Cart Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(productId, delta, selectedColor) => {
          const index = cartItems.findIndex(
            (item) =>
              item.product.id === productId &&
              (selectedColor === undefined ||
                item.selectedColor === selectedColor ||
                (!item.selectedColor && (item.product.color || 'олива') === selectedColor))
          );
          if (index > -1) {
            updateCartQuantity(index, cartItems[index].quantity + delta);
          }
        }}
        onRemoveItem={(productId, selectedColor) => {
          const index = cartItems.findIndex(
            (item) =>
              item.product.id === productId &&
              (selectedColor === undefined ||
                item.selectedColor === selectedColor ||
                (!item.selectedColor && (item.product.color || 'олива') === selectedColor))
          );
          if (index > -1) {
            removeFromCart(index);
          }
        }}

        isLoggedIn={isAuthenticated}
        onOpenAuth={() => setIsAuthOpen(true)}
        onGoToCatalog={() => {
          setIsCartOpen(false);
          handleNavigate('catalog');
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
      />

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setIsAdminAuthOpen(false);
          handleNavigate('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast('Доступ к админ-панели разрешен!');
        }}
      />

      {/* Auth / Account Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenRegister={() => {
          setIsAuthOpen(false);
          handleNavigate('profile');
        }}
        showToast={showToast}
      />

      {/* 18+ Age Verification Modal */}
      {!isAuthenticated && !isAgeVerified && (
        <AgeVerificationModal onConfirm={() => setIsAgeVerified(true)} />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2e4733] text-white text-xs font-semibold px-5 py-3 shadow-xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
    </>
  );
}

const PREVIEW_ACCESS_KEY = import.meta.env.VITE_PREVIEW_ACCESS_KEY || '';

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const storageKey = 'lostcamp_preview_access';
    const params = new URLSearchParams(window.location.search);
    const access = params.get('preview');

    // A special preview link grants access and persists it for this browser.
    if (PREVIEW_ACCESS_KEY && access === PREVIEW_ACCESS_KEY) {
      localStorage.setItem(storageKey, '1');
      params.delete('preview');
      const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', cleanUrl);
      setHasAccess(true);
      return;
    }

    setHasAccess(localStorage.getItem(storageKey) === '1');
  }, []);

  if (!hasAccess) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <MaintenanceGate>
      <ErrorBoundary>
        <ShopProvider>
          <MainAppContent />
        </ShopProvider>
      </ErrorBoundary>
    </MaintenanceGate>
  );
}
