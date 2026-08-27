import { NormalizedProject, PeerComparison } from "./types.js";
import { loadProjects } from "./projectLoader.js";
import { calculateIntegrityScore } from "./scoring.js";

/** An optional project list keeps deterministic tests independent of Excel. */
export function comparePeers(targetProject: NormalizedProject, projects = loadProjects()): PeerComparison {
  const scoredPeers = projects
    .filter((project) => project.projectId !== targetProject.projectId)
    .map((project) => {
      let similarity = 0;
      if (project.type && project.type === targetProject.type) similarity += 3;
      if (project.country && project.country === targetProject.country) similarity += 2;
      if (project.registry && project.registry === targetProject.registry) similarity += 1;
      if (project.methodology && project.methodology === targetProject.methodology) similarity += 2;
      return { project, similarity };
    })
    .filter(({ similarity }) => similarity >= 4)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  if (!scoredPeers.length) return { peerCount: 0, comparableProjects: [], averageScore: null, medianScore: null, comparisonSummary: "No sufficiently comparable projects are available in the supplied dataset." };
  const scores = scoredPeers.map(({ project }) => calculateIntegrityScore(project).overallIntegrityScore).sort((a, b) => a - b);
  const averageScore = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const medianScore = scores.length % 2 ? scores[(scores.length - 1) / 2] : Math.round((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2);
  return {
    peerCount: scores.length,
    comparableProjects: scoredPeers.map(({ project }) => ({ projectId: project.projectId, projectName: project.projectName })),
    averageScore,
    medianScore,
    comparisonSummary: `Compared with ${scores.length} available peers matched by project type, country, registry, and/or methodology. This is an integrity-score comparison, not a price benchmark.`,
  };
}
