import React, { useState } from 'react';
import {
  Search,
  Eye,
  User,
  Truck,
  AlertCircle,
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { UserOrder } from '../../types';

interface AdminOrdersProps {
  orders: UserOrder[];
  onUpdateOrders: (orders: UserOrder[]) => void;
  onDeleteOrder?: (id: string) => Promise<void>;
  showToast: (msg: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onUpdateOrders,
  onDeleteOrder,
  showToast,
}) => {
  const [ordersViewMode, setOrdersViewMode] = useState<'active' | 'completed'>('active');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<UserOrder | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const availableStatuses = [
    'В обработке',
    'Принят',
    'Оплачен',
    'Собирается',
    'Передан в СДЭК',
    'В пути',
    'Доставлен',
  ];

  const handleOrderStatusChange = (orderId: string, newStatus: string) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    onUpdateOrders(updated);
    showToast(`Статус заказа #${orderId} изменен на «${newStatus}»`);

    if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
      setSelectedOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      if (onDeleteOrder) {
        await onDeleteOrder(id);
      } else {
        const updated = orders.filter((o) => o.id !== id);
        onUpdateOrders(updated);
      }
      showToast(`Заказ №${id} удалён из архива`);
    } catch (err: any) {
      console.error('Error deleting order:', err);
      showToast(err?.message || 'Ошибка при удалении заказа');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const completedOrders = orders.filter((o) => o.status === 'Доставлен');
  const activeOrders = orders.filter((o) => o.status !== 'Доставлен');

  const activeOrdersFiltered = activeOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.address && o.address.toLowerCase().includes(orderSearch.toLowerCase())) ||
      o.items.some((i) => i.title.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  const completedOrdersFiltered = completedOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.address && o.address.toLowerCase().includes(orderSearch.toLowerCase())) ||
      o.items.some((i) => i.title.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Toolbar */}
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* View Switcher: Active vs Completed */}
        <div className="flex items-center bg-neutral-900 p-1 border border-neutral-700 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setOrdersViewMode('active')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              ordersViewMode === 'active'
                ? 'bg-[#2e4733] text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Активные заказы ({activeOrders.length})
          </button>
          <button
            onClick={() => setOrdersViewMode('completed')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              ordersViewMode === 'completed'
                ? 'bg-neutral-800 text-emerald-400 border border-emerald-900 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Доставленные / Архив ({completedOrders.length})
          </button>
        </div>

        {/* Order Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Поиск по ID или адресу..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Note about auto-removal */}
      {ordersViewMode === 'active' && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Обратите внимание:</strong> если перевести статус заказа в положение «Доставлен», он автоматически переходит в архив доставленных и учитывается в выручке!
          </span>
        </div>
      )}

      {/* Orders Grid/List */}
      <div className="space-y-6">
        {(ordersViewMode === 'active' ? activeOrdersFiltered : completedOrdersFiltered).map((order) => (
          <div
            key={order.id}
            className="bg-neutral-800/90 border border-neutral-700/80 rounded-2xl p-6 shadow-xl space-y-6 hover:border-neutral-600 transition-colors"
          >
            {/* Card Top Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-700/80 pb-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold font-mono text-white">
                    Заказ #{order.id}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    от {order.date}
                  </span>
                </div>
                {order.fullName && (
                  <p className="text-xs text-neutral-300 font-mono flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Покупатель: {order.fullName}</span>
                  </p>
                )}
                {order.address && (
                  <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{order.address}</span>
                  </p>
                )}
              </div>

              {/* Actions & Status Selector */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedOrderDetails(order)}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-950 text-emerald-400 border border-emerald-600/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Детали заказа</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-neutral-400 shrink-0">
                    Статус:
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                    className={`px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none cursor-pointer transition-colors ${
                      order.status === 'Доставлен'
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-neutral-900 border-neutral-600 text-amber-300'
                    }`}
                  >
                    {availableStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {ordersViewMode === 'completed' && (
                  <button
                    type="button"
                    onClick={() => setDeletingOrderId(order.id)}
                    className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Удалить из архива"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customer Brief Info Banner */}
            <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block text-[10px]">Телефон:</span>
                <span className="text-neutral-200 font-bold">{order.phone || '+7 (916) 840-22-11'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Доставка:</span>
                <span className="text-neutral-200">{order.deliveryMethod || 'СДЭК До пункта'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Оплата:</span>
                <span className="text-neutral-200">{order.paymentMethod || 'Картой онлайн'}</span>
              </div>
            </div>

            {/* Items list in order */}
            <div className="space-y-3">
              <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                Состав заказа ({order.items.length}):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-700/60"
                  >
                    <div className="w-12 h-12 bg-neutral-800 border border-neutral-700 rounded-lg p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate lowercase">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Цвет: {item.selectedColor || 'олива'} | {item.quantity} шт.
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold font-mono text-emerald-400">
                      {(item.price * item.quantity).toLocaleString('ru-RU')} RUB
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total Bottom Row */}
            <div className="flex items-center justify-between border-t border-neutral-700/80 pt-4 text-xs font-mono">
              <button
                onClick={() => setSelectedOrderDetails(order)}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Посмотреть подробности...</span>
              </button>
              <div className="text-right">
                <span className="text-neutral-400 mr-2">Итоговая стоимость:</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {order.total.toLocaleString('ru-RU')} RUB
                </span>
              </div>
            </div>
          </div>
        ))}

        {(ordersViewMode === 'active' ? activeOrdersFiltered : completedOrdersFiltered).length === 0 && (
          <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-12 text-center text-neutral-400 font-mono text-xs">
            {ordersViewMode === 'active'
              ? 'Нет активных заказов в ожидании.'
              : 'В архиве пока нет доставленных заказов.'}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto font-mono text-xs text-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <span>Заказ #{selectedOrderDetails.id}</span>
                </h3>
                <p className="text-neutral-400 text-[11px]">
                  Оформлен: {selectedOrderDetails.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Delivery Card */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
              <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Информация о клиенте и доставке:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-neutral-300">
                <div>
                  <span className="text-neutral-500 block">ФИО Получателя:</span>
                  <span className="font-bold text-white">{selectedOrderDetails.fullName || 'Иван Иванов'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Контактный телефон:</span>
                  <span className="font-bold text-white">{selectedOrderDetails.phone || '+7 (916) 840-22-11'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Способ доставки:</span>
                  <span className="text-white">{selectedOrderDetails.deliveryMethod || 'СДЭК До пункта выдачи'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Способ оплаты:</span>
                  <span className="text-white">{selectedOrderDetails.paymentMethod || 'Банковской картой онлайн'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral-500 block">Адрес / Пункт назначения:</span>
                  <span className="text-emerald-300 font-bold">{selectedOrderDetails.address || 'Россия, г. Москва, ул. Арбат, 10'}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h4 className="text-neutral-300 font-bold uppercase tracking-wider text-[11px]">
                Список купленных товаров ({selectedOrderDetails.items.length}):
              </h4>
              <div className="space-y-2">
                {selectedOrderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <div className="flex items-center space-x-3">
                      <img src={item.image} alt={item.title} className="w-10 h-10 object-contain rounded bg-neutral-900 p-1" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-white lowercase">{item.title}</p>
                        <p className="text-[10px] text-neutral-400">Цвет: {item.selectedColor || 'олива'} | Количество: {item.quantity} шт.</p>
                      </div>
                    </div>
                    <div className="text-right font-bold text-emerald-400">
                      {(item.price * item.quantity).toLocaleString('ru-RU')} RUB
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Change in Modal */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
              <span className="text-neutral-300 font-bold">Изменить статус заказа:</span>
              <select
                value={selectedOrderDetails.status}
                onChange={(e) => handleOrderStatusChange(selectedOrderDetails.id, e.target.value)}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-emerald-400 font-bold"
              >
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <span className="text-neutral-400 font-bold text-sm">ИТОГО К ОПЛАТЕ:</span>
              <span className="text-xl font-extrabold text-emerald-400">
                {selectedOrderDetails.total.toLocaleString('ru-RU')} RUB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrderId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono">
            <h3 className="text-lg font-bold text-white">
              Подтверждение удаления
            </h3>
            <p className="text-xs text-neutral-300">
              Вы уверены, что хотите удалить заказ №{deletingOrderId} из архива? Это действие нельзя будет отменить.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrderId(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(deletingOrderId)}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
