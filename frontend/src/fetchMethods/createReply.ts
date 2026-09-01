import type { Post } from "../components/PostComposer";
import { getAuthToken } from "../lib/getAuthToken";

export async function createReply(
  item: Post,
  forum_id: number,
  thread_id: number,
) {
  const token = await getAuthToken();
  const url = "https://api.pitron-halomot.org";
  const res = await fetch(
    `${url}/api/forums/${forum_id}/threads/${thread_id}/replies`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        post: item.content,
        notify: item.notify,
      }),
    },
  );

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to create reply");
  }

  return res.json();
}

// INSERT INTO replies (
//     thread_id,
//     user_id,
//     post,
//     notify
// )
// VALUES ($1, $2, $3, $4)
// RETURNING id, thread_id, user_id, post, notify, created_at;
