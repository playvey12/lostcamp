import React from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { CatalogProduct } from '../../../server/data/products';
import { UserOrder } from '../../types';

interface AdminStatsProps {
  products: CatalogProduct[];
  orders: UserOrder[];
  onGoToOrders?: () => void;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  products,
  orders,
  onGoToOrders,
}) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  const totalProductsCount = safeProducts.length;
  const inStockProductsCount = safeProducts.filter((p) => p.inStock).length;
  const outOfStockProductsCount = totalProductsCount - inStockProductsCount;

  // Completed Orders (status === 'Доставлен')
  const completedOrders = safeOrders.filter((o) => o.status === 'Доставлен');
  const activeOrders = safeOrders.filter((o) => o.status !== 'Доставлен');

  // Total Revenue from Completed Orders
  const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Total Potential Revenue (all orders)
  const totalAllOrdersRevenue = safeOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Average Order Value for Completed Orders
  const avgCompletedOrderValue =
    completedOrders.length > 0
      ? Math.round(completedRevenue / completedOrders.length)
      : 0;

  // Category counts
  const categoryCounts = safeProducts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Всего товаров на сайте */}
        <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Всего товаров на сайте
            </span>
            <div className="p-2.5 bg-neutral-700/50 rounded-xl text-emerald-400 border border-neutral-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {totalProductsCount}
            </div>
            <p className="text-xs text-neutral-400 mt-2 font-mono flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">● {inStockProductsCount} в наличии</span>
              <span className="text-neutral-500">|</span>
              <span className="text-amber-400 font-semibold">{outOfStockProductsCount} нет в наличии</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Выручка с выполненных заказов */}
        <div className="bg-neutral-800/80 border border-emerald-900/50 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Выручка с выполненных
            </span>
            <div className="p-2.5 bg-emerald-950/80 rounded-xl text-emerald-400 border border-emerald-700/50">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {completedRevenue.toLocaleString('ru-RU')} RUB
            </div>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              Сумма всех завершенных заказов (статус «Доставлен»)
            </p>
          </div>
        </div>

        {/* KPI 3: Заказов в ожидании */}
        <div className="bg-neutral-800/80 border border-amber-900/50 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-32 h-32 text-amber-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Заказов в ожидании
            </span>
            <div className="p-2.5 bg-amber-950/80 rounded-xl text-amber-400 border border-amber-700/50">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              {activeOrders.length}
            </div>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              Активные заказы в обработке и доставке
            </p>
          </div>
        </div>

        {/* KPI 4: Выполнено заказов */}
        <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Выполнено заказов
            </span>
            <div className="p-2.5 bg-neutral-700/50 rounded-xl text-emerald-400 border border-neutral-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {completedOrders.length}
            </div>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              Успешно доставленные клиентам
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial & Order Summary Box */}
        <div className="lg:col-span-7 bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Финансовая аналитика
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              За всё время
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-900/80 border border-neutral-700/60 rounded-xl">
              <p className="text-xs text-neutral-400 font-mono">Средний чек (выполненные)</p>
              <p className="text-xl font-bold text-white font-mono mt-1">
                {avgCompletedOrderValue.toLocaleString('ru-RU')} RUB
              </p>
            </div>

            <div className="p-4 bg-neutral-900/80 border border-neutral-700/60 rounded-xl">
              <p className="text-xs text-neutral-400 font-mono">Общий объём всех заказов</p>
              <p className="text-xl font-bold text-white font-mono mt-1">
                {totalAllOrdersRevenue.toLocaleString('ru-RU')} RUB
              </p>
            </div>
          </div>

          {/* Status Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300">Процент выполнения заказов</span>
              <span className="text-emerald-400 font-bold">
                {orders.length > 0
                  ? `${Math.round((completedOrders.length / orders.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden flex border border-neutral-700">
              <div
                style={{
                  width: `${
                    orders.length > 0
                      ? (completedOrders.length / orders.length) * 100
                      : 0
                  }%`,
                }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title="Доставлено"
              />
              <div
                style={{
                  width: `${
                    orders.length > 0
                      ? (activeOrders.length / orders.length) * 100
                      : 0
                  }%`,
                }}
                className="bg-amber-500 h-full transition-all duration-500"
                title="В ожидании"
              />
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
                Выполнено ({completedOrders.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block" />
                В обработке ({activeOrders.length})
              </span>
            </div>
          </div>
        </div>

        {/* Products by Category Distribution Box */}
        <div className="lg:col-span-5 bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Товары по категориям
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              {Object.keys(categoryCounts).length} категорий
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(categoryCounts).map(([catName, countVal]) => {
              const count = Number(countVal);
              const percentage = totalProductsCount > 0 ? Math.round((count / totalProductsCount) * 100) : 0;
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-200 capitalize">{catName}</span>
                    <span className="text-neutral-400">{count} шт ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-700/50">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="bg-[#2e4733] h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Orders Overview Table */}
      <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-700/80 pb-4">
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            Последние зарегистрированные заказы
          </h3>
          {onGoToOrders && (
            <button
              onClick={onGoToOrders}
              className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Перейти ко всем заказам</span>
              <span>→</span>
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-neutral-400 font-mono py-4 text-center">
            Пока нет оформленных заказов.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-neutral-300">
              <thead className="bg-neutral-900/80 text-neutral-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">№ Заказа</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Позиций</th>
                  <th className="p-3">Сумма</th>
                  <th className="p-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/60">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-700/30">
                    <td className="p-3 font-bold text-white">{order.id}</td>
                    <td className="p-3 text-neutral-400">{order.date}</td>
                    <td className="p-3">{order.items.length} товаров</td>
                    <td className="p-3 font-bold text-emerald-400">
                      {order.total.toLocaleString('ru-RU')} RUB
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-xs text-[10px] font-bold ${
                          order.status === 'Доставлен'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
