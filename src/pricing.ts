import { PriceAssessment } from './types';

export function assessPrice(askedPrice?: number, currency?: string): PriceAssessment {
  if (!askedPrice) {
    return {
      mode: "NO_VERIFIED_PRICE_BENCHMARK",
      askedPrice: null,
      currency: null,
      assessment: "No asking price provided."
    };
  }

  return {
    mode: "NO_VERIFIED_PRICE_BENCHMARK",
    askedPrice,
    currency: currency || "USD",
    assessment: "Insufficient Market Price Data. Current framework lacks live transactional benchmarks to validate asking price fairness."
  };
}