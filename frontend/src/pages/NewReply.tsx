import { useParams } from "react-router-dom";
import PostComposer from "../components/PostComposer";
import type { Post } from "../components/PostComposer";
import { createReply } from "../fetchMethods/createReply";
import AfterPost from "../components/AfterPost";
import { useState } from "react";
export default function NewReply() {
  const { f, t } = useParams();
  const [response, setResponse] = useState<string | null>(null);

  async function handleCreate(item: Post) {
    if (!f) return;
    if (!t) return;
    try {
      const res = await createReply(item, +f, +t);
      setResponse(res);
    } catch (e) {
      console.log(e);
      setResponse("fail");
    }
  }
  return (
    <div>
      {response ? (
        <AfterPost success={response != "fail"} postLink={response} />
      ) : (
        <PostComposer
          mode="reply"
          onSubmit={(item: Post) => handleCreate(item)}
        />
      )}
    </div>
  );
}
