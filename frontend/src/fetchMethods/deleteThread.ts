export async function deleteThread(id: number, token: string) {
  const response = await fetch(`/api/threads/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete thread");
  }
}
