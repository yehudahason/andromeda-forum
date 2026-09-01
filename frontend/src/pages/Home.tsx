import { useEffect, useState } from "react";
import ForumList from "../components/ForumList";
import { getForums } from "../fetchMethods/getForums";
import type { ForumType } from "../types";
export default function Home() {
  const [forums, setForums] = useState<ForumType[]>([]);
  useEffect(() => {
    async function init() {
      const res = await getForums();
      console.log(res);
      setForums(res);
    }
    init();
  }, []);
  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="flex my-8 text-white justify-between items-center w-full">
        <h3 className="text-2xl font-semibold">פורומים</h3>
      </div>
      <ForumList forums={forums} />
    </section>
  );
}
