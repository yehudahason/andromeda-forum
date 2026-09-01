export async function updateThread(
  id: number,
  data: {
    title: string;
    content: string;
    notify: boolean;
  },
  token: string,
) {
  const response = await fetch(`/api/threads/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to update thread");
  }

  return response.json();
}
