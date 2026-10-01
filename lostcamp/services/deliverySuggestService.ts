// Talks to the /api/delivery/suggest/* proxy routes (server holds the DaData
// token) to power the city/street/FIO autocomplete fields on the checkout page.

export interface SuggestResult {
  suggestions: string[];
  error?: string;
}

interface RawSuggestion {
  value: string;
  city: string;
  street: string;
  house: string;
  postalCode: string;
}

async function suggestAddressRaw(query: string, boundLevel: 'city' | 'street'): Promise<{ items: RawSuggestion[]; error?: string }> {
  try {
    const res = await fetch('/api/delivery/suggest/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, boundLevel }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.success) {
      return { items: [], error: (data && data.error) || `Ошибка сервера (${res.status})` };
    }
    const items: RawSuggestion[] = Array.isArray(data.suggestions) ? data.suggestions : [];
    return { items };
  } catch (e) {
    return { items: [], error: 'Нет соединения с сервером' };
  }
}

export const deliverySuggestService = {
  async suggestCity(query: string): Promise<SuggestResult> {
    const { items, error } = await suggestAddressRaw(query, 'city');
    return { suggestions: items.map((s) => s.value).filter(Boolean), error };
  },

  // DaData needs enough context to know *which* street across all of Russia
  // to suggest — a bare "м" is ambiguous on its own. So once a city has been
  // chosen, it gets folded straight into the search text ("Москва м") rather
  // than passed as a separate location filter, which is the most reliable way
  // to get DaData to actually narrow results to that city.
  async suggestStreet(query: string, city?: string): Promise<SuggestResult> {
    const combinedQuery = city && city.trim() ? `${city.trim()} ${query}` : query;
    const { items, error } = await suggestAddressRaw(combinedQuery, 'street');
    // Prefer the clean parsed street name ("ул. Мира") over the full
    // concatenated value ("г Москва, ул Мира") so the field doesn't repeat
    // the city that's already shown above it; fall back to the raw value
    // when DaData couldn't parse a distinct street out of the query.
    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const s of items) {
      const display = s.street || s.value;
      if (display && !seen.has(display)) {
        seen.add(display);
        suggestions.push(display);
      }
    }
    return { suggestions, error };
  },

  async suggestFullName(query: string): Promise<SuggestResult> {
    try {
      const res = await fetch('/api/delivery/suggest/fio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        return { suggestions: [], error: (data && data.error) || `Ошибка сервера (${res.status})` };
      }
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      return { suggestions };
    } catch (e) {
      return { suggestions: [], error: 'Нет соединения с сервером' };
    }
  },
};
