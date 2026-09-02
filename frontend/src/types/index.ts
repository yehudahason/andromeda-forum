export type ThreadType = {
  id: number;
  forum_id: number;
  title: string;
  author: string | null;
  messages_count: number;
  last_post_title: string | null;
  last_post_author: string | null;
  last_post_date: string | null;
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
  last_post_thread_id: string | null;
};

export type Users = ReplyAuthor[];

export type ReplyAuthor = {
  id: string;
  name: string;
  email: string;
  role: string;
  image_url: string | null;
  replies_counts: number;
};

export type ReplyType = {
  id: string;
  thread_id: number;
  title: string;
  author: ReplyAuthor;
  post: string;
  created_at: string;
  updated_at: string;
};

export type ReplyListResponse = {
  replies: ReplyType[];
  total: number;
  page: number;
  per_page: number;
};

export type ThreadDetails = {
  id: number;
  forum_name: string;
  author: string;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  author_replies_count: number;
};
export type User = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  replies_count: number;
  created_at: string;
  role: string;
};
