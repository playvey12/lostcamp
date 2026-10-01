import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuthStore } from '../store/useAuthStore';
import { DeliveryForm } from './checkout/DeliveryForm';
import { LKProfile, DeliveryFormData, DeliveryCompany, DeliveryType } from '../types/delivery';
import { UserOrder } from '../types';
import { PICKUP_ADDRESS } from '../data/deliveryData';
import { paymentService } from '../services/paymentService';

const COMPANY_LABEL: Record<DeliveryCompany, string> = {
  post: 'Почта России',
  cdek: 'СДЭК',
  yandex: 'Яндекс Доставка',
  pickup: 'Самовывоз',
};

function buildAddressString(data: DeliveryFormData): string {
  const companyLabel = COMPANY_LABEL[data.company];
  if (data.company === 'pickup') {
    return `${companyLabel}, ${PICKUP_ADDRESS}`;
  }
  if (data.deliveryType === 'pvz') {
    const pvzPart = data.pvzAddress ? `, ПВЗ: ${data.pvzAddress}` : '';
    return `${companyLabel} (до пункта выдачи)${pvzPart}, г. ${data.city}`.trim();
  }
  const parts = [`г. ${data.city}`, data.street, data.house ? `д. ${data.house}` : ''];
  if (data.apartment) parts.push(`кв. ${data.apartment}`);
  if (data.postalCode) parts.push(`индекс ${data.postalCode}`);
  if (data.floor) parts.push(`этаж ${data.floor}`);
  if (data.entrance) parts.push(`подъезд ${data.entrance}`);
  return `${companyLabel} (курьер до двери), ${parts.filter(Boolean).join(', ')}`;
}

// Plain address only — no carrier/delivery-method label — used for the
// user's profile "адрес" field, which should just show where they live/pick
// up, not the delivery method (that lives on the order record instead).
function buildPlainAddress(data: DeliveryFormData): string {
  if (data.company === 'pickup') {
    return PICKUP_ADDRESS;
  }
  if (data.deliveryType === 'pvz') {
    return data.pvzAddress ? data.pvzAddress : `г. ${data.city}`;
  }
  const parts = [`г. ${data.city}`, data.street, data.house ? `д. ${data.house}` : ''];
  if (data.apartment) parts.push(`кв. ${data.apartment}`);
  if (data.postalCode) parts.push(`индекс ${data.postalCode}`);
  if (data.floor) parts.push(`этаж ${data.floor}`);
  if (data.entrance) parts.push(`подъезд ${data.entrance}`);
  return parts.filter(Boolean).join(', ');
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, createOrder, showToast, handleNavigate } = useShop();
  const { user, isAuthenticated, updateProfile } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<UserOrder | null>(null);

  const totalSum = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  // Build the LK profile the form autofills from — real account data, not mocks.
  const lkProfile: LKProfile = useMemo(() => {
    const saved = user?.deliveryInfo || {};
    return {
      fullName:
        saved.fullName ||
        `${user?.lastName || ''} ${user?.firstName || ''}`.trim() ||
        '',
      phone: saved.phone || '',
      email: saved.email || user?.email || '',
      city: saved.city || '',
      street: saved.street || '',
      house: saved.house || '',
      apartment: saved.apartment || '',
      postalCode: saved.postalCode || '',
      floor: saved.floor || '',
      entrance: saved.entrance || '',
      pvzId: saved.pvzId || '',
      pvzAddress: saved.pvzAddress || '',
    };
  }, [user]);

  const initialCompany: DeliveryCompany = (user?.deliveryInfo?.company as DeliveryCompany) || 'post';
  const initialType: DeliveryType = (user?.deliveryInfo?.deliveryType as DeliveryType) || 'pvz';

  const handleOrderSubmit = async (data: DeliveryFormData) => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newOrderData: Partial<UserOrder> = {
        id: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: 'В обработке',
        total: totalSum,
        address: buildAddressString(data),
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        deliveryMethod:
          data.company === 'pickup'
            ? COMPANY_LABEL[data.company]
            : `${COMPANY_LABEL[data.company]} — ${data.deliveryType === 'pvz' ? 'до пункта выдачи' : 'до двери'}`,
        comment: data.comment || '',
        items: cartItems.map((item) => ({
          id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          selectedColor: item.selectedColor || 'мультикам',
        })),
      };

      await createOrder(newOrderData);

      // Remember this delivery choice on the account so next checkout prefills it.
      if (isAuthenticated) {
        await updateProfile({
          address: buildPlainAddress(data),
          deliveryInfo: {
            company: data.company,
            deliveryType: data.deliveryType,
            city: data.city,
            street: data.street,
            house: data.house,
            apartment: data.apartment,
            postalCode: data.postalCode,
            floor: data.floor,
            entrance: data.entrance,
            pvzId: data.pvzId,
            pvzAddress: data.pvzAddress,
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
          },
        });
      }

      clearCart();

      // Send the customer to YooKassa to pay. The order itself is already
      // saved at this point, so if payment setup fails for any reason we
      // still show the normal "order placed" screen instead of losing the
      // order — the admin can then follow up on payment manually.
      try {
        const { confirmationUrl } = await paymentService.createPayment(newOrderData.id as string);
        if (confirmationUrl) {
          window.location.href = confirmationUrl;
          return;
        }
      } catch (paymentError) {
        console.error('Failed to start YooKassa payment:', paymentError);
      }

      setCompletedOrder(newOrderData as UserOrder);
      showToast('Заказ оформлен и сохранен в базе сервера!');
    } catch (e) {
      console.error('Failed to submit order:', e);
      setSubmitError('Не удалось оформить заказ. Проверьте соединение и попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-[2px] p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Заказ №{completedOrder.id} оформлен</h2>
          <p className="text-sm text-neutral-500">{completedOrder.deliveryMethod}</p>
          <p className="text-xs text-neutral-400">{completedOrder.address}</p>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => handleNavigate('catalog')}
              className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-semibold rounded-[2px] transition-colors"
            >
              в каталог
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 py-2.5 bg-[#2d4334] hover:bg-[#213227] text-white text-sm font-semibold rounded-[2px] transition-colors"
            >
              мои заказы
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300" />
          <p className="text-sm text-neutral-500">Ваша корзина пуста — сначала добавьте товары.</p>
          <button
            onClick={() => handleNavigate('catalog')}
            className="px-5 py-2 bg-[#2d4334] text-white text-xs font-semibold rounded-lg hover:bg-[#213227] transition-colors"
          >
            перейти в каталог
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1 text-center">Оформление доставки</h1>
      <p className="text-xs text-neutral-500 text-center mb-6">
        Итого к оплате: <strong>{totalSum.toLocaleString('ru-RU')} RUB</strong>
      </p>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[2px]">
          {submitError}
        </div>
      )}

      <div className="bg-white border border-neutral-300 rounded-[2px] shadow-sm overflow-hidden relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#2f4a35]/30 border-t-[#2f4a35] rounded-full animate-spin" />
          </div>
        )}
        <DeliveryForm
          initialCompany={initialCompany}
          initialType={initialType}
          lkProfile={lkProfile}
          onOrderSubmit={handleOrderSubmit}
        />
      </div>
    </div>
  );
};

export default CheckoutPage;
