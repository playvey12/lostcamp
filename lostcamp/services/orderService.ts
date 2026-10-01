import { UserOrder } from '../types';
import { authService } from './authService';

function checkUnauthorized(res: Response) {
  if (res.status === 401) {
    authService.triggerUnauthorized();
  }
}

export const orderService = {
  async fetchOrders(): Promise<UserOrder[]> {
    const res = await fetch('/api/orders', {
      headers: authService.getAuthHeaders(),
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) {
      return [];
    }
    if (!res.ok) throw new Error('Failed to fetch orders');
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json?.data || []);
    return Array.isArray(data) ? data : [];
  },

  async fetchMyOrders(): Promise<UserOrder[]> {
    const res = await fetch('/api/orders/my', {
      headers: authService.getAuthHeaders(),
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) {
      return [];
    }
    if (!res.ok) throw new Error('Failed to fetch my orders');
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json?.data || []);
    return Array.isArray(data) ? data : [];
  },

  async saveOrders(orders: UserOrder[]): Promise<UserOrder[]> {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(orders),
    });
    checkUnauthorized(res);
    if (!res.ok) throw new Error('Failed to save orders');
    const json = await res.json();
    const data = Array.isArray(json) ? json : (json?.data || []);
    return Array.isArray(data) ? data : [];
  },

  async createOrder(order: Partial<UserOrder>): Promise<UserOrder[]> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return this.fetchOrders();
  },

  async updateOrder(id: string, orderData: Partial<UserOrder>): Promise<UserOrder[]> {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(orderData),
    });
    checkUnauthorized(res);
    if (!res.ok) throw new Error('Failed to update order');
    return this.fetchOrders();
  },

  async deleteOrder(id: string): Promise<UserOrder[]> {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
    });
    checkUnauthorized(res);
    if (!res.ok) throw new Error('Failed to delete order');
    return this.fetchOrders();
  },
};
