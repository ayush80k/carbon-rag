import { NormalizedProject } from "../../src/types.js";

export const acr138: NormalizedProject = {
  projectId: "ACR138", projectName: "Truck Stop Electrification, Indiana", registry: "ACR", voluntaryStatus: "Completed",
  scope: "Transportation", type: "Truck Stop Electrification", reductionRemoval: "Reduction",
  methodology: "Emissions Reductions through Anti-Idling Technologies", methodologyVersion: null,
  region: "North America", country: "United States", vintage: 2006, verifier: "TÜV SÜD America, Inc.",
  totalCreditsIssued: 12150, totalCreditsRetired: 12150, totalCreditsRemaining: 0,
  totalBufferPoolDeposits: 0, reversalsCoveredByBufferPool: 0, uncoveredReversals: false,
  bufferCreditsReleasedToProject: 0, arbWaStatus: null, certifications: null, registryDocuments: "https://registry.example/acr138",
  projectWebsite: "https://example.com/acr138", raw: { source: "test fixture" },
};

export const comparablePeer: NormalizedProject = {
  ...acr138, projectId: "PEER-1", projectName: "Comparable Truck Stop Project", vintage: 2018,
};
