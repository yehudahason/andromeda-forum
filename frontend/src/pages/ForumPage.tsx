import { useParams, Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ThreadList from "../components/ThreadList";
import threads from "../assets/dummythreads.json";
export default function ForumPage() {
  const { f } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page");
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">פורום - {f}</h3>
        <Link className="bg-sky-400 text-black py-2 px-4 rounded-lg" to="about">
          פתח נושא חדש
        </Link>
      </div>
      <ThreadList forum={f ?? "1"} threads={threads} current={page ?? "1"} />
    </section>
  );
}
