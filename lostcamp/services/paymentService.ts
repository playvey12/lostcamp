export const paymentService = {
  // Starts a YooKassa payment for an already-created order and returns the
  // hosted confirmation page URL to send the customer to.
  async createPayment(orderId: string): Promise<{ confirmationUrl: string | null }> {
    const res = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || 'Не удалось создать оплату');
    }
    return { confirmationUrl: json.data?.confirmationUrl || null };
  },
};
