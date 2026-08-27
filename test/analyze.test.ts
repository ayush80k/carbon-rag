import { analyzeProjectPipeline } from '../src/analyzeProject';

async function runTests() {
  console.log("--- Test 1: Raw Missing Data Object ---");
  const rawTest = await analyzeProjectPipeline({
    project: { type: "Forestry", region: "South America" },
    askedPrice: 15
  });
  console.log(`Score: ${rawTest.integrityScore.totalScore}, Risk: ${rawTest.riskIndicators.riskLevel}\n`);

  console.log("--- Test 2: Invalid Project ID Fallback ---");
  try {
    await analyzeProjectPipeline({ projectId: "INVALID_999" });
  } catch (e: any) {
    console.log(`Successfully caught invalid ID: ${e.message}\n`);
  }
}

runTests().catch(console.error);