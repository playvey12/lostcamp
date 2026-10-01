import crypto from 'crypto';

// YooKassa REST API client (https://yookassa.ru/developers/api).
//
// Required env vars:
//   YOOKASSA_SHOP_ID     - shop identifier from the YooKassa merchant dashboard
//   YOOKASSA_SECRET_KEY  - secret key from the YooKassa merchant dashboard
//                          (Настройки -> API)
//   PUBLIC_SITE_URL      - the public https URL of this site, used to build
//                          the "return_url" the customer is sent back to
//                          after paying (e.g. https://lostcamp.ru)
//
// Docs: https://yookassa.ru/developers/payment-acceptance/getting-started/quick-start

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

export function isYookassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

function getAuthHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID || '';
  const secretKey = process.env.YOOKASSA_SECRET_KEY || '';
  return 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');
}

function formatAmount(value: number): string {
  // YooKassa requires a string with exactly 2 decimal places, e.g. "1000.00"
  return (Math.round(value * 100) / 100).toFixed(2);
}

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  description: string;
  customerEmail?: string;
  /** Populated automatically with a random UUID if not supplied. */
  idempotenceKey?: string;
}

export interface YookassaPayment {
  id: string;
  status: string;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
}

async function yookassaRequest(path: string, options: { method: string; body?: any; idempotenceKey?: string }): Promise<YookassaPayment> {
  if (!isYookassaConfigured()) {
    throw new Error('YooKassa is not configured: set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: getAuthHeader(),
  };
  if (options.idempotenceKey) {
    headers['Idempotence-Key'] = options.idempotenceKey;
  }

  const res = await fetch(`${YOOKASSA_API_URL}${path}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const description = json?.description || json?.code || res.statusText;
    throw new Error(`YooKassa API error (${res.status}): ${description}`);
  }

  return json as YookassaPayment;
}

// Creates a YooKassa payment for an order and returns the hosted
// confirmation page the customer should be redirected to.
export async function createYookassaPayment(params: CreatePaymentParams): Promise<YookassaPayment> {
  const returnBase = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const returnUrl = returnBase
    ? `${returnBase}/order-success/${encodeURIComponent(params.orderId)}`
    : undefined;

  const body: Record<string, any> = {
    amount: {
      value: formatAmount(params.amount),
      currency: 'RUB',
    },
    capture: true, // one-stage payment: capture automatically on successful auth
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || 'https://yookassa.ru',
    },
    description: params.description.slice(0, 128), // YooKassa limits to 128 chars
    metadata: {
      orderId: params.orderId,
    },
    receipt: params.customerEmail
      ? {
          customer: { email: params.customerEmail },
          items: [
            {
              description: params.description.slice(0, 128),
              quantity: '1.00',
              amount: { value: formatAmount(params.amount), currency: 'RUB' },
              vat_code: 1, // "без НДС" — adjust to match your tax setup
              payment_subject: 'commodity',
              payment_mode: 'full_payment',
            },
          ],
        }
      : undefined,
  };

  return yookassaRequest('/payments', {
    method: 'POST',
    body,
    idempotenceKey: params.idempotenceKey || crypto.randomUUID(),
  });
}

// Fetches the current state of a payment directly from YooKassa. Used by the
// webhook handler to verify a notification instead of trusting its body,
// since webhook requests aren't signed.
export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  return yookassaRequest(`/payments/${encodeURIComponent(paymentId)}`, { method: 'GET' });
}
