import { CatalogProduct } from '../../server/data/products';
import { authService } from './authService';

function checkUnauthorized(res: Response) {
  if (res.status === 401) {
    authService.triggerUnauthorized();
  }
}

async function parseErrorMessage(res: Response, defaultMsg: string): Promise<string> {
  try {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data && (data.error || data.message)) {
        return data.error || data.message;
      }
    } catch {
      if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
        return `${res.status} ${res.statusText}: ${text}`;
      }
    }
    return `${res.status} ${res.statusText} (${defaultMsg})`;
  } catch {
    return `${res.status} ${res.statusText} (${defaultMsg})`;
  }
}

export const productService = {
  async fetchProducts(): Promise<CatalogProduct[]> {
    const res = await fetch('/api/products', { credentials: 'include' });
    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Failed to fetch products');
      throw new Error(msg);
    }
    return res.json();
  },

  async saveProducts(products: CatalogProduct[]): Promise<CatalogProduct[]> {
    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(products),
    });
    checkUnauthorized(res);
    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Failed to save products');
      throw new Error(msg);
    }
    return res.json();
  },

  async addProduct(product: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(product),
    });
    checkUnauthorized(res);
    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Failed to add product');
      throw new Error(msg);
    }
    return res.json();
  },

  async updateProduct(id: number, product: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(product),
    });
    checkUnauthorized(res);
    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Failed to update product');
      throw new Error(msg);
    }
    return res.json();
  },

  async deleteProduct(id: number): Promise<{ success: boolean; id: number }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
    });
    checkUnauthorized(res);
    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Failed to delete product');
      throw new Error(msg);
    }
    return res.json();
  },
};
