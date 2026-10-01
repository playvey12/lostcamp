import React from 'react';
import { UserOrder, UserProfile } from '../../types';
import { tacticalOperator } from '../../assets/images';

interface ProfileOrdersProps {
  userOrders: UserOrder[];
  user: any;
  onNavigateToCatalog: () => void;
  handleCreateDemoOrder?: () => void;
}

export const ProfileOrders: React.FC<ProfileOrdersProps> = ({
  userOrders,
  user,
  onNavigateToCatalog,
}) => {
  return (
    <div className="space-y-6">
      {/* OPTION A: WHEN NO ORDERS */}
      {userOrders.length === 0 ? (
        <div className="space-y-4">
          <div
            className="relative rounded-2xl overflow-hidden bg-cover bg-center min-h-[340px] sm:min-h-[400px] p-8 flex flex-col justify-between text-white shadow-md border border-neutral-200"
            style={{ backgroundImage: `url(${tacticalOperator})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lowercase">
                перейти к покупкам?
              </h2>
            </div>

            <div className="relative z-10 flex justify-end">
              <button
                onClick={onNavigateToCatalog}
                className="text-lg sm:text-xl font-bold tracking-tight hover:underline flex items-center gap-2 cursor-pointer transition-transform hover:translate-x-1"
              >
                <span>в каталог</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* OPTION B: WHEN ORDERS EXIST */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-lg font-bold text-black lowercase tracking-tight">
              ваши заказы ({userOrders.length})
            </h2>
            <button
              onClick={onNavigateToCatalog}
              className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs py-2 px-4 font-normal transition-colors cursor-pointer rounded-xs"
            >
              в каталог →
            </button>
          </div>

          <div className="space-y-6">
            {userOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4 shadow-2xs"
              >
                {/* Order Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm text-black font-mono">
                      Заказ #{order.id}
                    </span>
                    <span className="text-xs text-neutral-400">
                      от {order.date}
                    </span>
                  </div>

                  <span className="bg-[#2f4a35] text-white text-[11px] font-semibold uppercase px-3 py-1 rounded-xs">
                    {order.status}
                  </span>
                </div>

                {/* Order Items List */}
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-[#f0f2f1] rounded-lg overflow-hidden shrink-0 p-1 flex items-center justify-center border border-neutral-200">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 text-xs space-y-1">
                        <p className="font-normal text-black text-sm lowercase">
                          {item.title}
                        </p>
                        {item.selectedColor && (
                          <p className="text-neutral-500">
                            Цвет: <span className="text-black">{item.selectedColor}</span>
                          </p>
                        )}
                        <p className="text-neutral-500">
                          {item.quantity} шт. x {item.price} RUB
                        </p>
                      </div>
                      <div className="text-sm font-bold text-black">
                        {item.price * item.quantity} RUB
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="border-t border-neutral-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-neutral-500">
                    Адрес доставки: <span className="text-black font-normal">{order.address || user?.address || 'СДЭК ПВЗ'}</span>
                  </div>
                  <div className="text-sm font-bold text-black">
                    Итого: <span className="text-base">{order.total} RUB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
