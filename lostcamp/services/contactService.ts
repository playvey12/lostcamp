export const contactService = {
  async submitContact(contact: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contact, message }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Не удалось отправить сообщение');
      }
      return data || { success: true, message: 'Сообщение успешно отправлено!' };
    } catch (err: any) {
      console.error('Contact submit error:', err);
      throw new Error(err?.message || 'Ошибка сети при отправке сообщения');
    }
  },
};

