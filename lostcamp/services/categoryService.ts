import { CategoryItem } from '../types';
import { authService } from './authService';

function checkUnauthorized(res: Response) {
  if (res.status === 401) {
    authService.triggerUnauthorized();
  }
}

export const categoryService = {
  async fetchCategories(): Promise<CategoryItem[]> {
    const res = await fetch('/api/categories', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async saveCategories(categories: CategoryItem[]): Promise<CategoryItem[]> {
    const res = await fetch('/api/categories', {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(categories),
    });
    checkUnauthorized(res);
    if (!res.ok) throw new Error('Failed to save categories');
    return res.json();
  },

  async createCategory(category: CategoryItem): Promise<CategoryItem[]> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(category),
    });
    checkUnauthorized(res);
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async deleteCategory(categoryId: string): Promise<CategoryItem[]> {
    const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
    });
    checkUnauthorized(res);
    if (!res.ok) {
      let msg = 'Failed to delete category';
      try {
        const errData = await res.json();
        if (errData.error) msg = errData.error;
      } catch (_e) {}
      throw new Error(msg);
    }
    return res.json();
  },
};
