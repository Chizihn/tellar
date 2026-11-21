const FALLBACK_XLM_USD_RATE = 0.12;
const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd";

/** NGN/XLM isn't a CoinGecko pair, so route local currency -> USD -> XLM. Replace with real rates per currency as needed. */
const USD_PER_LOCAL: Record<string, number> = {
  USD: 1,
  NGN: 1 / 1500,
};

let cachedUsdRate: { rate: number; fetchedAt: number } | null = null;
const CACHE_MS = 60_000;

async function getXlmUsdRate(): Promise<number> {
  if (cachedUsdRate && Date.now() - cachedUsdRate.fetchedAt < CACHE_MS) {
    return cachedUsdRate.rate;
  }

  try {
    const res = await fetch(COINGECKO_SIMPLE_PRICE_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const rate = data?.stellar?.usd;
    if (typeof rate !== "number") throw new Error("Unexpected CoinGecko shape");
    cachedUsdRate = { rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    return FALLBACK_XLM_USD_RATE;
  }
}

export async function convertToXlm(
  amountLocal: number,
  currency: string
): Promise<{ amountXlm: number; xlmRate: number }> {
  const usdPerLocal = USD_PER_LOCAL[currency] ?? 1;
  const xlmUsdRate = await getXlmUsdRate();
  const amountUsd = amountLocal * usdPerLocal;
  const amountXlm = amountUsd / xlmUsdRate;
  return { amountXlm, xlmRate: xlmUsdRate };
}
