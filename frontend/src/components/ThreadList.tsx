import { useState } from "react";
import Pagination from "./Paginatiom";

type ThreadType = {
  id: string;
  title: string;
  author: string;
  post: string;
  messages_count: number;
  last_post_title: string | null;
  last_post_author: string | null;
  last_post_date: string | null;
  image_url: string | null;
};

type ThreadListProps = {
  threads: ThreadType[];
};

export default function ThreadList({ threads }: ThreadListProps) {
  const [currentPage, setCurrenpage] = useState(1);
  return (
    <ul className="w-full overflow-hidden rounded-md bg-[#555] text-white">
      {/* Header */}
      <li className="flex h-fit items-center justify-between border-b border-white/15 ">
        <Pagination
          totalThreads={5000}
          currentPage={currentPage}
          onPageChange={setCurrenpage}
        />
      </li>

      {threads.map((thread) => (
        <li
          key={thread.id}
          dir="rtl"
          className="grid min-h-[120px] py-4 gap-4 grid-cols-1 sm:grid-cols-[1fr_100px_1fr] items-center border-b 
           border-white/15  last:border-b-0"
        >
          {/* Forum */}
          <div className="flex justify-start min-w-0 items-center gap-5 text-right">
            {/* Menu */}
            <button className="w-4 text-3xl leading-none text-black">⋮</button>
            {/* Image */}

            {/* Text */}
            <div className="min-w-0">
              <a
                href="#"
                className="block flex-1 truncate text-[20px] font-medium text-[#0BD7FD] hover:underline"
              >
                {thread.title}
              </a>

              <p className="truncate text-[16px] text-white">
                נפתח על ידי -{thread.author}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="sm:text-center text-right px-8">
            <p className="text-2xl">{thread.messages_count.toLocaleString()}</p>

            <p className="text-sm text-white/90">הודעות</p>
          </div>

          {/* Last post */}
          <div className="min-w-0 text-right px-8">
            {thread.last_post_title && (
              <a
                href="#"
                className="block truncate text-[18px] text-[#0BD7FD] hover:underline"
              >
                {thread.last_post_title}
              </a>
            )}
            <div className="flex items-center gap-1">
              {thread.last_post_author && (
                <p className="mt-1 text-sm text-white">
                  על-ידי {thread.last_post_author}
                </p>
              )}
              ,
              {thread.last_post_date && (
                <p className="text-sm mt-1 text-white">
                  {thread.last_post_date}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
