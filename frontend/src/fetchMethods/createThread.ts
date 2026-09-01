export async function createThread({
  forum_id,
  title,
  content,
  notify,
  token,
}: {
  forum_id: number;
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
      forum_id,
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
