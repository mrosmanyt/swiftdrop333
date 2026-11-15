/** Shared password policy (same bar as scripts/create-admin.ts). */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "at least 8 characters";
  if (!/[a-z]/.test(pw)) return "a lowercase letter";
  if (!/[A-Z]/.test(pw)) return "an uppercase letter";
  if (!/[0-9]/.test(pw)) return "a digit";
  return null;
}
