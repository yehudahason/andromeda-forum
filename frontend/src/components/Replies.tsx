import { useState } from "react";
import Pagination from "./Paginatiom";
import { formatDateFull } from "../utils/formatDateFull";
import { useNavigate } from "react-router-dom";
import { GetAvatar } from "../utils/GetAvatar";
import type { ReplyType } from "../types";
import type { ThreadDetails } from "../types";

type RepliesProp = {
  replies: ReplyType[];
  current: string;
  forum: string;
  id: string;
  total: number;
  tdetails: ThreadDetails | null;
};

export default function Replies({
  id,
  forum,
  total,
  replies,
  current,
  tdetails,
}: RepliesProp) {
  const navigate = useNavigate();
  const [currentPage, setCurrenpage] = useState(+current);

  function handlePage(page: number) {
    setCurrenpage(page);
    navigate(`/forum/${forum}/${id}/?tpage=${page}`);
    scrollToTop();
  }

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };
  return (
    <ul className="w-full flex flex-col gap-8">
      {/* Header */}
      {replies && tdetails && (
        <>
          <li className="flex h-fit items-center justify-between  border-b border-white/15 ">
            <Pagination
              total={total}
              currentPage={currentPage}
              onPageChange={handlePage}
            />
          </li>
          {currentPage === 1 && (
            <li
              key={tdetails.id}
              dir="rtl"
              className=" rounded-md bg-[#555] sm:px-7 p-1 py-5 text-white"
            >
              {/* Header */}

              <div className="w-full flex flex-col gap-4">
                <div className="pb-4 border-b border-b-neutral-500 text-center text-2xl">
                  {tdetails.title}
                </div>

                <div className="flex pr-4 items-center gap-8">
                  <div className="flex flex-col gap-4 justify-center items-center">
                    <span className="wrap-break-word text-center font-medium flex gap-2">
                      <p>{tdetails.author}</p>
                    </span>
                    <span className="">
                      {GetAvatar({
                        name: tdetails.author,
                        image: tdetails.image_url,
                        size: 12,
                      })}
                    </span>
                  </div>
                  <div
                    className="
    w-full
    max-w-full
    min-w-0
    overflow-hidden

    [&>div]:w-full
    [&>div]:max-w-full
    [&>div]:min-w-0

    [&_pre]:w-full
    [&_pre]:max-w-full
    [&_pre]:min-w-0
    [&_pre]:overflow-x-auto
    [&_pre]:whitespace-pre

    [&_code]:block
    [&_code]:max-w-full
    [&_code]:min-w-0
    [&_code]:[direction:ltr]
  "
                    dangerouslySetInnerHTML={{
                      __html: tdetails.content,
                    }}
                  />
                </div>
                <div className="flex sm:flex-row flex-col gap-4 items-center justify-between">
                  <div className=" sm:mr-40 mr-20 flex  gap-4  flex-wrap">
                    <span className="flex flex-wrap gap-2">
                      <p>{formatDateFull(tdetails.created_at)}</p>
                      <p> ב פורום אסטרונומיה</p>
                    </span>
                  </div>

                  <div className="flex gap-4 justify-center items-center">
                    <button className="py-2 px-4 bg-none rounded-lg">
                      שתף
                    </button>
                    <button className="py-2 px-4 bg-gray-300 text-black rounded-lg">
                      עקוב
                    </button>
                  </div>
                </div>
              </div>
            </li>
          )}
        </>
      )}

      {replies.map((reply) => (
        <li
          key={reply.id}
          dir="rtl"
          className=" rounded-md bg-[#555] sm:px-5 p-1 py-4 text-white"
        >
          {/* Header */}

          <div className="w-full flex gap-4 min-w-0">
            <div className="flex w-30 shrink-0 flex-col justify-start pt-6 gap-6 items-center">
              <span className="text-center">{reply.author.name}</span>

              {GetAvatar({
                name: reply.author.name,
                image: reply.author.image_url,
                size: 10,
              })}

              <span className="flex items-center gap-1 text-sm">
                {reply.author.replies_counts}
                <span>💬</span>
              </span>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <p className="w-full text-right text-sm text-gray-200">
                {formatDateFull(reply.created_at)}
              </p>

              <div className="border-b border-b-gray-500 min-w-0">
                <h2 className="mb-2 text-lg font-medium">{reply.title}</h2>

                <div
                  className="
          w-full
          max-w-full
          min-w-0
          overflow-hidden
          text-base
          mb-6
          leading-8
          wrap-anywhere
          text-gray-100

          [&>div]:max-w-full
          [&>div]:min-w-0

          [&_p]:max-w-full
          [&_p]:break-words

          [&_pre]:block
          [&_pre]:w-full
          [&_pre]:max-w-full
          [&_pre]:min-w-0
          [&_pre]:overflow-x-auto
          [&_pre]:whitespace-pre

          [&_code]:block
          [&_code]:max-w-full
          [&_code]:min-w-0
          [&_code]:font-mono
          [&_code]:[direction:ltr]
        "
                  dangerouslySetInnerHTML={{
                    __html: reply.post,
                  }}
                />
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
          total={total}
          currentPage={currentPage}
          onPageChange={handlePage}
        />
      </li>
    </ul>
  );
}
