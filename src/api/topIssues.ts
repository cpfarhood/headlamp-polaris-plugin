import { AuditData } from './polaris';
import { getCheckName, getCheckCategory } from './checkMapping';

export interface TopIssue {
  checkId: string;
  checkName: string;
  category: 'Security' | 'Efficiency' | 'Reliability';
  severity: 'danger' | 'warning';
  count: number;
}

/**
 * Extract the most common failing checks across the cluster
 * Returns top 10 issues sorted by severity then count
 */
export function getTopIssues(data: AuditData): TopIssue[] {
  const issueCounts = new Map<string, { severity: 'danger' | 'warning'; count: number }>();

  // Aggregate all failing checks
  for (const result of data.Results) {
    // Pod-level checks
    if (result.PodResult?.Results) {
      for (const [checkId, checkResult] of Object.entries(result.PodResult.Results)) {
        if (!checkResult.Success && checkResult.Severity !== 'ignore') {
          const existing = issueCounts.get(checkId);
          issueCounts.set(checkId, {
            severity: checkResult.Severity as 'danger' | 'warning',
            count: (existing?.count || 0) + 1,
          });
        }
      }
    }

    // Container-level checks
    if (result.PodResult?.ContainerResults) {
      for (const container of result.PodResult.ContainerResults) {
        for (const [checkId, checkResult] of Object.entries(container.Results)) {
          if (!checkResult.Success && checkResult.Severity !== 'ignore') {
            const existing = issueCounts.get(checkId);
            issueCounts.set(checkId, {
              severity: checkResult.Severity as 'danger' | 'warning',
              count: (existing?.count || 0) + 1,
            });
          }
        }
      }
    }

    // Controller-level checks (if any)
    if (result.Results) {
      for (const [checkId, checkResult] of Object.entries(result.Results)) {
        if (!checkResult.Success && checkResult.Severity !== 'ignore') {
          const existing = issueCounts.get(checkId);
          issueCounts.set(checkId, {
            severity: checkResult.Severity as 'danger' | 'warning',
            count: (existing?.count || 0) + 1,
          });
        }
      }
    }
  }

  // Convert to array and format
  const issues: TopIssue[] = Array.from(issueCounts.entries()).map(([checkId, data]) => ({
    checkId,
    checkName: getCheckName(checkId),
    category: getCheckCategory(checkId),
    severity: data.severity,
    count: data.count,
  }));

  // Sort by severity (danger first) then by count (descending)
  issues.sort((a, b) => {
    if (a.severity === 'danger' && b.severity !== 'danger') return -1;
    if (a.severity !== 'danger' && b.severity === 'danger') return 1;
    return b.count - a.count;
  });

  // Return top 10
  return issues.slice(0, 10);
}
