import ForumList from "../components/ForumList";
import { Link } from "react-router-dom";
import forum from "../assets/dummyforum.json";
export default function Home() {
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">פורומים</h3>
        <Link className="bg-sky-400 text-black py-2 px-4 rounded-lg" to="about">
          פתח נושא חדש
        </Link>
      </div>
      <ForumList forums={forum} />
    </section>
  );
}
