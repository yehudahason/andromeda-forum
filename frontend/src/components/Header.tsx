import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../utils/getMe";
import { authClient } from "../lib/auth";
import { useUserStore } from "../stores/userStore";
import { useSessionStore } from "../stores/sessionStore";
export default function Header() {
  const [tzurMenu, setTzurMenu] = useState<boolean>(false);
  const [notiMenu, setNotiMenu] = useState<boolean>(false);
  const [mailMenu, setMailMenu] = useState<boolean>(false);
  //   const [mailMenu, setMailMenu] = useState<boolean>(false);

  const baseUrl = import.meta.env.BASE_URL;
  const { user, setUser } = useUserStore((state) => state);
  const setSession = useSessionStore((state) => state.setSession);
  const handleSignOut = async () => {
    console.log("1. sign out clicked");

    try {
      console.log("2. calling Better Auth");

      const result = await authClient.signOut();

      console.log("3. signOut result:", result);

      if (result.error) {
        console.error("Sign out failed:", result.error);
        return;
      }

      setSession(null);
      setUser(null);

      console.log("4. signed out");

      window.location.href = "/";
    } catch (error) {
      console.error("5. signOut exception:", error);
    }
  };

  async function getS() {
    try {
      const res = await getMe();
      console.log(res);
      return res;
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    async function loadUser() {
      const user = await getMe();
      setUser(user);
    }
    loadUser();
  }, [setUser]);

  return (
    <div className="flex flex-col">
      <header className="bg-black w-full h-20">
        <div className="mx-auto max-w-[1280px] px-4 w-full justify-between flex flex-row items-center ">
          <a href="/" className="h-20">
            <img
              className="h-full sm:w-full w-[15rem] object-cover"
              src={`${baseUrl}pm.png`}
              alt=""
            />
          </a>
          <img
            className="md:hidden block"
            src={`${baseUrl}account.png`}
            alt=""
          />
          <ul className="md:flex  hidden items-center h-18 py-8  flex-row justify-end ">
            <li className="group relative flex  border-l border-l-blue-200 px-3 text-white">
              <button
                onClick={() => {
                  setNotiMenu(false);
                  setMailMenu(false);
                  setTzurMenu(!tzurMenu);
                  getS();
                }}
                className="cursor-pointer flex items-center gap-1"
              >
                <img src={`${baseUrl}add.png`} alt="" />
                <span>צור</span>
              </button>

              <ul
                className={`${tzurMenu ? "visible opacity-100" : "opacity-0 invisible"}
       absolute right-[-65%] top-[140%] z-50
      w-62 rounded-md bg-neutral-600
       text-right  shadow-lg
      transition
      
  `}
              >
                {/* Triangle */}
                <div
                  className="
        absolute -top-2 right-1/2 translate-x-1/2
        border-l-8 border-r-8 border-b-8
        border-l-transparent border-r-transparent
        border-b-neutral-600
      "
                />

                <li>
                  <a
                    href="#"
                    className="block  p-2 rounded-md text-white hover:bg-neutral-500"
                  >
                    נושא חדש
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="block  rounded-md p-2 text-white hover:bg-neutral-500"
                  >
                    קובץ להורדה
                  </a>
                </li>
              </ul>
            </li>
            <li className="px-2 relative flex justify-center items-center">
              <button
                onClick={() => {
                  setTzurMenu(false);
                  setMailMenu(false);
                  setNotiMenu(!notiMenu);
                }}
              >
                <img src={`${baseUrl}notifications.png`} alt="" />
              </button>

              <ul
                className={`${notiMenu ? "visible opacity-100" : "opacity-0 invisible"}
       absolute -left-40 top-[140%] z-50
      w-92 rounded-md bg-neutral-600
       text-right  shadow-lg
      transition 
      
  `}
              >
                {/* Triangle */}
                <div
                  className="
        absolute -top-2 right-1/2 translate-x-1/2
        border-l-8 border-r-8 border-b-8
        border-l-transparent border-r-transparent
        border-b-neutral-600
      "
                />

                <li
                  className="flex justify-between items-center px-4 py-6
                border-b border-b-gray-400
                "
                >
                  <h3 className="text-white ">התראות</h3>
                  <a
                    href=""
                    className="text-sky-400
                  flex justify-center items-center gap-2
                  "
                  >
                    <img src={`${baseUrl}settings_sky.png`} alt="" />
                    הגדרות התראות
                  </a>
                </li>
                <li className="border-b border-b-gray-400 px-4 py-6 text-white text-center ">
                  אין התראות להצגה
                </li>
                <li className="flex flex-row justify-center items-center text-sky-400 px-4 py-6">
                  <a
                    href="#"
                    className=" flex flex-row justify-center items-center rounded-md gap-2 hover:bg-neutral-500"
                  >
                    <img src={`${baseUrl}menu_sky.png`} alt="" />
                    צפה בכל ההתראות
                  </a>
                </li>
              </ul>
            </li>

            <li className="px-2 border-l border-l-blue-200  relative flex justify-center items-center">
              <button
                onClick={() => {
                  setNotiMenu(false);
                  setTzurMenu(false);
                  setMailMenu(!mailMenu);
                }}
              >
                <img src={`${baseUrl}mail.png`} alt="" />
              </button>

              <ul
                className={`${mailMenu ? "visible opacity-100" : "opacity-0 invisible"}
       absolute -left-40 top-[140%] z-50
      w-92 rounded-md bg-neutral-600
       text-right  shadow-lg
      transition 
      
  `}
              >
                {/* Triangle */}
                <div
                  className="
        absolute -top-2 right-1/2 translate-x-1/2
        border-l-8 border-r-8 border-b-8
        border-l-transparent border-r-transparent
        border-b-neutral-600
      "
                />

                <li
                  className="flex justify-between items-center px-4 py-6
                border-b border-b-gray-400
                "
                >
                  <h3 className="text-white font-semibold ">הודעות פרטיות</h3>
                  <a
                    href=""
                    className="bg-sky-400 px-2 py-1 rounded-lg text-black
                  flex justify-center items-center gap-2
                  "
                  >
                    צור הודעה פרטית חדשה
                  </a>
                </li>
                <li className="border-b border-b-gray-400 px-4 py-6 text-white text-center ">
                  אין הודעות פרטיות להציג
                </li>
                <li className="flex flex-row justify-center items-center text-sky-400 px-4 py-6">
                  <a
                    href="#"
                    className=" flex flex-row justify-center items-center rounded-md gap-2 hover:bg-neutral-500"
                  >
                    <img src={`${baseUrl}menu_sky.png`} alt="" />
                    לך לתיבת ההודעות
                  </a>
                </li>
              </ul>
            </li>

            <li className="px-2 flex gap-3 text-white">
              <img
                className="w-6  h-6 rounded-full"
                src={`${baseUrl}Ypic.svg`}
                alt=""
              />
              <span className="flex  truncate">
                {user?.name}
                <img src={`${baseUrl}arrowdown.png`} alt="" />
              </span>
            </li>
            <li></li>
          </ul>
        </div>
      </header>
      <nav className="flex justify-center gap-4 bg-neutral-600 h-12 p-2 w-full">
        <div className="flex max-w-[1280px]  p-4 flex-row justify-between w-full items-center">
          <img
            className="sm:hidden block"
            src={`${baseUrl}menu_sky.png`}
            alt=""
          />
          <ul className="sm:flex hidden items-center gap-4 text-lg font-medium text-white">
            <li>
              <Link to="/forum/1">פורומים</Link>
            </li>
            <li>מה חדש</li>
            <li>בלוגים</li>
            <li>אודות</li>
          </ul>
          <img
            className="md:hidden block"
            src={`${baseUrl}search.png`}
            alt=""
          />
          <div className="md:flex hidden">
            <form className="relative w-full max-w-md">
              <input
                type="search"
                placeholder="חיפוש..."
                dir="rtl"
                className="
      h-8 w-full rounded-full
      bg-white
      px-5 pl-12
      text-right text-neutral-700
      outline-none
      placeholder:text-neutral-500
    "
              />

              <button
                type="submit"
                aria-label="חיפוש"
                className="
      absolute left-4 top-1/2
      -translate-y-1/2
      text-neutral-900
    "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </nav>
    </div>
  );
}
