import { useParams } from "react-router-dom";
import PostComposer from "../components/PostComposer";
import type { Post } from "../components/PostComposer";
import { createReply } from "../fetchMethods/createReply";
export default function NewReply() {
  const { f, t } = useParams();

  async function handleCreate(item: Post) {
    if (!f) return;
    if (!t) return;
    try {
      await createReply(item, +f, +t);
      window.location.href = "/";
    } catch (e) {
      window.location.href = "/notFound";
      console.log(e);
    }
  }
  return (
    <div>
      <PostComposer
        mode="reply"
        onSubmit={(item: Post) => handleCreate(item)}
      />
    </div>
  );
}
