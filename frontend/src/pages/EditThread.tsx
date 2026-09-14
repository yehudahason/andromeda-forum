import PostComposer, { type Post } from "../components/PostComposer";
import { updateThread } from "../fetchMethods/updateThread";
import { useParams } from "react-router-dom";
import AfterPost from "../components/AfterPost";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThreadByID } from "../fetchMethods/getThreadByID";
import type { ThreadDetails } from "../types";

export default function EditThread() {
  const { f, id } = useParams();

  const queryClient = useQueryClient();

  const updateThreadMutation = useMutation({
    mutationFn: (item: Post) => {
      if (!id) {
        throw new Error("Thread ID is missing");
      }

      return updateThread(item, Number(id));
    },

    // mutations do not retry by default,
    // but this makes the intention explicit
    retry: false,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["threads", f],
      });

      queryClient.invalidateQueries({
        queryKey: ["getThread", f, id],
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["getThread", f, id],
    queryFn: () => getTID(),
  });
  async function getTID() {
    if (!id) return;
    if (!f) return;
    return getThreadByID(+id, +f);
  }
  const tdetails: ThreadDetails | undefined = data;
  if (updateThreadMutation.isSuccess) {
    return <AfterPost success={true} postLink={`/forum/${f}/${id}`} />;
  }
  if (isError)
    return <h3 className="text-red-500 text-center py-8">{error.message}</h3>;
  if (updateThreadMutation.isError) {
    return <AfterPost success={false} postLink="" />;
  }

  if (isLoading)
    return <h3 className="text-amber-300 text-center py-8">המתן..</h3>;
  return (
    <PostComposer
      tdetails={tdetails}
      mode="thread"
      disabled={updateThreadMutation.isPending}
      onSubmit={(item: Post) => {
        if (updateThreadMutation.isPending) {
          return;
        }

        updateThreadMutation.mutate(item);
      }}
    />
  );
}
