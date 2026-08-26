import { useState } from "react";
import Pagination from "./Paginatiom";
import { formatDateFull } from "../utils/formatDateFull";
import { useNavigate } from "react-router-dom";
import { GetAvatar } from "../utils/GetAvatar";
import type { ReplyType } from "../types";
type RepliesProp = {
  replies: ReplyType[];
  current: string;
  forum: string;
  id: string;
};

export default function Replies({ id, forum, replies, current }: RepliesProp) {
  const navigate = useNavigate();
  const [currentPage, setCurrenpage] = useState(+current);

  function handlePage(page: number) {
    setCurrenpage(page);
    navigate(`/forum/${forum}/${id}/?tpage=${page}`);
  }
  return (
    <ul className="w-full flex flex-col gap-8">
      {/* Header */}
      <li className="flex h-fit items-center justify-between border-b border-white/15 ">
        <Pagination
          total={5000}
          currentPage={currentPage}
          onPageChange={handlePage}
        />
      </li>

      {replies.map((reply) => (
        <li
          key={reply.id}
          dir="rtl"
          className=" rounded-md bg-[#555] sm:px-5 p-1 py-4 text-white"
        >
          {/* Header */}

          <div className="w-full flex gap-4">
            <div className="flex w-30 flex-col justify-start pt-6 gap-6 items-center">
              <span className="text-center">{reply.author.name}</span>
              {GetAvatar(reply.author)}

              {/* Replies count */}
              <span className="flex items-center gap-1 text-sm">
                {reply.author.replies_counts}
                <span>💬</span>
              </span>
            </div>
            <div className="flex  flex-col w-full">
              <p className="  w-full text-right   text-sm  text-gray-200">
                {formatDateFull(reply.created_at)}
              </p>

              {/* Content */}
              <div className=" border-b  border-b-gray-500">
                <h2 className="mb-2 text-lg font-medium">{reply.title}</h2>

                <p className="text-base mb-6 leading-8 wrap-anywhere text-gray-100">
                  <pre className="whitespace-pre-wrap">{reply.post}</pre>
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 w-full flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Quote */}
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>ציטוט</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded bg-white text-black">
                      ✓
                    </span>
                  </button>
                </div>
                {/* Like */}
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-2xl text-white"
                >
                  ♥
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
      <li className="flex h-fit items-center justify-between border-b border-white/15 ">
        <Pagination
          total={5000}
          currentPage={currentPage}
          onPageChange={handlePage}
        />
      </li>
    </ul>
  );
}
