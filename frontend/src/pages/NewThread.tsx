import React from "react";
import PostComposer from "../components/PostComposer";

export default function NewThread() {
  return (
    <div>
      <PostComposer
        mode="thread"
        onSubmit={(item) =>
          console.log(item.content, item.files, item.title, item.notify)
        }
      />
    </div>
  );
}
