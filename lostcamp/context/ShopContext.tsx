import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CatalogProduct } from '../../server/data/products';
import { CategoryItem, UserOrder, VideoHistoryItem, CartItem, Product } from '../types';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { siteService, FrameSectionContent, HeroBannerConfig, HeroBannerTemplate } from '../services/siteService';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

export const DEFAULT_FRAME_SECTION_CONTENT: FrameSectionContent = {
  badgeText: 'Экзоскелетная рама второго поколения',
  heading: 'LOST CAMP FRAME',
  description: 'Инновационная анатомическая рама из полимерного композита для транспортировки сверхтяжёлых снаряжений и спецсредств',
  videoOverlayLabel: 'LOST CAMP FRAME • В ПОЛЕВЫХ УСЛОВИЯХ',
  videoOverlayTitle: 'Тактическая разгрузочная платформа',
  featuresHeading: 'Характеристики LOST CAMP FRAME',
  featuresSubheading: 'Ключевые преимущества конструкции:',
  features: [
    {
      title: 'Высокая функциональность',
      text: 'Множество унифицированных точек крепления MOLLE / PALS для моментальной фиксации подсумок, миномётных плит и спецгрузов.',
    },
    {
      title: 'Регулируемая анатомическая геометрия',
      text: 'Переносит до 2/3 веса груза с плеч на подвздошные кости бёдер, снижая утомляемость при длительных переходах.',
    },
    {
      title: 'Совместимость с плитниками',
      text: 'Сочетается с любыми современными бронежилетами и плитоносцами без нарушения эргономики.',
    },
    {
      title: 'Ударопрочные композиты',
      text: 'Высокопрочный полимерный каркас с сотовой структурой и ткань «КОНДОР» высокой плотности для экстремальных нагрузок.',
    },
  ],
  ctaText: 'Повысьте эффективность и выносливость при выполнении боевых задач с LOST CAMP FRAME!',
};

export const DEFAULT_HERO_BANNER_CONFIG: HeroBannerConfig = {
  badgeText: 'LOST CAMP • TACTICAL GEAR',
  title: 'Снаряжение для специальных задач',
  description:
    'Модульные плитники, разгрузочные системы и подсумки из Cordura 1000D. Собственное производство, надежность в любых условиях.',
  imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1920&q=80',
  buttonText: 'Перейти в каталог',
  buttonLink: '/catalog',
  features: [
    '10+ лет опыта в сфере',
    'собственное производство',
    'индивидуальный подход',
    'строгий контроль качества',
  ],
};

interface ShopContextType {
  // Data State
  products: CatalogProduct[];
  categories: CategoryItem[];
  orders: UserOrder[];
  heroVideoUrl: string;
  videoHistory: VideoHistoryItem[];
  frameProductId: number | null;
  frameSectionContent: FrameSectionContent;
  popularProductIds: number[];
  updatePopularProductIds: (ids: number[]) => Promise<void>;
  promoProductIds: number[];
  updatePromoProductIds: (ids: number[]) => Promise<void>;
  heroBannerConfig: HeroBannerConfig;
  heroBannerTemplates: HeroBannerTemplate[];
  loading: boolean;
  error: string | null;

