import { PriceAssessment } from "./types.js";

export function assessPrice(askedPrice?: number | null, currency?: string | null): PriceAssessment {
  const normalizedCurrency = currency?.trim().toUpperCase() || null;
  if (askedPrice === undefined || askedPrice === null || !Number.isFinite(askedPrice)) {
    return { mode: "NO_VERIFIED_PRICE_BENCHMARK", askedPrice: null, currency: normalizedCurrency, assessment: "No valid asking price was provided. The current dataset has no verified transactional price benchmark." };
  }
  return {
    mode: "NO_VERIFIED_PRICE_BENCHMARK",
    askedPrice,
    currency: normalizedCurrency || "INR",
    assessment: "Insufficient Market Price Data. Current framework lacks verified transactional benchmarks to validate asking price fairness. A definitive fair-price judgment cannot be made.",
  };
}
