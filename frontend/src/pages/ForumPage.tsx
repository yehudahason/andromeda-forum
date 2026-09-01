import { useParams, Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ThreadList from "../components/ThreadList";
// import threads from "../assets/dummythreads.json";
import { useEffect, useState } from "react";
import { getThreads } from "../fetchMethods/getThreads";
import type { ThreadType } from "../types";
export default function ForumPage() {
  const { f } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page");
  const [threads, setThreads] = useState<ThreadType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [forumName, setForumName] = useState<string>("");

  useEffect(() => {
    async function init() {
      const data = await getThreads(f, Number(page ?? "1"));

      console.log(data);
      setThreads(data.threads);
      setTotal(data.total);
      setForumName(data.forum_name);
    }
    init();
  }, [f, page]);
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">{forumName}</h3>
        <Link className="bg-sky-400 text-black py-2 px-4 rounded-lg" to="about">
          פתח נושא חדש
        </Link>
      </div>
      <ThreadList
        total={total}
        forum={f ?? "1"}
        threads={threads}
        current={page ?? "1"}
      />
    </section>
  );
}

// const threads: ThreadType[] = [
//   {
//     id: 1,
//     forum_id: 1,
//     title: "איך מתחילים ללמוד Go?",
//     author: "Yehuda",
//     messages_count: 12,
//     last_post_title: "איך מתחילים ללמוד Go?",
//     last_post_author: "David",
//     last_post_date: "2026-09-01T10:15:00Z",
//     created_at: "2026-08-31T18:20:00Z",
//   },
//   {
//     id: 2,
//     forum_id: 1,
//     title: "PostgreSQL או MySQL לפרויקט חדש?",
//     author: "Daniel",
//     messages_count: 8,
//     last_post_title: "PostgreSQL או MySQL לפרויקט חדש?",
//     last_post_author: "Yehuda",
//     last_post_date: "2026-09-01T09:45:00Z",
//     created_at: "2026-08-31T15:10:00Z",
//   },
//   {
//     id: 3,
//     forum_id: 1,
//     title: "בעיה עם React Router",
//     author: "Noam",
//     messages_count: 21,
//     last_post_title: "בעיה עם React Router",
//     last_post_author: "Ariel",
//     last_post_date: "2026-09-01T08:30:00Z",
//     created_at: "2026-08-30T21:00:00Z",
//   },
//   {
//     id: 4,
//     forum_id: 1,
//     title: "איך עובדים עם JWT ב-Go?",
//     author: "Ariel",
//     messages_count: 6,
//     last_post_title: "איך עובדים עם JWT ב-Go?",
//     last_post_author: "Daniel",
//     last_post_date: "2026-08-31T22:40:00Z",
//     created_at: "2026-08-30T19:30:00Z",
//   },
//   {
//     id: 5,
//     forum_id: 1,
//     title: "TipTap editor עם RTL",
//     author: "Yehuda",
//     messages_count: 17,
//     last_post_title: "TipTap editor עם RTL",
//     last_post_author: "Noam",
//     last_post_date: "2026-08-31T20:15:00Z",
//     created_at: "2026-08-30T13:05:00Z",
//   },
//   {
//     id: 6,
//     forum_id: 1,
//     title: "איך עושים pagination נכון?",
//     author: "David",
//     messages_count: 10,
//     last_post_title: "איך עושים pagination נכון?",
//     last_post_author: "Yehuda",
//     last_post_date: "2026-08-31T18:50:00Z",
//     created_at: "2026-08-29T23:10:00Z",
//   },
//   {
//     id: 7,
//     forum_id: 1,
//     title: "Docker Compose לפרויקט React + Go",
//     author: "Daniel",
//     messages_count: 14,
//     last_post_title: "Docker Compose לפרויקט React + Go",
//     last_post_author: "Ariel",
//     last_post_date: "2026-08-31T16:05:00Z",
//     created_at: "2026-08-29T17:40:00Z",
//   },
//   {
//     id: 8,
//     forum_id: 1,
//     title: "איך לשמור HTML ב-PostgreSQL?",
//     author: "Noam",
//     messages_count: 5,
//     last_post_title: "איך לשמור HTML ב-PostgreSQL?",
//     last_post_author: "David",
//     last_post_date: "2026-08-31T14:25:00Z",
//     created_at: "2026-08-29T11:50:00Z",
//   },
//   {
//     id: 9,
//     forum_id: 1,
//     title: "בעיה עם CORS ב-Go",
//     author: "Ariel",
//     messages_count: 9,
//     last_post_title: "בעיה עם CORS ב-Go",
//     last_post_author: "Yehuda",
//     last_post_date: "2026-08-31T12:10:00Z",
//     created_at: "2026-08-28T20:35:00Z",
//   },
//   {
//     id: 10,
//     forum_id: 1,
//     title: "איך לבנות מערכת פורומים?",
//     author: "Yehuda",
//     messages_count: 31,
//     last_post_title: "איך לבנות מערכת פורומים?",
//     last_post_author: "Daniel",
//     last_post_date: "2026-08-31T10:00:00Z",
//     created_at: "2026-08-28T15:15:00Z",
//   },
// ];
