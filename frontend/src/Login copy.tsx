import { useState, useEffect, useRef } from "react";
import { authClient } from "./lib/auth.ts";
import { useSessionStore } from "./stores/sessionStore.ts";
import { loadSession } from "./lib/loadSession.ts";
import { useNavigate } from "react-router-dom";
import Or from "./components/Or.tsx";
import { getMe } from "./utils/getMe.ts";

export type Session = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>["data"]
>;

export type User = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>["data"]
>["user"];

type LoginProps = {
  setIsLogin: (value: boolean) => void;
  signUp: boolean;
};
export default function Login({ setIsLogin, signUp }: LoginProps) {
  const navigate = useNavigate();
  const { session, setSession } = useSessionStore((state) => state);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(signUp);
  const [openLogin, setOpenLogin] = useState(true);
  const [msg, setMsg] = useState<string | undefined>("");
  const [username, setUserName] = useState<string | undefined>(undefined);

  const baseUrl = import.meta.env.BASE_URL;
  const menuRef = useRef<HTMLDivElement>(null);

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenLogin(false);
        setIsLogin(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsLogin]);

  // Keyboard navigation: Close modal on Escape press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openLogin) {
        setOpenLogin(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openLogin]);

  useEffect(() => {
    if (session) {
      navigate("/");
      console.log(getMe());
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: username ?? (email.split("@")[0] || "User"),
            email,
            password,
          })
        : await authClient.signIn.email({
            email,
            password,
          });

      if (result.error) {
        setMsg(result.error?.message);
        return;
      }

      const sessionResult = await authClient.getSession();

      if (sessionResult.data?.session && sessionResult.data?.user) {
        setSession(sessionResult.data.session);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log(e);
        setMsg(e.message);
      }
    }
  };

  return (
    <>
      {/* Backdrop overlay for focus management and screen reader context */}
      {openLogin && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          aria-hidden="true"
          onClick={() => getMe()}
        />
      )}

      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!openLogin}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-[87%] sm:max-w-md
  rounded-2xl bg-white p-4 sm:px-6 shadow-lg
  -translate-x-1/2 transition-all duration-300
  ${
    openLogin
      ? "visible translate-y-[-50%] opacity-100"
      : "invisible translate-y-[-60%] opacity-0 pointer-events-none"
  }
`}
      >
        <div className="text-center relative">
          <button
            type="button"
            onClick={() => setOpenLogin(false)}
            aria-label="Close modal"
            className="absolute top-1 cursor-pointer right-1 h-6 w-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <img
              className="w-full h-auto"
              src={`${baseUrl}close.png`}
              alt=""
              aria-hidden="true"
            />
          </button>
          <h1
            id="modal-title"
            className="sm:text-3xl text-xl font-bold tracking-tight text-gray-900"
          >
            {isSignUp ? "צור חשבון" : "כניסה"}
          </h1>

          <p id="modal-description" className="mt-2 text-sm text-gray-500">
            {isSignUp ? "הרשם לפורום" : "הכנס לפורום"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
          {isSignUp && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                שם משתמש
              </label>

              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                required
                aria-required="true"
                aria-invalid={msg ? "true" : "false"}
                aria-describedby={msg ? "auth-error-message" : undefined}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              כתובת אימייל
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-invalid={msg ? "true" : "false"}
              aria-describedby={msg ? "auth-error-message" : undefined}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ססמה
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              aria-invalid={msg ? "true" : "false"}
              aria-describedby={msg ? "auth-error-message" : undefined}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          {/* Error Message Announcement for Screen Readers */}
          <div
            aria-live="assertive"
            aria-atomic="true"
            className="min-h-[1.5rem]"
          >
            {msg && (
              <span
                id="auth-error-message"
                className="text-center block text-red-700 text-sm font-medium"
              >
                {msg}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="cursor-pointer w-full rounded-lg bg-gray-900 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            {isSignUp ? "צור חשבון" : "כניסה לרשומים"}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex cursor-pointer w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            המשך עם גוגל
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.21 2.91-7.42Z"
              />
              <path
                fill="#34A853"
                d="M12 21.75c2.63 0 4.84-.87 6.46-2.35l-3.14-2.45c-.87.58-1.98.92-3.32.92-2.55 0-4.71-1.72-5.49-4.04H3.27v2.53A9.75 9.75 0 0 0 12 21.75Z"
              />
              <path
                fill="#FBBC05"
                d="M6.51 13.83A5.86 5.86 0 0 1 6.2 12c0-.64.11-1.26.31-1.83V7.64H3.27A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.02 4.36l3.24-2.53Z"
              />
              <path
                fill="#EA4335"
                d="M12 6.13c1.43 0 2.72.49 3.74 1.45l2.8-2.8C16.84 3.21 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.73 5.39l3.24 2.53C7.29 7.85 9.45 6.13 12 6.13Z"
              />
            </svg>
          </button>
        </form>

        <Or />

        <p className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? (
            <>
              יש לך כבר חשבון?
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="px-2 cursor-pointer font-semibold text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-900 rounded"
              >
                הכנס.
              </button>
            </>
          ) : (
            <>
              אין לך חשבון ?
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="px-2 cursor-pointer font-semibold text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-900 rounded"
              >
                הרשם.
              </button>
            </>
          )}
        </p>
      </div>
    </>
  );
}
