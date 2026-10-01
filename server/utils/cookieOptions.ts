export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  maxAge: number;
  path: string;
}

export function getCookieOptions(): CookieOptions {
  let isPreviewIframe = process.env.PREVIEW_IFRAME_MODE === 'true';

  if (process.env.NODE_ENV === 'production' && isPreviewIframe) {
    console.warn(
      '[SECURITY WARNING] PREVIEW_IFRAME_MODE=true is ignored in production environment for security. Standard Lax cookie settings are enforced.'
    );
    isPreviewIframe = false;
  }

  return {
    httpOnly: true,
    secure: isPreviewIframe ? true : process.env.NODE_ENV === 'production',
    sameSite: isPreviewIframe ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export const COOKIE_OPTIONS = getCookieOptions();
