export type DeliveryCompany = 'post' | 'cdek' | 'yandex' | 'pickup';
export type DeliveryType = 'pvz' | 'door';

export interface LKProfile {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  postalCode: string;
  floor?: string;
  entrance?: string; // "падик"
  pvzId?: string;
  pvzAddress?: string;
}

export interface PVZPoint {
  id: string;
  company: DeliveryCompany;
  name: string;
  city: string;
  address: string;
  schedule: string;
  phone: string;
  features: string[];
  days: string;
  price: number;
}

export interface DeliveryFormData {
  company: DeliveryCompany;
  deliveryType: DeliveryType;
  city: string;
  pvzId?: string;
  pvzAddress?: string;
  street: string;
  house: string;
  apartment: string;
  postalCode: string;
  floor: string;
  entrance: string; // падик
  email: string;
  phone: string;
  fullName: string;
  comment?: string;
}

export interface BlockConfig {
  id: string;
  number: number;
  title: string;
  company: DeliveryCompany;
  deliveryType: DeliveryType;
  description: string;
}
