import { VideoHistoryItem } from '../types';
import { authService } from './authService';

export interface FrameSectionContent {
  badgeText: string;
  heading: string;
  description: string;
  videoOverlayLabel: string;
  videoOverlayTitle: string;
  featuresHeading: string;
  featuresSubheading: string;
  features: { title: string; text: string }[];
  ctaText: string;
}

export interface HeroBannerConfig {
  badgeText: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  features: string[];
}

export interface HeroBannerTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: HeroBannerConfig;
}

export interface SiteConfig {
  heroVideoUrl: string;
  videoHistory: VideoHistoryItem[];
  frameProductId?: number | null;
  frameSectionContent?: FrameSectionContent | null;
  heroBannerConfig?: HeroBannerConfig | null;
  heroBannerTemplates?: HeroBannerTemplate[];
  popularProductIds?: number[];
  promoProductIds?: number[];
}

export const siteService = {
  async fetchSiteConfig(): Promise<SiteConfig> {
    const res = await fetch('/api/site', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch site config');
    return res.json();
  },

  async updateSiteConfig(config: Partial<SiteConfig>): Promise<SiteConfig> {
    const res = await fetch('/api/site', {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(config),
    });
    if (res.status === 401) {
      authService.triggerUnauthorized();
    }
    if (!res.ok) throw new Error('Failed to update site config');
    return res.json();
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const token = authService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/site/upload-image', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (res.status === 401) {
      authService.triggerUnauthorized();
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка загрузки изображения');
    }

    const data = await res.json();
    return data.url;
  },
};
