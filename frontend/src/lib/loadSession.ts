import { authClient } from "./auth";
import { useSessionStore } from "../stores/sessionStore";

export const loadSession = async () => {
  const store = useSessionStore.getState();

  store.setLoading(true);

  try {
    const { data } = await authClient.getSession();

    store.setSession(data);
  } catch (e) {
    console.log(e);
  } finally {
    store.setLoading(false);
  }
};
