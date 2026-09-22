import { useQuery } from "@tanstack/react-query";
import { getLatestPosts } from "../fetchMethods/getLatestPosts";
import { useNavigate } from "react-router-dom";
export default function NewPosts() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["newPosts"],
    queryFn: getLatestPosts,
  });

  if (isLoading) {
    return (
      <div className="text-amber-300  mt-12 text-2xl text-center">טוען...</div>
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
        {data?.map((item) => (
          <li
            onClick={() =>
              navigate(`/forum/${item.forum_id}/${item.thread_id}/#${item.id}`)
            }
            key={item.id}
            className="
            cursor-pointer
            rounded-md
            border border-slate-700
            bg-[#111827]
            px-5 py-4
            transition-all
            duration-200
            hover:border-[#0BD7FD]
            hover:bg-slate-800
          "
          >
            <div className="text-lg font-semibold text-[#0BD7FD]">
              {item.thread_title}
            </div>

            <div className="mt-2 line-clamp-2 text-sm text-slate-300">
              {" "}
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
                  __html: item.content,
                }}
              />
            </div>

            <div className="mt-3 text-xs text-slate-500">
              {item.post_type === "reply" ? "תגובה חדשה" : "נושא חדש"}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
