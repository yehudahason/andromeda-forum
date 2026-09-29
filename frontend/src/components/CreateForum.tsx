import { useState } from "react";
import { createForum } from "../fetchMethods/createForum";

export default function CreateForum() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      const forum = await createForum({
        name,
        description,
        sort_order: sortOrder,
      });

      console.log("Created:", forum);

      setName("");
      setDescription("");
      setSortOrder(1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      dir="rtl"
      className="bg-gray-500 p-4 z-10 rouneded absolute top-[50%] translate-x-[-50%] translate-y-[-50%] left-[50%] mx-auto mt-10 flex max-w-xl flex-col gap-5"
    >
      <input
        type="text"
        placeholder="שם הפורום"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded bg-slate-800 p-3 text-white"
      />

      <textarea
        placeholder="תיאור"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded bg-slate-800 p-3 text-white"
      />

      <input
        type="number"
        min="1"
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
        className="rounded bg-slate-800 p-3 text-white"
      />

      <button
        disabled={loading}
        className="rounded bg-cyan-500 p-3 font-bold text-black disabled:opacity-50"
      >
        {loading ? "יוצר..." : "צור פורום"}
      </button>
    </form>
  );
}
