import { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const baseUrl = import.meta.env.BASE_URL;
  const [tzurMenu, setTzurMenu] = useState<boolean>(false);
  const [notiMenu, setNotiMenu] = useState<boolean>(false);
  const [mailMenu, setMailMenu] = useState<boolean>(false);
  //   const [mailMenu, setMailMenu] = useState<boolean>(false);

  return (
    <div className="flex flex-col">
      <header className="bg-black w-full h-18">
        <div className="mx-auto max-w-[1280px] px-4 w-full justify-between flex flex-row items-center ">
          <a href="" className="h-18">
            <img
              className="h-full object-cover"
              src={`${baseUrl}andrologo.png`}
              alt=""
            />
          </a>
          <ul className=" items-center h-18 py-8 flex flex-row justify-end ">
            <li className="group relative flex  border-l border-l-blue-200 px-3 text-white">
              <button
                onClick={() => {
                  setNotiMenu(false);
                  setMailMenu(false);
                  setTzurMenu(!tzurMenu);
                }}
                className="cursor-pointer flex items-center gap-1"
              >
                <img src={`${baseUrl}add.png`} alt="" />
                <span>צור</span>
                <img src={`${baseUrl}arrowdown.png`} alt="" />
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
                    className="block  p-4 rounded-md text-white hover:bg-neutral-500"
                  >
                    נושא חדש
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    className="block  rounded-md p-4 text-white hover:bg-neutral-500"
                  >
                    קובץ להורדה
                  </a>
                </li>
              </ul>
            </li>
            <li className="px-3 relative flex justify-center items-center">
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

            <li className="px-3 border-l border-l-blue-200  relative flex justify-center items-center">
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

            <li className="px-3 flex gap-3 text-white">
              <img
                className="w-6  h-6 rounded-full"
                src={`${baseUrl}Ypic.svg`}
                alt=""
              />
              <span className="flex ">
                Yehuda hason <img src={`${baseUrl}arrowdown.png`} alt="" />
              </span>
            </li>
            <li></li>
          </ul>
        </div>
      </header>
      <nav className="flex justify-center gap-4 bg-neutral-600 h-12 p-2 w-full">
        <div className="flex max-w-[1280px]  p-4 flex-row justify-between w-full items-center">
          <ul className="flex">
            <li>פורומים</li>
            <li>מאמרים</li>
            <li>בלוגים</li>
            <li>לוח שנה אסטרונומי</li>
          </ul>
          <div className="flex">
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
