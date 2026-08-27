import assert from "node:assert/strict";
import test from "node:test";
import { analyzeProjectPipeline } from "../src/analyzeProject.js";
import { normalizeInput } from "../src/normalizeInput.js";
import { normalizeProjectRow } from "../src/projectLoader.js";
import { calculateIntegrityScore } from "../src/scoring.js";
import { acr138, comparablePeer } from "./fixtures/projects.js";

test("database-equivalent project exposes six factors and excludes reduction permanence", () => {
  const score = calculateIntegrityScore(acr138);
  const factors = score.factors;
  for (const factor of Object.values(factors).filter((factor) => factor.applicability === "applicable")) {
    assert.notEqual(factor.score, null);
    assert.ok(factor.score! >= 0 && factor.score! <= 100);
  }
  assert.ok(score.overallIntegrityScore >= 0 && score.overallIntegrityScore <= 100);
  assert.equal(score.totalScore, score.overallIntegrityScore);
  assert.equal(factors.permanence.evidenceStatus, "not_applicable");
  assert.equal(score.factorCoverage, 100);
  assert.ok(score.evidenceCoverage < 100);
  assert.equal(score.confidence, "Medium");
});

test("manual seller project uses the same pipeline and does not treat Unknown as evidence", async () => {
  const result = await analyzeProjectPipeline({
    project: { projectId: "SELLER-001", projectName: "Seller project", registry: "Unknown", verifier: "Unknown", methodology: "", type: "Forest conservation", vintage: 2022 },
    askedPrice: 500, currency: "INR",
  }, { peerProjects: [acr138, comparablePeer], includeAiExplanation: false });
  assert.equal(result.normalizedData.registry, null);
  assert.equal(result.integrityScore.factors.verification.evidenceStatus, "insufficient");
  assert.ok(result.riskIndicators.evidenceGaps.some((gap) => gap.includes("Independent verifier")));
  assert.equal(result.priceAssessment.currency, "INR");
  assert.equal(result.priceAssessment.askedPrice, 500);
  assert.ok(result.greenwashingRisk.explanation.length > 40);
});

test("missing verifier and methodology create evidence gaps rather than false evidence", () => {
  const project = normalizeInput({ project: { projectId: "MISSING", verifier: "Unknown", methodology: "Unknown" } });
  const score = calculateIntegrityScore(project);
  assert.ok(score.factors.verification.evidenceGaps.some((gap) => gap.includes("verifier")));
  assert.equal(score.factors.methodologyQuality.score, null);
});

test("Excel reversal header is mapped with numeric values interpreted safely", () => {
  const project = normalizeProjectRow({ "Project ID": "ROW-1", "Reversals Not Covered by Buffer": "0" });
  assert.equal(project.uncoveredReversals, false);
  assert.equal(normalizeProjectRow({ "Reversals Not Covered by Buffer": 3 }).uncoveredReversals, true);
});

test("retirement evidence is assessed without claiming proof and older vintages remain valid", () => {
  const score = calculateIntegrityScore(acr138);
  assert.match(score.factors.doubleCountingRisk.rationale, /prove/i);
  assert.ok(score.factors.vintage.score! > 0);
  assert.match(score.factors.vintage.rationale, /do not by themselves prove poor quality/i);
});

test("indirect additionality and registry traceability cannot receive perfect scores", () => {
  const score = calculateIntegrityScore(acr138);
  assert.ok(score.factors.additionality.score! < 100);
  assert.equal(score.factors.additionality.evidenceStatus, "partial");
  assert.match(score.factors.additionality.rationale, /not a proven additionality determination/i);
  assert.ok(score.factors.doubleCountingRisk.score! < 100);
  assert.match(score.factors.doubleCountingRisk.rationale, /prove/i);
});

test("evidence gaps lower confidence without becoming proof of greenwashing", async () => {
  const result = await analyzeProjectPipeline({ project: { ...acr138, certifications: null, methodologyVersion: null } }, { peerProjects: [comparablePeer], includeAiExplanation: false });
  assert.equal(result.integrityScore.factorCoverage, 100);
  assert.ok(result.integrityScore.evidenceCoverage < 100);
  assert.equal(result.integrityScore.confidence, "Medium");
  assert.notEqual(result.greenwashingRisk.level, "High");
  assert.equal(result.greenwashingRisk.indicators.length, 0);
});

test("not-applicable permanence re-normalizes the weighted composite", () => {
  const score = calculateIntegrityScore(acr138);
  const f = score.factors;
  const expected = Math.round((f.verification.score! * 20 + f.additionality.score! * 20 + f.doubleCountingRisk.score! * 15 + f.methodologyQuality.score! * 20 + f.vintage.score! * 10) / 85);
  assert.equal(score.overallIntegrityScore, expected);
});

test("zero INR asked price is retained and has no fabricated benchmark", async () => {
  const result = await analyzeProjectPipeline({ project: acr138, askedPrice: 0, currency: "INR" }, { peerProjects: [comparablePeer], includeAiExplanation: false });
  assert.equal(result.priceAssessment.askedPrice, 0);
  assert.equal(result.priceAssessment.currency, "INR");
  assert.equal(result.priceAssessment.mode, "NO_VERIFIED_PRICE_BENCHMARK");
  assert.match(result.priceAssessment.assessment, /definitive fair-price judgment cannot be made/i);
});
