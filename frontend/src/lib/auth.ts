import { createAuthClient } from "@neondatabase/neon-js/auth";

console.log(import.meta.env.VITE_NEON_AUTH_URL);
export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);
