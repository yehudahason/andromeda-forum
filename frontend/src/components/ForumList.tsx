import { formatDate } from "../utils/formatDate";

import type { ForumType } from "../types";
import type { CreateForumData } from "../fetchMethods/createForum";
type ForumListProps = {
  forums: ForumType[];
  setDataU: React.Dispatch<CreateForumData>;
  setShowMenu: (value: boolean) => void;
};

export default function ForumList({
  forums,
  setDataU,
  setShowMenu,
}: ForumListProps) {
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <ul className="w-full overflow-hidden rounded-md bg-[#555] text-white">
      {forums.map((forum) => (
        <li
          key={forum.id}
          dir="rtl"
          className="grid min-h-[120px] relative py-4 gap-4 grid-cols-1 sm:grid-cols-[1fr_100px_1fr] items-center border-b 
           border-white/15 relative cursor-pointer last:border-b-0"
        >
          <button
            className="absolute top-2 left-2"
            onClick={() => {
              setDataU({
                id: +forum.id,
                name: forum.name,
                description: forum.description,
                sort_order: forum.sort_order,
              });
              setShowMenu(true);
            }}
          >
            <img src={`${baseUrl}edit.png`} alt="" />
          </button>
          {/* Forum */}
          <div className="flex absolute top-2 right-2">{forum.sort_order}</div>
          <div className="flex justify-start min-w-0 items-center gap-5 text-right">
            {/* Menu */}
            <button className="w-4 text-3xl leading-none text-black">⋮</button>
            {/* Image */}

            {/* Text */}
            <div className="min-w-0">
              <a
                href={`/forum/${forum.id}`}
                className="block flex-1 truncate text-[20px] font-medium text-[#0BD7FD] hover:underline"
              >
                {forum.name}
              </a>

              <p className="truncate text-[16px] text-white">
                {forum.description}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="sm:text-center text-right px-8">
            <p className="text-2xl">{forum.messages_count.toLocaleString()}</p>

            <p className="text-sm text-white/90">הודעות</p>
          </div>

          {/* Last post */}
          <div className="min-w-0 text-right px-8">
            {forum.last_post_title && (
              <a
                href={`/forum/${forum.id}/${forum.last_post_thread_id}`}
                className="block truncate text-[18px] text-[#0BD7FD] hover:underline"
              >
                {forum.last_post_title}
              </a>
            )}
            <div className="flex items-center gap-1">
              {forum.last_post_author && (
                <p className="mt-1 text-sm text-white">
                  על-ידי {forum.last_post_author}
                </p>
              )}
              ,
              {forum.last_post_date && (
                <p className="text-sm mt-1 text-white">
                  {formatDate(forum.last_post_date)}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
