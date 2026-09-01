export async function createReply({
  thread_id,
  post,
  notify,
  token,
}: {
  thread_id: number;
  post: string;
  notify: boolean;
  token: string;
}) {
  const res = await fetch("/api/replies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      thread_id,
      post,
      notify,
    }),
  });

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
