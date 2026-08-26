import type { GhostFlowRefreshIssue, GhostFlowStageResult } from '../types';

export function mapperBlockIssue(
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

export function mapperFail(code: string, message: string): GhostFlowStageResult<never> {
  return { ok: false, issues: [mapperBlockIssue(code, message)] };
}
