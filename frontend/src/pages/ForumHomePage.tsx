import { useParams, Link } from "react-router-dom";
import ThreadList from "../components/ThreadList";
import threads from "../assets/dummythreads.json";
export default function ForumHomePage() {
  const { id } = useParams();
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">פורום - {id}</h3>
        <Link className="bg-sky-400 text-black py-2 px-4 rounded-lg" to="about">
          פתח נושא חדש
        </Link>
      </div>
      <ThreadList threads={threads} />
    </section>
  );
}
