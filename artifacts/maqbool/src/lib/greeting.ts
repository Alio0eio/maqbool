/** "Good morning, Alex" — time-of-day greeting using the user's first name. */
export function greeting(fullName?: string | null, now = new Date()) {
  const h = now.getHours();
  const part = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? `${part}, ${first}` : part;
}
