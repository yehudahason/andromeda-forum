import { getAuthToken } from "../lib/getAuthToken";
import type { Post } from "../components/PostComposer";
export async function createThread(item: Post, forumId: number) {
  const token = await getAuthToken();
  const url = "https://api.pitron-halomot.org";

  await fetch(`${url}/api/forums/${forumId}/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: item.title,
      content: item.content,
      notify: item.notify,
    }),
  });
}
