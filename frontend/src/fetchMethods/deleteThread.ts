import { getAuthToken } from "../lib/getAuthToken";

export async function deleteThread(id: number) {
  let token;
  const url = "https://api.pitron-halomot.org";
  try {
    token = await getAuthToken();
  } catch (e) {
    console.log(e);
    return "error processing token";
  }
  const response = await fetch(`${url}/api/threads/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    return error;
  }
}
