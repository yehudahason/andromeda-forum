import { create } from "zustand";
import type { Session } from "../Home";

type SessionStore = {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
};
export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  loading: true,
  setLoading: (loading) => set({ loading }),
  setSession: (session) => set({ session }),
}));
