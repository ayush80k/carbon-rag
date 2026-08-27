import { NormalizedProject, PeerComparison } from './types';
import { loadProjects } from './projectLoader';
import { calculateIntegrityScore } from './scoring';

export function comparePeers(targetProject: Partial<NormalizedProject>): PeerComparison {
  const allProjects = loadProjects();
  if (allProjects.length === 0) {
    return { peerCount: 0, comparableProjects: [], averageScore: null, medianScore: null, comparisonSummary: "Dataset unavailable for peer matching." };
  }

  const scoredPeers = allProjects
    .filter(p => p.projectId !== targetProject.projectId)
    .map(p => {
      let similarity = 0;
      if (p.type === targetProject.type) similarity += 3;
      if (p.country === targetProject.country) similarity += 2;
      if (p.registry === targetProject.registry) similarity += 1;
      if (p.methodology === targetProject.methodology) similarity += 2;
      return { project: p, similarity };
    })
    .filter(p => p.similarity > 3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  if (scoredPeers.length === 0) {
    return { peerCount: 0, comparableProjects: [], averageScore: null, medianScore: null, comparisonSummary: "No highly comparable peers located." };
  }

  const scores = scoredPeers.map(sp => calculateIntegrityScore(sp.project).totalScore).sort((a, b) => a - b);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const med = scores[Math.floor(scores.length / 2)];

  return {
    peerCount: scores.length,
    comparableProjects: scoredPeers.map(sp => ({ projectId: sp.project.projectId, projectName: sp.project.projectName })),
    averageScore: avg,
    medianScore: med,
    comparisonSummary: `Compared against ${scores.length} similar projects (Type/Region matched). Target score benchmarking supported.`
  };
}