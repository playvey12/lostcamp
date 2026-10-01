import React, { useState } from 'react';
import {
  BarChart3,
  Package,
  ShoppingBag,
  Layers,
  Video,
  Users,
  FileText,
  Image as ImageIcon,
  LogOut,
  Database,
} from 'lucide-react';
import { CatalogProduct } from '../../server/data/products';
import { UserOrder, VideoHistoryItem, CategoryItem } from '../types';
import { FrameSectionContent, HeroBannerConfig, HeroBannerTemplate } from '../services/siteService';
import { AdminStats } from './admin/AdminStats';
import { AdminProducts } from './admin/AdminProducts';
import { AdminOrders } from './admin/AdminOrders';
import { AdminCategories } from './admin/AdminCategories';
import { AdminSiteSettings } from './admin/AdminSiteSettings';
import { AdminUsers } from './admin/AdminUsers';
import { AdminNews } from './admin/AdminNews';
import { AdminHeroBanner } from './admin/AdminHeroBanner';
import { AdminBackup } from './admin/AdminBackup';
import { useShop } from '../context/ShopContext';

interface AdminPageProps {
  products: CatalogProduct[];
  orders: UserOrder[];
  categories?: CategoryItem[];
  onUpdateCategories?: (categories: CategoryItem[]) => void;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
  onUpdateProducts: (products: CatalogProduct[]) => void;
  onAddProduct?: (product: Partial<CatalogProduct>) => Promise<void>;
  onUpdateProduct?: (id: number, product: Partial<CatalogProduct>) => Promise<void>;
  onDeleteProduct?: (id: number) => Promise<void>;
  onUpdateOrders: (orders: UserOrder[]) => void;
  onDeleteOrder?: (id: string) => Promise<void>;
  onExitAdmin: () => void;
  showToast: (msg: string) => void;
  heroVideoUrl?: string;
  onUpdateHeroVideo?: (url: string) => void;
  videoHistory?: VideoHistoryItem[];
  onUpdateVideoHistory?: (history: VideoHistoryItem[]) => void;
  frameProductId?: number | null;
  onUpdateFrameProductId?: (id: number | null) => Promise<void>;
  popularProductIds?: number[];
  onUpdatePopularProductIds?: (ids: number[]) => Promise<void>;
  promoProductIds?: number[];
  onUpdatePromoProductIds?: (ids: number[]) => Promise<void>;
  frameSectionContent?: FrameSectionContent;
  onUpdateFrameSectionContent?: (content: FrameSectionContent) => Promise<void>;
  heroBannerConfig?: HeroBannerConfig;
  heroBannerTemplates?: HeroBannerTemplate[];
  onUpdateHeroBannerConfig?: (config: HeroBannerConfig) => Promise<void>;
  onUpdateHeroBannerTemplates?: (templates: HeroBannerTemplate[]) => Promise<void>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  products,
  orders,
  categories,
  onUpdateCategories,
  onDeleteCategory,
  onUpdateProducts,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrders,
  onDeleteOrder,
  onExitAdmin,
  showToast,
  heroVideoUrl = '',
  onUpdateHeroVideo,
  videoHistory = [],
  onUpdateVideoHistory,
  frameProductId,
  onUpdateFrameProductId,
  popularProductIds,
  onUpdatePopularProductIds,
  promoProductIds,
  onUpdatePromoProductIds,
  frameSectionContent,
  onUpdateFrameSectionContent,
  heroBannerConfig: propHeroBannerConfig,
  heroBannerTemplates: propHeroBannerTemplates,
  onUpdateHeroBannerConfig: propOnUpdateHeroBannerConfig,
  onUpdateHeroBannerTemplates: propOnUpdateHeroBannerTemplates,
}) => {
  const shop = useShop();

  const heroBannerConfig = propHeroBannerConfig || shop?.heroBannerConfig;
  const heroBannerTemplates = propHeroBannerTemplates || shop?.heroBannerTemplates || [];
  const onUpdateHeroBannerConfig = propOnUpdateHeroBannerConfig || shop?.updateHeroBannerConfig;
  const onUpdateHeroBannerTemplates = propOnUpdateHeroBannerTemplates || shop?.updateHeroBannerTemplates;

  const [activeTab, setActiveTab] = useState<
    'stats' | 'products' | 'orders' | 'categories' | 'site' | 'users' | 'news' | 'hero' | 'backup'
  >('stats');

  const activeOrders = orders.filter((o) => o.status !== 'Доставлен');

  return (
    <div className="bg-neutral-900 min-h-screen text-neutral-100 font-sans pb-24">
      {/* Top Admin Header Bar */}
      <header className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#2e4733] flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30 shadow-inner">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold font-mono tracking-wider text-white uppercase">
                  Панель Администратора
                </h1>
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600/40 text-emerald-400 text-[10px] font-mono rounded-full uppercase">
                  ● Онлайн
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                Управление каталогом, заказами и аналитикой магазина
              </p>
            </div>
          </div>

          <button
            onClick={onExitAdmin}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-xs font-mono transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из админки</span>
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 border-t border-neutral-800/80 pt-2 pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Статистика</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>2. Товары ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap relative ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>3. Заказы ({activeOrders.length})</span>
            {activeOrders.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-bold rounded-full">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Категории</span>
          </button>

          <button
            onClick={() => setActiveTab('site')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'site'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>5. Вид сайта</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>6. Пользователи</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'news'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>7. Новости</span>
          </button>

          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'hero'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>8. Hero-баннер</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>9. Резервные копии</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'stats' && (
          <AdminStats products={products} orders={orders} />
        )}

        {activeTab === 'products' && (
          <AdminProducts
            products={products}
            categories={categories}
            onUpdateProducts={onUpdateProducts}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
            showToast={showToast}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrders
            orders={orders}
            onUpdateOrders={onUpdateOrders}
            onDeleteOrder={onDeleteOrder}
            showToast={showToast}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategories
            categories={categories}
            onUpdateCategories={onUpdateCategories}
            onDeleteCategory={onDeleteCategory}
            showToast={showToast}
          />
        )}

        {activeTab === 'site' && (
          <AdminSiteSettings
            heroVideoUrl={heroVideoUrl}
            onUpdateHeroVideo={onUpdateHeroVideo}
            videoHistory={videoHistory}
            onUpdateVideoHistory={onUpdateVideoHistory}
            products={products}
            frameProductId={frameProductId}
            onUpdateFrameProductId={onUpdateFrameProductId}
            popularProductIds={popularProductIds}
            onUpdatePopularProductIds={onUpdatePopularProductIds}
            promoProductIds={promoProductIds}
            onUpdatePromoProductIds={onUpdatePromoProductIds}
            frameSectionContent={frameSectionContent}
            onUpdateFrameSectionContent={onUpdateFrameSectionContent}
            showToast={showToast}
          />
        )}

        {activeTab === 'users' && <AdminUsers showToast={showToast} />}

        {activeTab === 'news' && <AdminNews showToast={showToast} />}

        {activeTab === 'backup' && <AdminBackup showToast={showToast} />}

        {activeTab === 'hero' && (
          <AdminHeroBanner
            heroBannerConfig={
              heroBannerConfig || {
                badgeText: 'LOST CAMP • TACTICAL GEAR',
                title: 'Снаряжение для специальных задач',
                description:
                  'Модульные плитники, разгрузочные системы и подсумки из Cordura 1000D. Собственное производство, надежность в любых условиях.',
                imageUrl:
                  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1920&q=80',
                buttonText: 'Перейти в каталог',
                buttonLink: '/catalog',
                features: [
                  '10+ лет опыта в сфере',
                  'собственное производство',
                  'индивидуальный подход',
                  'строгий контроль качества',
                ],
              }
            }
            heroBannerTemplates={heroBannerTemplates}
            onUpdateHeroBannerConfig={
              onUpdateHeroBannerConfig || (async () => {})
            }
            onUpdateHeroBannerTemplates={
              onUpdateHeroBannerTemplates || (async () => {})
            }
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
};
