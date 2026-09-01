export async function updateReply(
  id: string,
  data: {
    post: string;
    notify: boolean;
  },
  token: string,
) {
  const response = await fetch(`/api/replies/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update reply");
  }

  return response.json();
}
