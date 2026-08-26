import { authClient } from "./auth";

export async function getAuthToken() {
  const result = await authClient.getSession();

  if (!result.data?.session) {
    throw new Error("Not authenticated");
  }

  return result.data.session.token;
}
