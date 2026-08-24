export type ThreadType = {
  id: string;
  title: string;
  author: string;
  post: string;
  messages_count: number;
  last_post_title: string | null;
  last_post_author: string | null;
  last_post_date: string | null;
  image_url: string | null;
  created_at: string;
};

export type ForumType = {
  id: string;
  name: string;
  description: string;
  messages_count: number;
  last_post_title: string | null;
  last_post_author: string | null;
  last_post_date: string | null;
  image_url: string | null;
};
