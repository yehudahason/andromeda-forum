import React from "react";
import PostComposer from "../components/PostComposer";

export default function NewReply() {
  return (
    <div>
      <PostComposer
        mode="reply"
        onSubmit={(item) =>
          console.log(item.content, item.files, item.title, item.notify)
        }
      />
    </div>
  );
}
