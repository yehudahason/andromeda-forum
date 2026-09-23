import { useQuery } from "@tanstack/react-query";
import { getLatestPosts } from "../fetchMethods/getLatestPosts";
import type { LatestPost } from "../types";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDateFull } from "../utils/formatDateFull";
export default function NewPosts() {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["newPosts", page],
    queryFn: () => getLatestPosts(page),
  });

  function truncateHtml(html: string, maxChars = 200) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let count = 0;
    let finished = false;

    function walk(node: Node) {
      if (finished) {
        node.parentNode?.removeChild(node);
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        const remaining = maxChars - count;

        if (text.length > remaining) {
          node.textContent = text.slice(0, remaining) + "...";
          finished = true;
          return;
        }

        count += text.length;
        return;
      }

      for (const child of Array.from(node.childNodes)) {
        walk(child);
      }
    }

    walk(doc.body);

    return doc.body.innerHTML;
  }

  useEffect(() => {
    function init() {
      if (!data) return;
      setLatestPosts((prev) => [...prev, ...data]);
    }
    init();
  }, [data]);
  if (isLoading && latestPosts.length === 0) {
    return (
      <div className="mt-12 text-center text-2xl text-amber-300">טוען...</div>
    );
  }
  if (data) console.log(data);
  if (isError) {
    return (
      <div className="text-red-500  mt-12 text-2xl text-center">
        {error?.message}
      </div>
    );
  }
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">מה חדש </h3>
      </div>
      <ul className="space-y-3">
        {latestPosts.map((item) => (
          <li
            onClick={() =>
              navigate(`/forum/${item.forum_id}/${item.thread_id}/#${item.id}`)
            }
            key={item.id}
            className="cursor-pointer rounded-md bg-[#555] sm:px-7 p-1 py-5 text-white"
          >
            <div className="text-lg font-semibold text-[#0BD7FD]">
              {item.thread_title}
            </div>{" "}
            <div className="text-center">{formatDateFull(item.created_at)}</div>
            <div className="mt-2 text-lg text-white">
              <div
                className="
      [&_a]:text-sky-400
      [&_a]:underline

      [&_ul]:list-disc
      [&_ul]:ps-6
      [&_ul]:list-outside

      [&_ol]:list-decimal
      [&_ol]:ps-6
      [&_ol]:list-outside

      [&_li]:my-1

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
                  __html: truncateHtml(item.content, 150),
                }}
              />
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {item.post_type === "reply" ? "תגובה חדשה" : "נושא חדש"}
            </div>
            <div className="text-white">{item.last_reply_user_name}</div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex w-full justify-center">
        <button
          disabled={isFetching}
          className="
      flex cursor-pointer items-center justify-center
      rounded bg-gray-900 px-4 py-2
      text-center text-2xl text-amber-100
      disabled:cursor-not-allowed
      disabled:opacity-50
    "
          onClick={() => setPage((prev) => prev + 1)}
        >
          {isFetching ? "טוען..." : "טען עוד"}
        </button>
      </div>
    </section>
  );
}
