import { ApplicationStatus } from "@workspace/api-client-react";

const WITHDRAWABLE_APPLICATION_STATUSES = new Set<string>([
  ApplicationStatus.applied,
  ApplicationStatus.reviewing,
  ApplicationStatus.shortlisted,
  ApplicationStatus.interviewing,
]);

export function isApplicationWithdrawable(status: string): boolean {
  return WITHDRAWABLE_APPLICATION_STATUSES.has(status);
}
