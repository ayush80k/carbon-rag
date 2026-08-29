import assert from "node:assert/strict";
import test from "node:test";
import { analyzeProjectPipeline } from "../src/analyzeProject.js";
import { normalizeInput } from "../src/normalizeInput.js";
import { normalizeProjectRow } from "../src/projectLoader.js";
import { calculateIntegrityScore } from "../src/scoring.js";
import { assessPrice } from "../src/pricing.js";
import { detectLanguage, parseChatRequest, selectRelevantRecords } from "../src/chatRag.js";
import { bhoomiKnowledge } from "../src/knowledge/bhoomiKnowledge.js";
import { languageInstruction, resolveLanguage } from "../src/language.js";
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
  const result = await analyzeProjectPipeline({ project: acr138, askingPrice: 0, currency: "INR" }, { peerProjects: [comparablePeer], includeAiExplanation: false });
  assert.equal(result.priceAssessment.askedPrice, 0);
  assert.equal(result.priceAssessment.currency, "INR");
  assert.equal(result.priceAssessment.mode, "NO_VERIFIED_PRICE_BENCHMARK");
  assert.equal(result.priceAssessment.status, "BENCHMARK_UNAVAILABLE");
  assert.equal(result.priceAssessment.calculatedFairPrice, null);
  assert.match(result.priceAssessment.assessment, /definitive fair-price judgment cannot be made/i);
});

test("no asking price is distinct from an unavailable benchmark", () => {
  const assessment = assessPrice(undefined, "INR");
  assert.equal(assessment.mode, "NO_VERIFIED_PRICE_BENCHMARK");
  assert.equal(assessment.status, "NO_ASKING_PRICE");
  assert.equal(assessment.askedPrice, null);
  assert.equal(assessment.benchmarkPrice, null);
  assert.ok(assessment.limitations.some((limitation) => limitation.includes("no verified transaction")));
});

test("invalid analysis input is rejected without entering pricing", async () => {
  await assert.rejects(() => analyzeProjectPipeline({}, { includeAiExplanation: false }), /Provide a valid projectId or project data/);
});

test("chat request validation and language handling are deterministic", () => {
  assert.equal(parseChatRequest({ question: "कार्बन क्रेडिट क्या है?" }).language, undefined);
  assert.equal(detectLanguage("कार्बन क्रेडिट क्या है?"), "hi");
  assert.equal(detectLanguage("कार्बन क्रेडिट म्हणजे काय आहे?"), "mr");
  assert.equal(detectLanguage("ਕਾਰਬਨ ਕ੍ਰੈਡਿਟ ਕੀ ਹੈ?"), "pa");
  assert.equal(detectLanguage("What is a carbon credit?"), "en");
  assert.throws(() => parseChatRequest({ question: "", language: "en" }), /question/);
  assert.throws(() => parseChatRequest({ question: "hello", language: "fr" }), /language/);
});

test("chat live selection and knowledge metadata remain request-scoped and multilingual", () => {
  const selected = selectRelevantRecords("Which ACR138 listing has integrity score?", [
    { projectId: "OTHER", projectName: "Other project", integrityScore: 90 },
    { projectId: "ACR138", projectName: "Example listing", integrityScore: 75 },
  ], 1);
  assert.equal(selected[0].projectId, "ACR138");
  assert.equal(bhoomiKnowledge.length, 28);
  for (const lang of ["en", "hi", "pa", "mr"]) assert.equal(bhoomiKnowledge.filter((document) => document.lang === lang).length, 7);
  assert.ok(bhoomiKnowledge.every((document) => document.source && document.section && document.lang && document.text));
});

test("analysis resolves English by default and preserves deterministic output across explicit languages", async () => {
  const common = { project: acr138, askedPrice: 500, currency: "INR" };
  const options = { peerProjects: [comparablePeer], includeAiExplanation: false };
  const english = await analyzeProjectPipeline({ ...common, language: "en", question: "Explain this project" }, options);
  const hindi = await analyzeProjectPipeline({ ...common, language: "hi", question: "इस परियोजना की गुणवत्ता समझाइए" }, options);
  const fallback = await analyzeProjectPipeline(common, options);
  assert.equal(english.language, "en");
  assert.equal(hindi.language, "hi");
  assert.equal(fallback.language, "en");
  assert.deepEqual(hindi.integrityScore, english.integrityScore);
  assert.deepEqual(hindi.riskIndicators, english.riskIndicators);
  assert.deepEqual(hindi.priceAssessment, english.priceAssessment);
});

test("analysis supports Punjabi and Marathi configuration and explicit language wins", async () => {
  const options = { peerProjects: [comparablePeer], includeAiExplanation: false };
  const punjabi = await analyzeProjectPipeline({ project: acr138, language: "pa", question: "ਇਸ ਪ੍ਰੋਜੈਕਟ ਬਾਰੇ ਦੱਸੋ" }, options);
  const marathi = await analyzeProjectPipeline({ project: acr138, language: "mr", question: "या प्रकल्पाबद्दल माहिती द्या" }, options);
  const explicitEnglish = await analyzeProjectPipeline({ project: acr138, language: "en", question: "इस परियोजना की गुणवत्ता समझाइए" }, options);
  assert.equal(punjabi.language, "pa");
  assert.equal(marathi.language, "mr");
  assert.equal(explicitEnglish.language, "en");
  assert.match(languageInstruction("pa"), /Punjabi \(pa\)/);
  assert.match(languageInstruction("mr"), /Marathi \(mr\)/);
});

test("analysis language validation is explicit and shared language detection is safe", async () => {
  assert.equal(resolveLanguage(undefined, "इस परियोजना का विश्लेषण हिंदी में समझाइए"), "hi");
  assert.equal(resolveLanguage(undefined, "Bhoomi Carbon ਕੀ ਹੈ?"), "pa");
  assert.equal(resolveLanguage(undefined, "या प्रकल्पाची गुणवत्ता आणि धोके समजावून सांगा"), "mr");
  assert.equal(resolveLanguage(undefined, "Explain the quality and risks of this project"), "en");
  assert.equal(resolveLanguage(undefined), "en");
  assert.equal(resolveLanguage("en", "इस परियोजना का विश्लेषण हिंदी में समझाइए"), "en");
  assert.equal(resolveLanguage("hi", "Explain the quality and risks of this project"), "hi");
  await assert.rejects(() => analyzeProjectPipeline({ project: acr138, language: "fr" as never }, { includeAiExplanation: false }), /Invalid language/);
});

test("analysis automatically resolves Hindi from the supplied Hindi question", async () => {
  const result = await analyzeProjectPipeline({
    project: acr138,
    question: "इस परियोजना का विश्लेषण हिंदी में समझाइए",
  }, { peerProjects: [comparablePeer], includeAiExplanation: false });
  assert.equal(result.language, "hi");
});
