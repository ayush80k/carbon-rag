import { NoVerifiedPriceBenchmarkAssessment, PriceAssessment } from "./types.js";

const NO_BENCHMARK_LIMITATIONS = [
  "The available Excel project database contains no verified transaction, listing, market, or benchmark price data.",
  "No deterministic exchange-rate source is configured, so prices in different currencies cannot be compared.",
];

function unavailableAssessment(
  status: NoVerifiedPriceBenchmarkAssessment["status"],
  askedPrice: number | null,
  currency: string | null,
  assessment: string,
): NoVerifiedPriceBenchmarkAssessment {
  return {
    mode: "NO_VERIFIED_PRICE_BENCHMARK",
    status,
    askedPrice,
    currency,
    benchmarkPrice: null,
    qualityTier: null,
    qualityMultiplier: null,
    calculatedFairPrice: null,
    priceDifference: null,
    priceDifferencePercent: null,
    assessment,
    limitations: NO_BENCHMARK_LIMITATIONS,
  };
}

/**
 * Pricing is intentionally deterministic and has no Gemini, Pinecone, or RAG dependency.
 *
 * A future verified benchmark provider belongs at this boundary. It must supply a benchmark
 * price, currency, and project/category mapping before this function can safely return
 * BENCHMARK_AVAILABLE. The Bhoomi formula (benchmarkPrice × qualityMultiplier) is not run
 * until such data exists; the repository currently has no verified benchmark source.
 */
export function assessPrice(askedPrice?: number | null, currency?: string | null): PriceAssessment {
  const normalizedCurrency = currency?.trim().toUpperCase() || null;
  if (askedPrice === undefined || askedPrice === null || !Number.isFinite(askedPrice)) {
    return unavailableAssessment(
      "NO_ASKING_PRICE",
      null,
      normalizedCurrency,
      "No valid asking price was provided. A definitive fair-price judgment cannot be made without an asking price and verified market benchmark data.",
    );
  }
  return unavailableAssessment(
    "BENCHMARK_UNAVAILABLE",
    askedPrice,
    normalizedCurrency || "INR",
    "Insufficient Market Price Data. The asking price is preserved, but the current framework has no verified transactional benchmark to assess fairness. A definitive fair-price judgment cannot be made.",
  );
}
