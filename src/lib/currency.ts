/**
 * Multi-currency support for SpendLens cost views.
 *
 * Provides static fallback exchange rates (USD base) and an optional
 * async fetcher that pulls live rates from the Open Exchange Rates
 * compatible endpoint. Results are cached with a 1-hour TTL.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'BRL';

// Static fallback rates vs USD (updated periodically in code)
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.925,
  GBP: 0.787,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  INR: 83.1,
  BRL: 4.97,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  INR: '₹',
  BRL: 'R$',
};

interface RateCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchLiveRates(): Promise<Record<string, number>> {
  const url = 'https://open.er-api.com/v6/latest/USD';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('rate API returned ' + res.status);
    const json = await res.json() as { rates: Record<string, number> };
    return json.rates;
  } catch {
    return FALLBACK_RATES as Record<string, number>;
  }
}

async function getRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }
  const rates = await fetchLiveRates();
  cache = { rates, fetchedAt: Date.now() };
  return rates;
}

/**
 * Convert an amount from USD to the target currency.
 * Falls back to static rates if the live fetch fails.
 */
export async function convertFromUsd(
  amountUsd: number,
  target: CurrencyCode
): Promise<number> {
  if (target === 'USD') return amountUsd;
  const rates = await getRates();
  const rate = rates[target] ?? FALLBACK_RATES[target] ?? 1;
  return amountUsd * rate;
}

/**
 * Synchronous conversion using the cached/fallback rates.
 * Safe to use in render functions where async is not available.
 */
export function convertFromUsdSync(amountUsd: number, target: CurrencyCode): number {
  if (target === 'USD') return amountUsd;
  const rates = cache?.rates ?? FALLBACK_RATES;
  const rate = (rates[target] as number | undefined) ?? FALLBACK_RATES[target] ?? 1;
  return amountUsd * rate;
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}
