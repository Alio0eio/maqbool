/** Where the product app lives. Override per environment with VITE_APP_URL. */
export const APP_URL: string = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:3000';

export const DEMO_URL = `${APP_URL}/?role=recruiter`;
export const SIGN_IN_URL = `${APP_URL}/?mode=signin`;
export const CANDIDATE_URL = `${APP_URL}/?role=candidate&mode=signup`;
