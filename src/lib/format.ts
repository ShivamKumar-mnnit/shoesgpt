import type { Currency } from "./types";

const LOCALE: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
  AED: "en-AE",
  SGD: "en-SG",
  MXN: "es-MX",
};

/** Currencies shown without decimals. */
const WHOLE: Currency[] = ["INR", "JPY"];

/** Price in the shoe's own currency: ₹4,299 · $89.99 · 89,99 € · £79.99 · ￥22,000 */
export function money(n: number, currency: Currency = "INR") {
  const whole = WHOLE.includes(currency) || Number.isInteger(n);
  return new Intl.NumberFormat(LOCALE[currency] ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(whole ? Math.round(n) : Math.round(n * 100) / 100);
}
