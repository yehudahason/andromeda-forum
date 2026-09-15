import PostComposer, { type Post } from "../components/PostComposer";
import { updateReply } from "../fetchMethods/updateReply";
import { getReplyByID } from "../fetchMethods/getReplyByID";
import { useParams } from "react-router-dom";
import AfterPost from "../components/AfterPost";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReplyPost } from "../types";

export default function EditReply() {
  const { f, t, id } = useParams();

  const queryClient = useQueryClient();

  // GET existing reply
  const {
    data: reply,
    isLoading,
    isError,
  } = useQuery<ReplyPost>({
    queryKey: ["reply", id],
    queryFn: () => {
      if (!id) {
        throw new Error("Reply ID is missing");
      }

      return getReplyByID(id);
    },
    enabled: !!id,
  });

  // UPDATE reply
  const updateReplyMutation = useMutation({
    mutationFn: (item: Post) => {
      if (!id) {
        throw new Error("Reply ID is missing");
      }

      return updateReply(item, id);
    },

    retry: false,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["threads", f],
      });

      queryClient.invalidateQueries({
        queryKey: ["getThread", f, t],
      });

      queryClient.invalidateQueries({
        queryKey: ["reply", id],
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !reply) {
    return <AfterPost success={false} postLink="" />;
  }

  if (updateReplyMutation.isSuccess) {
    return <AfterPost success={true} postLink={`/forum/${f}/${t}/#${id}`} />;
  }

  if (updateReplyMutation.isError) {
    return <AfterPost success={false} postLink="" />;
  }

  return (
    <PostComposer
      post={{
        title: "",
        content: reply.post,
        notify: reply.notify,
      }}
      mode="reply"
      disabled={updateReplyMutation.isPending}
      onSubmit={(item: Post) => {
        updateReplyMutation.mutate(item);
      }}
    />
  );
}
