import { useSearchParams, useParams, Link } from "react-router-dom";
import replies from "../assets/threads_with_author_email.json";
import Replies from "../components/Replies";
export default function ThreadPage() {
  const { f, id } = useParams();
  const [searchParams] = useSearchParams();
  const tpage = searchParams.get("tpage");
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">
          פורום - {f}-{id}
        </h3>
        <Link className="bg-sky-400 text-black py-2 px-4 rounded-lg" to="about">
          פתח נושא חדש
        </Link>
      </div>
      <Replies
        id={id ?? "1"}
        forum={f ?? ""}
        replies={replies}
        current={tpage ?? "1"}
      />
    </section>
  );
}
