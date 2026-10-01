import React, { useState } from 'react';
import { ChevronDown, Send, CheckCircle2, User, ShieldCheck, MapPin, Truck, Store } from 'lucide-react';
import { DeliveryCompany, DeliveryType, DeliveryFormData, LKProfile, PVZPoint } from '../../types/delivery';
import { CompanyVisualLogo } from './CompanyLogos';
import { CompanySelector } from './CompanySelector';
import { AutocompleteInput } from './AutocompleteInput';
import { PVZSelector } from './PVZSelector';
import { deliverySuggestService } from '../../services/deliverySuggestService';
import { PICKUP_ADDRESS } from '../../data/deliveryData';

const EMPTY_LK_PROFILE: LKProfile = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  postalCode: '',
  floor: '',
  entrance: '',
  pvzId: '',
  pvzAddress: '',
};

export interface DeliveryFormProps {
  initialCompany?: DeliveryCompany;
  initialType?: DeliveryType;
  lkProfile?: LKProfile;
  onOrderSubmit?: (data: DeliveryFormData) => void;
  /** If set, forces fixed company & delivery type for showcase/block comparison */
  forcedCompany?: DeliveryCompany;
  forcedType?: DeliveryType;
  /** Title shown above the block (e.g. 'ПОЧТА РФ до пвз') */
  blockTitle?: string;
  isBlockCard?: boolean;
  highlightBorder?: boolean;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  initialCompany = 'post',
  initialType = 'pvz',
  lkProfile = EMPTY_LK_PROFILE,
  onOrderSubmit,
  forcedCompany,
  forcedType,
  blockTitle,
  isBlockCard = false,
  highlightBorder = false,
}) => {
  // State for company & delivery type
  const [selectedCompany, setSelectedCompany] = useState<DeliveryCompany>(
    forcedCompany || initialCompany
  );
  const [selectedType, setSelectedType] = useState<DeliveryType>(
    forcedType || initialType
  );

  // Form values
  const [formData, setFormData] = useState<DeliveryFormData>({
    company: forcedCompany || initialCompany,
    deliveryType: forcedType || initialType,
    city: lkProfile.city || '',
    street: lkProfile.street || '',
    house: lkProfile.house || '',
    apartment: lkProfile.apartment || '',
    postalCode: lkProfile.postalCode || '',
    floor: lkProfile.floor || '',
    entrance: lkProfile.entrance || '',
    email: lkProfile.email || '',
    phone: lkProfile.phone || '',
    fullName: lkProfile.fullName || '',
    pvzId: lkProfile.pvzId || '',
    pvzAddress: lkProfile.pvzAddress || '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Synchronize when forced props change
  React.useEffect(() => {
    if (forcedCompany) setSelectedCompany(forcedCompany);
    if (forcedType) setSelectedType(forcedType);
  }, [forcedCompany, forcedType]);

  const activeCompany = forcedCompany || selectedCompany;
  const activeType = forcedType || selectedType;

  const updateField = (field: keyof DeliveryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectCompany = (comp: DeliveryCompany) => {
    if (forcedCompany) return;
    setSelectedCompany(comp);
    setFormData((prev) => ({ ...prev, company: comp }));
  };

  const handleSelectDeliveryType = (type: DeliveryType) => {
    if (forcedType) return;
    setSelectedType(type);
    setFormData((prev) => ({ ...prev, deliveryType: type }));
    setIsTypeDropdownOpen(false);
  };

  const handleSelectPvz = (pvz: PVZPoint) => {
    setFormData((prev) => ({
      ...prev,
      pvzId: pvz.id,
      pvzAddress: `${pvz.name} (${pvz.address})`,
      city: pvz.city || prev.city,
    }));
  };

  const handleFillFromProfile = () => {
    setFormData((prev) => ({
      ...prev,
      fullName: lkProfile.fullName,
      phone: lkProfile.phone,
      email: lkProfile.email,
      city: lkProfile.city,
      street: lkProfile.street,
      house: lkProfile.house,
      apartment: lkProfile.apartment,
      postalCode: lkProfile.postalCode,
      floor: lkProfile.floor || '',
      entrance: lkProfile.entrance || '',
      pvzId: lkProfile.pvzId || '',
      pvzAddress: lkProfile.pvzAddress || '',
    }));
  };

  const handleClearAddressFields = () => {
    setFormData((prev) => ({
      ...prev,
      city: '',
      street: '',
      house: '',
      apartment: '',
      postalCode: '',
      floor: '',
      entrance: '',
      pvzId: '',
      pvzAddress: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (onOrderSubmit) {
      onOrderSubmit({
        ...formData,
        company: activeCompany,
        deliveryType: activeType,
      });
    }
  };

  return (
    <div
      className={`bg-white transition-all ${
        isBlockCard
          ? `p-6 sm:p-8 rounded-none border ${
              highlightBorder ? 'border-2 border-[#1a73e8] shadow-md' : 'border-neutral-300'
            }`
          : 'max-w-2xl mx-auto p-4 sm:p-8'
      }`}
    >
      {/* Block Title (if present on mockup) */}
      {blockTitle && (
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-6 pb-2 border-b border-neutral-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {blockTitle}
          </span>
          <span className="text-[11px] font-normal text-neutral-500 lowercase">
            {activeType === 'pvz' ? 'до пункта выдачи' : 'курьер до двери'}
          </span>
        </div>
      )}

      {/* Top Banner: confirms auto-fill from the account, or offers it */}
      {!isBlockCard && lkProfile.fullName && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-neutral-700">
            <User className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {lkProfile.city || lkProfile.pvzAddress ? (
                <>
                  Данные подставлены из личного кабинета: <strong className="text-neutral-900">{lkProfile.fullName}</strong>
                </>
              ) : (
                <>
                  Личный кабинет: <strong className="text-neutral-900">{lkProfile.fullName}</strong>
                </>
              )}
            </span>
          </div>
          {lkProfile.city || lkProfile.pvzAddress ? (
            <button
              type="button"
              onClick={handleClearAddressFields}
              className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] shrink-0"
            >
              очистить и ввести вручную
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFillFromProfile}
              className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] shrink-0"
            >
              Автозаполнить всё из ЛК
            </button>
          )}
        </div>
      )}

      {/* Section 1: Choose Delivery Company (triangle logo picker) */}
      <div className="text-center space-y-4 mb-6">
        <h3 className="text-sm sm:text-base font-normal text-neutral-900 tracking-tight">
          выберите способ доставки
        </h3>

        <CompanySelector
          activeCompany={activeCompany}
          onSelect={handleSelectCompany}
          disabled={!!forcedCompany}
        />

        {/* Dropdown Selector: до двери / на пункт выдачи (not applicable to self-pickup) */}
        {activeCompany !== 'pickup' && (
        <div className="relative pt-3 max-w-md mx-auto">
          <div
            id="delivery-type-dropdown-trigger"
            onClick={() => !forcedType && setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className={`w-full h-11 px-4 bg-white border border-neutral-300 flex items-center justify-between text-xs sm:text-sm text-neutral-800 transition-colors ${
              forcedType ? 'cursor-default' : 'cursor-pointer hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {activeType === 'pvz' ? (
                <MapPin className="w-4 h-4 text-neutral-600" />
              ) : (
                <Truck className="w-4 h-4 text-neutral-600" />
              )}
              <span className="font-medium">
                {activeType === 'pvz'
                  ? 'доставка на пункт выдачи (ПВЗ / отделение)'
                  : 'курьерская доставка до двери'}
              </span>
            </div>
            {!forcedType && (
              <ChevronDown
                className={`w-4 h-4 text-neutral-500 transition-transform ${
                  isTypeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>

          {/* Dropdown menu items */}
          {isTypeDropdownOpen && !forcedType && (
            <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-neutral-300 shadow-lg divide-y divide-neutral-100 text-xs sm:text-sm">
              <div
                onClick={() => handleSelectDeliveryType('pvz')}
                className={`p-3 cursor-pointer flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                  activeType === 'pvz' ? 'bg-neutral-100 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>на пункт выдачи (самовывоз из ПВЗ или отделения)</span>
                </div>
                <span className="text-xs text-neutral-500">от 280 ₽</span>
              </div>

              <div
                onClick={() => handleSelectDeliveryType('door')}
                className={`p-3 cursor-pointer flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                  activeType === 'door' ? 'bg-neutral-100 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>до двери (доставка курьером по адресу)</span>
                </div>
                <span className="text-xs text-neutral-500">от 390 ₽</span>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Section 2: Form Fields Title */}
      <div className="text-center my-6">
        <h4 className="text-xs sm:text-sm font-normal text-neutral-900 tracking-tight">
          {activeCompany === 'pickup' ? 'укажите данные для получения' : 'укажите данные для доставки'}
        </h4>
      </div>

      {/* Form Submission */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ========================================================================= */}
        {/* BLOCK 1 & 2: ПОЧТА РОССИИ (до ПВЗ или до двери)                           */}
        {/* ========================================================================= */}
        {activeCompany === 'post' && (
          <div className="space-y-3">
            {/* Row 1: город */}
            <div>
              <AutocompleteInput
                name="city"
                value={formData.city}
                onChange={(val) => updateField('city', val)}
                placeholder="город"
                fieldKey="city"
                fetchSuggestions={deliverySuggestService.suggestCity}
                lkValue={lkProfile.city}
                required
              />
            </div>

            {/* If Post PVZ: pick an отделение from the list, scoped to the chosen city */}
            {activeType === 'pvz' && (
              <div>
                <PVZSelector
                  company="post"
                  selectedCity={formData.city}
                  selectedPvzId={formData.pvzId}
                  onSelectPvz={handleSelectPvz}
                  placeholder="выберите отделение почты"
                />
              </div>
            )}

            {/* Post PVZ needs the отделение's own postal index to route the parcel there */}
            {activeType === 'pvz' && (
              <div>
                <AutocompleteInput
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={(val) => updateField('postalCode', val)}
                  placeholder="индекс отделения"
                  fieldKey="postalCode"
                  lkValue={lkProfile.postalCode}
                  required
                />
              </div>
            )}

            {/* If Post DOOR (до двери) */}
            {activeType === 'door' && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <AutocompleteInput
                    name="street"
                    value={formData.street}
                    onChange={(val) => updateField('street', val)}
                    placeholder="улица"
                    fieldKey="street"
                    fetchSuggestions={(q: string) => deliverySuggestService.suggestStreet(q, formData.city)}
                    lkValue={lkProfile.street}
                    required
                  />
                </div>
                <div className="grid grid-cols-[0.8fr_1.25fr_1.15fr] gap-2 sm:col-span-7">
                  <AutocompleteInput
                    name="house"
                    value={formData.house}
                    onChange={(val) => updateField('house', val)}
                    placeholder="дом"
                    fieldKey="house"
                    lkValue={lkProfile.house}
                    required
                  />
                  <AutocompleteInput
                    name="apartment"
                    value={formData.apartment}
                    onChange={(val) => updateField('apartment', val)}
                    placeholder="квартира"
                    fieldKey="apartment"
                    lkValue={lkProfile.apartment}
                  />
                  <AutocompleteInput
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={(val) => updateField('postalCode', val)}
                    placeholder="индекс"
                    fieldKey="postalCode"
                    lkValue={lkProfile.postalCode}
                    required
                  />
                </div>
              </div>
            )}

            {/* Row 3: эл.почта + номер телефона */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AutocompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={(val) => updateField('email', val)}
                placeholder="эл.почта"
                fieldKey="email"
                lkValue={lkProfile.email}
                required
              />
              <AutocompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(val) => updateField('phone', val)}
                placeholder="номер телефона"
                fieldKey="phone"
                lkValue={lkProfile.phone}
                required
              />
            </div>

            {/* Row 4: ФИО */}
            <div>
              <AutocompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={(val) => updateField('fullName', val)}
                placeholder="ФИО"
                fieldKey="fullName"
                fetchSuggestions={deliverySuggestService.suggestFullName}
                lkValue={lkProfile.fullName}
                required
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BLOCK 3: СДЭК ДО ПВЗ                                                      */}
        {/* ========================================================================= */}
        {activeCompany === 'cdek' && activeType === 'pvz' && (
          <div className="space-y-3">
            {/* Row 1: город */}
            <div>
              <AutocompleteInput
                name="city"
                value={formData.city}
                onChange={(val) => updateField('city', val)}
                placeholder="город"
                fieldKey="city"
                fetchSuggestions={deliverySuggestService.suggestCity}
                lkValue={lkProfile.city}
                required
              />
            </div>

            {/* Row 2: выберите пункт выдачи */}
            <div>
              <PVZSelector
                company="cdek"
                selectedCity={formData.city}
                selectedPvzId={formData.pvzId}
                onSelectPvz={handleSelectPvz}
                placeholder="выберите пункт выдачи"
              />
            </div>

            {/* Row 3: эл.почта + номер телефона */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AutocompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={(val) => updateField('email', val)}
                placeholder="эл.почта"
                fieldKey="email"
                lkValue={lkProfile.email}
                required
              />
              <AutocompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(val) => updateField('phone', val)}
                placeholder="номер телефона"
                fieldKey="phone"
                lkValue={lkProfile.phone}
                required
              />
            </div>

            {/* Row 4: ФИО */}
            <div>
              <AutocompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={(val) => updateField('fullName', val)}
                placeholder="ФИО"
                fieldKey="fullName"
                fetchSuggestions={deliverySuggestService.suggestFullName}
                lkValue={lkProfile.fullName}
                required
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BLOCK 4: СДЭК ДО ДВЕРИ                                                    */}
        {/* ========================================================================= */}
        {activeCompany === 'cdek' && activeType === 'door' && (
          <div className="space-y-3">
            {/* Row 1: город */}
            <div>
              <AutocompleteInput
                name="city"
                value={formData.city}
                onChange={(val) => updateField('city', val)}
                placeholder="город"
                fieldKey="city"
                fetchSuggestions={deliverySuggestService.suggestCity}
                lkValue={lkProfile.city}
                required
              />
            </div>

            {/* Row 2: улица + дом + квартира + индекс */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <AutocompleteInput
                  name="street"
                  value={formData.street}
                  onChange={(val) => updateField('street', val)}
                  placeholder="улица"
                  fieldKey="street"
                  fetchSuggestions={(q: string) => deliverySuggestService.suggestStreet(q, formData.city)}
                  lkValue={lkProfile.street}
                  required
                />
              </div>
              <div className="grid grid-cols-[0.8fr_1.25fr_1.15fr] gap-2 sm:col-span-7">
                <AutocompleteInput
                  name="house"
                  value={formData.house}
                  onChange={(val) => updateField('house', val)}
                  placeholder="дом"
                  fieldKey="house"
                  lkValue={lkProfile.house}
                  required
                />
                <AutocompleteInput
                  name="apartment"
                  value={formData.apartment}
                  onChange={(val) => updateField('apartment', val)}
                  placeholder="квартира"
                  fieldKey="apartment"
                  lkValue={lkProfile.apartment}
                />
                <AutocompleteInput
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={(val) => updateField('postalCode', val)}
                  placeholder="индекс"
                  fieldKey="postalCode"
                  lkValue={lkProfile.postalCode}
                  required
                />
              </div>
            </div>

            {/* Row 3: эл.почта + номер телефона */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AutocompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={(val) => updateField('email', val)}
                placeholder="эл.почта"
                fieldKey="email"
                lkValue={lkProfile.email}
                required
              />
              <AutocompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(val) => updateField('phone', val)}
                placeholder="номер телефона"
                fieldKey="phone"
                lkValue={lkProfile.phone}
                required
              />
            </div>

            {/* Row 4: ФИО */}
            <div>
              <AutocompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={(val) => updateField('fullName', val)}
                placeholder="ФИО"
                fieldKey="fullName"
                fetchSuggestions={deliverySuggestService.suggestFullName}
                lkValue={lkProfile.fullName}
                required
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BLOCK 5: ЯНДЕКС ДОСТАВКА ДО ПВЗ                                           */}
        {/* ========================================================================= */}
        {activeCompany === 'yandex' && activeType === 'pvz' && (
          <div className="space-y-3">
            {/* Row 1: город */}
            <div>
              <AutocompleteInput
                name="city"
                value={formData.city}
                onChange={(val) => updateField('city', val)}
                placeholder="город"
                fieldKey="city"
                fetchSuggestions={deliverySuggestService.suggestCity}
                lkValue={lkProfile.city}
                required
              />
            </div>

            {/* Row 2: выберите пункт выдачи */}
            <div>
              <PVZSelector
                company="yandex"
                selectedCity={formData.city}
                selectedPvzId={formData.pvzId}
                onSelectPvz={handleSelectPvz}
                placeholder="выберите пункт выдачи"
              />
            </div>

            {/* Row 3: эл.почта + номер телефона */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AutocompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={(val) => updateField('email', val)}
                placeholder="эл.почта"
                fieldKey="email"
                lkValue={lkProfile.email}
                required
              />
              <AutocompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(val) => updateField('phone', val)}
                placeholder="номер телефона"
                fieldKey="phone"
                lkValue={lkProfile.phone}
                required
              />
            </div>

            {/* Row 4: ФИО */}
            <div>
              <AutocompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={(val) => updateField('fullName', val)}
                placeholder="ФИО"
                fieldKey="fullName"
                fetchSuggestions={deliverySuggestService.suggestFullName}
                lkValue={lkProfile.fullName}
                required
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BLOCK 6: ЯНДЕКС ДОСТАВКА ДО ДВЕРИ (с этажом и подъездом)                   */}
        {/* ========================================================================= */}
        {activeCompany === 'yandex' && activeType === 'door' && (
          <div className="space-y-3">
            {/* Row 1: город */}
            <div>
              <AutocompleteInput
                name="city"
                value={formData.city}
                onChange={(val) => updateField('city', val)}
                placeholder="город"
                fieldKey="city"
                fetchSuggestions={deliverySuggestService.suggestCity}
                lkValue={lkProfile.city}
                required
              />
            </div>

            {/* Row 2: улица + дом + квартира + индекс */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <AutocompleteInput
                  name="street"
                  value={formData.street}
                  onChange={(val) => updateField('street', val)}
                  placeholder="улица"
                  fieldKey="street"
                  fetchSuggestions={(q: string) => deliverySuggestService.suggestStreet(q, formData.city)}
                  lkValue={lkProfile.street}
                  required
                />
              </div>
              <div className="grid grid-cols-[0.8fr_1.25fr_1.15fr] gap-2 sm:col-span-7">
                <AutocompleteInput
                  name="house"
                  value={formData.house}
                  onChange={(val) => updateField('house', val)}
                  placeholder="дом"
                  fieldKey="house"
                  lkValue={lkProfile.house}
                  required
                />
                <AutocompleteInput
                  name="apartment"
                  value={formData.apartment}
                  onChange={(val) => updateField('apartment', val)}
                  placeholder="квартира"
                  fieldKey="apartment"
                  lkValue={lkProfile.apartment}
                />
                <AutocompleteInput
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={(val) => updateField('postalCode', val)}
                  placeholder="индекс"
                  fieldKey="postalCode"
                  lkValue={lkProfile.postalCode}
                  required
                />
              </div>
            </div>

            {/* Row 3: эл.почта + номер телефона */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AutocompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={(val) => updateField('email', val)}
                placeholder="эл.почта"
                fieldKey="email"
                lkValue={lkProfile.email}
                required
              />
              <AutocompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(val) => updateField('phone', val)}
                placeholder="номер телефона"
                fieldKey="phone"
                lkValue={lkProfile.phone}
                required
              />
            </div>

            {/* Row 4: этаж + подъезд */}
            <div className="grid grid-cols-2 gap-2">
              <AutocompleteInput
                name="floor"
                value={formData.floor}
                onChange={(val) => updateField('floor', val)}
                placeholder="этаж"
                fieldKey="floor"
                lkValue={lkProfile.floor}
              />
              <AutocompleteInput
                name="entrance"
                value={formData.entrance}
                onChange={(val) => updateField('entrance', val)}
                placeholder="подъезд"
                fieldKey="entrance"
                lkValue={lkProfile.entrance}
              />
            </div>

            {/* Row 5: ФИО */}
            <div>
              <AutocompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={(val) => updateField('fullName', val)}
                placeholder="ФИО"
                fieldKey="fullName"
                fetchSuggestions={deliverySuggestService.suggestFullName}
                lkValue={lkProfile.fullName}
                required
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BLOCK 7: САМОВЫВОЗ (фиксированный адрес пункта выдачи)                     */}
        {/* ========================================================================= */}
        {activeCompany === 'pickup' && (
          <div className="space-y-3">
            {/* Row 1: fixed pickup address */}
            <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xs">
              <Store className="w-4 h-4 text-[#2e4733] shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-700 leading-relaxed">
                <span className="font-semibold text-neutral-900">адрес пункта выдачи: </span>
                {PICKUP_ADDRESS}
              </div>
            </div>

            {/* Row 2: ФИО */}
            <div>
              <AutocompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={(val) => updateField('fullName', val)}
                placeholder="ФИО"
                fieldKey="fullName"
                fetchSuggestions={deliverySuggestService.suggestFullName}
                lkValue={lkProfile.fullName}
                required
              />
            </div>

            {/* Row 3: телефон + почта */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AutocompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(val) => updateField('phone', val)}
                placeholder="номер телефона"
                fieldKey="phone"
                lkValue={lkProfile.phone}
                required
              />
              <AutocompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={(val) => updateField('email', val)}
                placeholder="эл.почта"
                fieldKey="email"
                lkValue={lkProfile.email}
                required
              />
            </div>
          </div>
        )}

        {/* Submit / Confirm Button */}
        {!isBlockCard && (
          <div className="pt-4">
            <button
              type="submit"
              className="w-full h-12 bg-neutral-900 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-sm rounded-[2px]"
            >
              <Send className="w-4 h-4" />
              <span>Оформить доставку</span>
            </button>
          </div>
        )}
      </form>

      {/* Confirmation Notification Modal / Banner */}
      {submitted && !isBlockCard && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-300 rounded-[2px] flex items-start gap-3 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Данные доставки успешно сохранены!</div>
            <p>
              Способ:{' '}
              <strong>
                {activeCompany === 'post'
                  ? 'Почта России'
                  : activeCompany === 'cdek'
                  ? 'СДЭК'
                  : activeCompany === 'yandex'
                  ? 'Яндекс Доставка'
                  : 'Самовывоз'}
                {activeCompany !== 'pickup' && <> ({activeType === 'pvz' ? 'ПВЗ' : 'Курьер до двери'})</>}
              </strong>
            </p>
            {activeCompany === 'pickup' ? (
              <p>
                Получатель: {formData.fullName} ({formData.phone}), Адрес: {PICKUP_ADDRESS}
              </p>
            ) : (
              <p>
                Получатель: {formData.fullName} ({formData.phone}), Город: {formData.city}
              </p>
            )}
            {formData.pvzAddress && <p>ПВЗ: {formData.pvzAddress}</p>}
            {formData.street && (
              <p>
                Адрес: {formData.street}, д. {formData.house}, кв. {formData.apartment}
                {formData.floor && `, этаж ${formData.floor}`}
                {formData.entrance && `, подъезд ${formData.entrance}`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryForm;
