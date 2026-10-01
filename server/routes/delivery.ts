import { Router, Request, Response } from 'express';

const router = Router();

const DADATA_API_KEY = process.env.DADATA_API_KEY;
const DADATA_ADDRESS_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
const DADATA_FIO_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/fio';

// Very small in-memory sliding-window throttle per IP so a runaway frontend
// loop (e.g. firing on every keystroke) can't burn through the DaData quota.
const REQUESTS_PER_MINUTE = 60;
const hits = new Map<string, number[]>();
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const arr = (hits.get(key) || []).filter((t) => t > windowStart);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > REQUESTS_PER_MINUTE;
}

// POST /api/delivery/suggest/address
// body: { query: string, boundLevel?: 'city' | 'street' }
// Used for both "город" and "улица" autocomplete fields. Both work exactly
// the same way — a plain free-text DaData suggest call restricted to that
// address level, with no city scoping — so street suggests just as reliably
// as city does.
router.post('/suggest/address', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ success: false, error: 'Слишком много запросов, попробуйте чуть позже' });
    }

    if (!DADATA_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'DADATA_API_KEY не настроен на сервере',
        suggestions: [],
      });
    }

    const { query, boundLevel } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.json({ success: true, suggestions: [] });
    }

    const body: Record<string, any> = { query: query.trim(), count: 10 };

    if (boundLevel === 'city') {
      body.from_bound = { value: 'city' };
      body.to_bound = { value: 'settlement' };
    } else if (boundLevel === 'street') {
      body.from_bound = { value: 'street' };
      body.to_bound = { value: 'street' };
    }

    const dadataRes = await fetch(DADATA_ADDRESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${DADATA_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!dadataRes.ok) {
      return res.status(502).json({ success: false, error: 'Ошибка сервиса подсказок адресов', suggestions: [] });
    }

    const data: any = await dadataRes.json();
    const suggestions = Array.isArray(data.suggestions)
      ? data.suggestions.map((s: any) => ({
          value: s.value,
          city: s.data?.city || s.data?.settlement || '',
          street: s.data?.street_with_type || '',
          house: s.data?.house || '',
          postalCode: s.data?.postal_code || '',
        }))
      : [];

    return res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching DaData address suggestions:', error);
    return res.status(500).json({ success: false, error: 'Не удалось получить подсказки', suggestions: [] });
  }
});

// POST /api/delivery/suggest/fio
// body: { query: string }
// Used for the "ФИО" (full name) autocomplete/typo-correction field.
router.post('/suggest/fio', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ success: false, error: 'Слишком много запросов, попробуйте чуть позже' });
    }

    if (!DADATA_API_KEY) {
      return res.status(503).json({ success: false, error: 'DADATA_API_KEY не настроен на сервере', suggestions: [] });
    }

    const { query } = req.body || {};
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.json({ success: true, suggestions: [] });
    }

    const dadataRes = await fetch(DADATA_FIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${DADATA_API_KEY}`,
      },
      body: JSON.stringify({ query: query.trim(), count: 10 }),
    });

    if (!dadataRes.ok) {
      return res.status(502).json({ success: false, error: 'Ошибка сервиса подсказок ФИО', suggestions: [] });
    }

    const data: any = await dadataRes.json();
    const suggestions = Array.isArray(data.suggestions) ? data.suggestions.map((s: any) => s.value) : [];

    return res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching DaData FIO suggestions:', error);
    return res.status(500).json({ success: false, error: 'Не удалось получить подсказки', suggestions: [] });
  }
});

export default router;
