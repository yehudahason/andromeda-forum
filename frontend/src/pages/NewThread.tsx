import PostComposer, { type Post } from "../components/PostComposer";
import { createThread } from "../fetchMethods/createThread";
import { useParams } from "react-router-dom";
import { useState } from "react";
import AfterPost from "../components/AfterPost";
import type { CreateThreadResponse } from "../types";
export default function NewThread() {
  const { f } = useParams();
  const [response, setResponse] = useState<CreateThreadResponse>(null);
  const [stage, setStage] = useState<string>("");
  async function handleCreate(item: Post) {
    if (!f) return;
    try {
      const res = await createThread(item, +f);
      setResponse(res);
      setStage("ok");
    } catch (e) {
      console.log(e);
      setResponse(null);
      setStage("fail");
    }
  }
  return (
    <div>
      {stage ? (
        <AfterPost
          success={stage === "ok"}
          postLink={`/forum/${response?.forum_id}/${response?.id}`}
        />
      ) : (
        <PostComposer mode="thread" onSubmit={(item) => handleCreate(item)} />
      )}
    </div>
  );
}
