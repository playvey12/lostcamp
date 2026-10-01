export interface Product {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  image: string;
  category?: string;
  subcategory?: string;
  sku?: string;
  description?: string;
  color?: string;
  availableColors?: string[];
  imageFocalPoint?: { x: number; y: number; zoom?: number };
  inStock?: boolean;
  isPromo?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export type DeliveryCompany = 'post' | 'cdek' | 'yandex' | 'pickup';
export type DeliveryKind = 'pvz' | 'door';

// Last-used checkout delivery details, saved onto the user's profile so the
// checkout form can prefill them next time ("из личного кабинета").
export interface DeliveryInfo {
  company?: DeliveryCompany;
  deliveryType?: DeliveryKind;
  city?: string;
  street?: string;
  house?: string;
  apartment?: string;
  postalCode?: string;
  floor?: string;
  entrance?: string;
  pvzId?: string;
  pvzAddress?: string;
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface UserProfile {
  isLoggedIn: boolean;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  address?: string;
  deliveryInfo?: DeliveryInfo;
}

export interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
}

export interface UserOrder {
  id: string;
  date: string;
  status: string;
  total: number;
  address?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  deliveryMethod?: string;
  deliveryCost?: number;
  paymentMethod?: string;
  comment?: string;
  items: OrderItem[];
  paymentId?: string;
  paid?: boolean;
}

export interface Advantage {
  id: string;
  title: string;
  description: string;
}

export interface ArticleCard {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface VideoHistoryItem {
  id: string;
  url: string;
  name: string;
  date: string;
}

export interface CategoryItem {
  categoryId: string;
  title: string;
  items: string[];
}

export interface NewsArticle {
  id?: number;
  title: string;
  subtitle?: string;
  date: string;
  tags?: string;
  content: string;
  mediaLayout: '1_photo' | '2_photo' | '3_photo' | '1_photo_1_video' | '2_photo_1_video' | '1_video';
  image1?: string;
  image2?: string;
  image3?: string;
  videoUrl?: string;
  coverImage?: string;
  coverFocalPoint?: { x: number; y: number; zoom?: number };
  createdAt?: string;
}

