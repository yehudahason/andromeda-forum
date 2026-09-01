import { useSearchParams, useParams, Link } from "react-router-dom";
// import replies from "../assets/threads_with_author_email.json";
import Replies from "../components/Replies";
import { useEffect, useState } from "react";
import { getReplies } from "../fetchMethods/fetchReplies";
import { getThreadByID } from "../fetchMethods/getThreadByID";
import type { ReplyType } from "../types";
import type { ThreadDetails } from "../types";

export default function ThreadPage() {
  const { f, id } = useParams();
  const [searchParams] = useSearchParams();
  const tpage = searchParams.get("tpage");
  const [replies, setReplies] = useState<ReplyType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [tdetails, setTdetails] = useState<ThreadDetails>();

  useEffect(() => {
    async function init() {
      if (!id) return;
      const data = await getReplies(id, Number(tpage ?? "1"));
      setReplies(data.replies);
      setTotal(data.total);
      console.log(data);
    }
    init();

    async function init2() {
      try {
        if (!id) return;
        const thread = await getThreadByID(+id);
        setTdetails(thread);
        console.log(thread.title);
        console.log(thread.author);
        console.log(thread.content);
        console.log(thread.id);
      } catch (err) {
        console.error(err);
      }
    }
    init2();
  }, [f, id, tpage]);
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">{tdetails?.forum_name}</h3>
        <Link className="bg-sky-400 text-black py-2 px-4 rounded-lg" to="about">
          פתח נושא חדש
        </Link>
      </div>
      <Replies
        id={id ?? "9"}
        forum={f ?? ""}
        replies={replies}
        current={tpage ?? "1"}
        total={total}
        tdetails={tdetails ?? null}
      />
    </section>
  );
}
