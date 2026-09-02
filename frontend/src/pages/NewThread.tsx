import PostComposer, { type Post } from "../components/PostComposer";
import { createThread } from "../fetchMethods/createThread";
import { useParams } from "react-router-dom";
export default function NewThread() {
  const { f } = useParams();

  async function handleCreate(item: Post) {
    if (!f) return;
    try {
      await createThread(item, +f);
      window.location.href = "/";
    } catch (e) {
      console.log(e);
      window.location.href = "/notFound";
    }
  }
  return (
    <div>
      <PostComposer mode="thread" onSubmit={(item) => handleCreate(item)} />
    </div>
  );
}
