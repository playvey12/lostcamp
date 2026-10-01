import { NewsArticle } from '../types';
import { useAuthStore } from '../store/useAuthStore';

function checkUnauthorized(res: Response) {
  if (res.status === 401 || res.status === 403) {
    useAuthStore.getState().logout();
  }
}

async function parseNewsResponse(res: Response, defaultErrorMsg: string): Promise<any> {
  checkUnauthorized(res);
  let text = '';
  try {
    text = await res.text();
  } catch {
    throw new Error(`${res.status} ${res.statusText} (${defaultErrorMsg})`);
  }

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      throw new Error(`${res.status} ${res.statusText} (${defaultErrorMsg})`);
    }
  }

  if (!res.ok || (data && data.success === false)) {
    const errorText = data?.error || data?.message || `${res.status} ${res.statusText}`;
    throw new Error(errorText || defaultErrorMsg);
  }

  return data;
}

export const newsService = {
  async fetchNews(): Promise<NewsArticle[]> {
    const res = await fetch('/api/news', { credentials: 'include' });
    if (!res.ok) {
      const msg = await parseNewsResponse(res, 'Не удалось загрузить новости').catch((e) => e.message);
      throw new Error(msg);
    }
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  async createNews(article: Partial<NewsArticle>): Promise<NewsArticle> {
    const headers = useAuthStore.getState().getAuthHeaders();
    const res = await fetch('/api/news', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(article),
    });
    const data = await parseNewsResponse(res, 'Не удалось создать новость');
    return data.data || data;
  },

  async updateNews(id: number, article: Partial<NewsArticle>): Promise<NewsArticle> {
    const headers = useAuthStore.getState().getAuthHeaders();
    const res = await fetch(`/api/news/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(article),
    });
    const data = await parseNewsResponse(res, 'Не удалось обновить новость');
    return data.data || data;
  },

  async deleteNews(id: number): Promise<{ success: boolean; message?: string }> {
    const headers = useAuthStore.getState().getAuthHeaders();
    const res = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    const data = await parseNewsResponse(res, 'Не удалось удалить новость');
    return data;
  },
};
