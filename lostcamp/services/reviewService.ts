import { Review } from '../../server/data/products';
import { authService } from './authService';

function checkUnauthorized(res: Response) {
  if (res.status === 401) {
    authService.triggerUnauthorized();
  }
}

export const reviewService = {
  async fetchReviews(productId: number): Promise<Review[]> {
    const res = await fetch(`/api/products/${productId}/reviews`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async addReview(productId: number, reviewData: FormData | Partial<Review>): Promise<Review> {
    const isFormData = reviewData instanceof FormData;
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      credentials: 'include',
      ...(isFormData
        ? { body: reviewData }
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData),
          }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to add review');
    }
    return res.json();
  },

  async deleteReview(id: number): Promise<boolean> {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(),
      credentials: 'include',
    });
    checkUnauthorized(res);
    if (!res.ok) throw new Error('Failed to delete review');
    return true;
  },
};