  // Cart State (delegated to useCartStore)
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product | CatalogProduct, quantity?: number, selectedColor?: string) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (productId: number, quantity: number, selectedColor?: string) => void;
  removeItem: (productId: number, selectedColor?: string) => void;
  clearCart: () => void;

  // Navigation & Modals
  activePage: string;
  setActivePage: (page: string) => void;
  previousPage: string;
  handleNavigate: (newPage: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedSubcategory?: string;
  setSelectedSubcategory: (subcat?: string) => void;
  handleSelectCategoryFromDropdown: (category: string, subcategory?: string) => void;
  
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isAdminAuthOpen: boolean;
  setIsAdminAuthOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;
  isContactsOpen: boolean;
  setIsContactsOpen: (open: boolean) => void;
  isCatalogOpen: boolean;
  setIsCatalogOpen: (open: boolean) => void;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Admin / Data Mutators (connected to backend)
  updateCategories: (newCategories: CategoryItem[]) => Promise<void>;
  createCategory: (newCategory: CategoryItem) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  updateProducts: (newProducts: CatalogProduct[]) => Promise<void>;
  addProduct: (product: Partial<CatalogProduct>) => Promise<void>;
  updateProduct: (id: number, product: Partial<CatalogProduct>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;

  updateOrders: (newOrders: UserOrder[]) => Promise<void>;
  createOrder: (order: Partial<UserOrder>) => Promise<UserOrder[] | void>;
  updateOrder: (id: string, orderData: Partial<UserOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  updateHeroVideoUrl: (url: string) => Promise<void>;
  updateVideoHistory: (history: VideoHistoryItem[]) => Promise<void>;
  updateFrameProductId: (productId: number | null) => Promise<void>;
  updateFrameSectionContent: (content: FrameSectionContent) => Promise<void>;
  updateHeroBannerConfig: (config: HeroBannerConfig) => Promise<void>;
  updateHeroBannerTemplates: (templates: HeroBannerTemplate[]) => Promise<void>;
  refreshData: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>('');
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [frameProductId, setFrameProductId] = useState<number | null>(null);
  const [popularProductIds, setPopularProductIds] = useState<number[]>([]);
  const [promoProductIds, setPromoProductIds] = useState<number[]>([]);
  const [frameSectionContent, setFrameSectionContent] = useState<FrameSectionContent>(DEFAULT_FRAME_SECTION_CONTENT);
  const [heroBannerConfig, setHeroBannerConfig] = useState<HeroBannerConfig>(DEFAULT_HERO_BANNER_CONFIG);
  const [heroBannerTemplates, setHeroBannerTemplates] = useState<HeroBannerTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cart from Zustand
  const { cart: cartItems, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth from Zustand
  const { isAdmin: isAdminAuthenticated, checkAuth } = useAuthStore();

  // Modals & Navigation
  const navigate = useNavigate();
  const location = useLocation();

  const getPageFromPath = (path: string): string => {
    const clean = path.toLowerCase().split('?')[0].split('#')[0];
    if (clean === '/' || clean === '') return 'home';
    if (clean === '/lostcampadmin' || clean === '/admin') return 'admin';
    return clean.startsWith('/') ? clean.substring(1) : clean;
  };

  const activePage = getPageFromPath(location.pathname);
  const [previousPage, setPreviousPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('все товары');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const setIsAdminAuthenticated = (auth: boolean) => {
    if (!auth) {
      useAuthStore.getState().logout();
    }
  };

  const handleNavigate = async (newPage: string) => {
    setIsContactsOpen(false);
    setIsCatalogOpen(false);
    const cleanPage = newPage.startsWith('/') ? newPage.substring(1) : newPage;
    if (cleanPage === 'catalog') {
      setSelectedCategory('все товары');
      setSelectedSubcategory(undefined);
    }
    if (newPage === 'admin') {
      const isAlreadyAdmin = useAuthStore.getState().isAdmin;
      if (!isAlreadyAdmin) {
        const isVerifiedAdmin = await useAuthStore.getState().verifyAdmin();
        if (!isVerifiedAdmin) {
          setIsAdminAuthOpen(true);
          return;
        }
      }
    }
    if (activePage !== 'terms' && activePage !== 'privacy') {
      setPreviousPage(activePage);
    }
    const targetPath = newPage === 'home' ? '/' : newPage === 'admin' ? '/lostcampadmin' : newPage.startsWith('/') ? newPage : `/${newPage}`;
    navigate(targetPath);
    window.scrollTo(0, 0);
  };

  const setActivePage = (page: string) => {
    handleNavigate(page);
  };

  const handleSelectCategoryFromDropdown = (category: string, subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setIsCatalogOpen(false);
    setIsContactsOpen(false);
    if (category === 'все товары') {
      handleNavigate('catalog');
    } else {
      handleNavigate(`catalog/${encodeURIComponent(category)}`);
    }
  };

  // Cart Functions using Zustand
  const addToCart = (product: Product | CatalogProduct, quantity = 1, selectedColor?: string) => {
    const colorToUse =
      selectedColor ||
      product.color ||
      (product.availableColors && product.availableColors[0]) ||
      'олива';
    addItem(product, quantity, colorToUse);
    showToast(`Товар «${product.title}» добавлен в корзину!`);
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    const item = cartItems[index];
    if (item) {
      updateQuantity(item.product.id, quantity, item.selectedColor);
    }
  };

  const removeFromCart = (index: number) => {
    const item = cartItems[index];
    if (item) {
      removeItem(item.product.id, item.selectedColor);
    }
  };

  // Fetch all initial data from backend API
  const refreshData = async () => {
    setLoading(true);
    try {
      const [fetchedCategories, fetchedProducts, siteConfig] = await Promise.all([
        categoryService.fetchCategories(),
        productService.fetchProducts(),
        siteService.fetchSiteConfig(),
      ]);

      setCategories(Array.isArray(fetchedCategories) ? fetchedCategories : []);
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
      setHeroVideoUrl(siteConfig.heroVideoUrl || '');
      setVideoHistory(siteConfig.videoHistory || []);
      setFrameProductId(siteConfig.frameProductId ?? null);
      setPopularProductIds(Array.isArray(siteConfig.popularProductIds) ? siteConfig.popularProductIds : []);
      setPromoProductIds(Array.isArray(siteConfig.promoProductIds) ? siteConfig.promoProductIds : []);
      if (siteConfig.frameSectionContent) {
        setFrameSectionContent(siteConfig.frameSectionContent);
      } else {
        setFrameSectionContent(DEFAULT_FRAME_SECTION_CONTENT);
      }
      if (siteConfig.heroBannerConfig) {
        setHeroBannerConfig(siteConfig.heroBannerConfig);
      } else {
        setHeroBannerConfig(DEFAULT_HERO_BANNER_CONFIG);
      }
      setHeroBannerTemplates(
        Array.isArray(siteConfig.heroBannerTemplates) ? siteConfig.heroBannerTemplates : []
      );
      setError(null);

      if (isAdminAuthenticated) {
        try {
          const fetchedOrders = await orderService.fetchOrders();
          setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
        } catch (err) {
          console.error('Failed to load admin orders:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to load backend data:', err);
      setError(err.message || 'Error loading backend data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (activePage === 'admin' && useAuthStore.getState().isAdmin) {
        // Уже подтверждённый админ (например, только что успешно вошли) —
        // не делаем повторный /me запрос, который может затереть isAdmin гонкой.
        return;
      }
      await checkAuth();
      if (activePage === 'admin' && !useAuthStore.getState().isAdmin) {
        const isVerified = await useAuthStore.getState().verifyAdmin();
        if (!isVerified) {
          setIsAdminAuthOpen(true);
          navigate('/');
        }
      }
    };
    init();
    refreshData();
  }, [location.pathname]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      orderService
        .fetchOrders()
        .then((fetchedOrders) => setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []))
        .catch((err) => console.error('Failed to fetch admin orders:', err));
    }
  }, [isAdminAuthenticated]);

  // Category Mutators
  const updateCategories = async (newCategories: CategoryItem[]) => {
    setCategories(newCategories);
    try {
      const updated = await categoryService.saveCategories(newCategories);
      setCategories(updated);
    } catch (err) {
      console.error('Failed to save categories:', err);
      refreshData();
      throw err;
    }
  };

  const createCategory = async (newCategory: CategoryItem) => {
    setCategories((prev) => [...prev, newCategory]);
    try {
      const updated = await categoryService.createCategory(newCategory);
      setCategories(updated);
    } catch (err) {
      console.error('Failed to create category:', err);
      refreshData();
      throw err;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    const norm = categoryId.trim().toLowerCase();
    const targetCat = categories.find(
      (c) => c.categoryId?.trim().toLowerCase() === norm || c.title?.trim().toLowerCase() === norm
    );
    const targetTitleNorm = targetCat?.title?.trim().toLowerCase();

    setCategories((prev) =>
      prev.filter(
        (c) =>
          c.categoryId !== categoryId &&
          c.categoryId?.trim().toLowerCase() !== norm &&
          c.title?.trim().toLowerCase() !== norm
      )
    );

    setProducts((prev) =>
      prev.map((p) => {
        const pCatNorm = p.category?.trim().toLowerCase();
        if (pCatNorm === norm || (targetTitleNorm && pCatNorm === targetTitleNorm)) {
          return { ...p, category: 'без категории' };
        }
        return p;
      })
    );

    try {
      const updated = await categoryService.deleteCategory(categoryId);
      setCategories(updated);
      const freshProducts = await productService.fetchProducts();
      setProducts(freshProducts);
    } catch (err) {
      console.error('Failed to delete category:', err);
      refreshData();
      throw err;
    }
  };

  // Product Mutators
  const updateProducts = async (newProducts: CatalogProduct[]) => {
    setProducts(newProducts);
    try {
      const updated = await productService.saveProducts(newProducts);
      setProducts(updated);
    } catch (err) {
      console.error('Failed to save products:', err);
      refreshData();
      throw err;
    }
  };

  const addProduct = async (product: Partial<CatalogProduct>) => {
    const tempId = product.id || Date.now();
    const optimisticNew: CatalogProduct = {
      id: tempId,
      title: product.title || 'Новый товар',
      price: product.price || 0,
      oldPrice: product.oldPrice,
      discount: product.discount,
      badge: product.badge,
      image: product.image || '',
      galleryImages: product.galleryImages || [product.image || ''],
      category: product.category || 'без категории',
      color: product.color || 'олива',
      availableColors: product.availableColors || ['олива', 'мох', 'мультикам'],
      colorImages: product.colorImages || {},
      inStock: product.inStock !== undefined ? product.inStock : true,
      description: product.description || '',
      reviews: [],
    };
    setProducts((prev) => [optimisticNew, ...prev]);

    try {
      const created = await productService.addProduct(product);
      setProducts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
    } catch (err) {
      console.error('Failed to add product:', err);
      refreshData();
      throw err;
    }
  };

  const updateProduct = async (id: number, product: Partial<CatalogProduct>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? ({ ...p, ...product } as CatalogProduct) : p))
    );
    try {
      const updated = await productService.updateProduct(id, product);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to update product:', err);
      refreshData();
      throw err;
    }
  };

  const deleteProduct = async (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await productService.deleteProduct(id);
    } catch (err) {
      console.error('Failed to delete product:', err);
      refreshData();
      throw err;
    }
  };

  // Order Mutators
  const updateOrders = async (newOrders: UserOrder[]) => {
    const updated = await orderService.saveOrders(newOrders);
    setOrders(updated);
  };

  const createOrder = async (order: Partial<UserOrder>) => {
    const updated = await orderService.createOrder(order);
    setOrders(updated);
    return updated;
  };

  const updateOrder = async (id: string, orderData: Partial<UserOrder>) => {
    const updated = await orderService.updateOrder(id, orderData);
    setOrders(updated);
  };

  const deleteOrder = async (id: string) => {
    const updated = await orderService.deleteOrder(id);
    setOrders(updated);
  };

  // Site Config Mutators
  const updateHeroVideoUrl = async (url: string) => {
    setHeroVideoUrl(url);
    const updated = await siteService.updateSiteConfig({
      heroVideoUrl: url,
      videoHistory,
      frameProductId,
      frameSectionContent,
    });
    setHeroVideoUrl(updated.heroVideoUrl);
  };

  const updateVideoHistory = async (history: VideoHistoryItem[]) => {
    setVideoHistory(history);
    const updated = await siteService.updateSiteConfig({
      heroVideoUrl,
      videoHistory: history,
      frameProductId,
      frameSectionContent,
    });
    setVideoHistory(updated.videoHistory);
  };

  const updateFrameProductId = async (productId: number | null) => {
    setFrameProductId(productId);
    const updated = await siteService.updateSiteConfig({
      heroVideoUrl,
      videoHistory,
      frameProductId: productId,
      frameSectionContent,
    });
    setFrameProductId(updated.frameProductId ?? null);
  };

  const updatePopularProductIds = async (ids: number[]) => {
    setPopularProductIds(ids);
    const updated = await siteService.updateSiteConfig({
      heroVideoUrl,
      videoHistory,
      frameProductId,
      frameSectionContent,
      popularProductIds: ids,
    });
    setPopularProductIds(Array.isArray(updated.popularProductIds) ? updated.popularProductIds : ids);
  };

  const updatePromoProductIds = async (ids: number[]) => {
    setPromoProductIds(ids);
    const updated = await siteService.updateSiteConfig({
      heroVideoUrl,
      videoHistory,
      frameProductId,
      frameSectionContent,
      promoProductIds: ids,
    });
    setPromoProductIds(Array.isArray(updated.promoProductIds) ? updated.promoProductIds : ids);
  };

  const updateFrameSectionContent = async (content: FrameSectionContent) => {
    setFrameSectionContent(content);
    const updated = await siteService.updateSiteConfig({
      heroVideoUrl,
      videoHistory,
      frameProductId,
      frameSectionContent: content,
    });
    if (updated.frameSectionContent) {
      setFrameSectionContent(updated.frameSectionContent);
    }
  };

  const updateHeroBannerConfig = async (config: HeroBannerConfig) => {
    setHeroBannerConfig(config);
    const updated = await siteService.updateSiteConfig({
      heroBannerConfig: config,
    });
    if (updated.heroBannerConfig) {
      setHeroBannerConfig(updated.heroBannerConfig);
    }
  };

  const updateHeroBannerTemplates = async (templates: HeroBannerTemplate[]) => {
    setHeroBannerTemplates(templates);
    const updated = await siteService.updateSiteConfig({
      heroBannerTemplates: templates,
    });
    if (updated.heroBannerTemplates) {
      setHeroBannerTemplates(updated.heroBannerTemplates);
    }
  };

  return (
    <ShopContext.Provider
      value={{
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
        heroBannerConfig,
        heroBannerTemplates,
        loading,
        error,

        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        updateQuantity,
        removeItem,
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
        createCategory,
        deleteCategory,
        updateProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrders,
        createOrder,
        updateOrder,
        deleteOrder,

        updateHeroVideoUrl,
        updateVideoHistory,
        updateFrameProductId,
        updateFrameSectionContent,
        updateHeroBannerConfig,
        updateHeroBannerTemplates,
        refreshData,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};