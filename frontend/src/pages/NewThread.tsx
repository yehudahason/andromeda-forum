import PostComposer from "../components/PostComposer";

export default function NewThread() {
  return (
    <div>
      <PostComposer
        mode="thread"
        onSubmit={(item) => console.log(item.content, item.title, item.notify)}
      />
    </div>
  );
}
