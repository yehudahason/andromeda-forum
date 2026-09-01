import { useState } from "react";
import Pagination from "./Paginatiom";
import { formatDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";

import type { ThreadType } from "../types";
type ThreadListProps = {
  threads: ThreadType[];
  current: string;
  forum: string;
  total: number;
};

export default function ThreadList({
  forum,
  threads,
  current,
  total,
}: ThreadListProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrenpage] = useState(+current);

  function handlePage(page: number) {
    setCurrenpage(page);
    navigate(`/forum/${forum}/?page=${page}`);
    scrollToTop();
  }

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };
  return (
    <>
      <div className="flex h-fit items-center justify-between border-b mb-4 border-white/15 ">
        <Pagination
          total={total}
          currentPage={currentPage}
          onPageChange={handlePage}
        />
      </div>
      <ul className="w-full overflow-hidden rounded-md bg-[#555] text-white">
        {/* Header */}
        <li className="flex h-fit items-center justify-between border-b border-white/15 "></li>

        {threads.map((thread) => (
          <li
            key={thread.id}
            dir="rtl"
            className="grid min-h-[120px] p-4 gap-4 grid-cols-1 sm:grid-cols-[1fr_100px_1fr] items-center border-b 
           border-white/15  last:border-b-0"
          >
            {/* Forum */}
            <div className="flex justify-start min-w-0 items-center gap-5 text-right">
              {/* Text */}
              <div className="min-w-0">
                <a
                  href={`/forum/${thread.forum_id}/${thread.id}`}
                  className="block flex-1  truncate text-[20px] font-medium text-[#0BD7FD] hover:underline"
                >
                  {thread.title}
                </a>

                <p className="truncate text-[16px] text-white">
                  <span>נפתח על ידי -</span>
                  <span>
                    {thread.author} {formatDate(thread.created_at)}
                  </span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="sm:text-center text-right px-2">
              <p className="text-2xl">
                {thread.messages_count.toLocaleString()}
              </p>

              <p className="text-sm text-white/90">הודעות</p>
            </div>

            {/* Last post */}
            <div className="min-w-0 text-right px-2">
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
                    {formatDate(thread.last_post_date)}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex h-fit items-center justify-between border-b border-white/15 ">
        <Pagination
          total={total}
          currentPage={currentPage}
          onPageChange={handlePage}
        />
      </div>
    </>
  );
}
