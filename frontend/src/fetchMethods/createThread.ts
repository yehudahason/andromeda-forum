export async function createThread({
  forumId,
  title,
  content,
  notify,
  token,
}: {
  forumId: string;
  title: string;
  content: string;
  notify: boolean;
  token: string;
}) {
  const res = await fetch("/api/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      forum_id: forumId,
      title,
      content,
      notify,
    }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to create thread");
  }

  return res.json();
}
