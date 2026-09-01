export async function deleteReply(id: string, token: string) {
  const response = await fetch(`/api/replies/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to delete reply");
  }
}
