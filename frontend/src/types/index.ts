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

export type ReplyType = {
  id: string;
  title: string;
  author: User;
  post: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string | null;
  image_url: string | null;
  replies_counts: number;
  created_at: string;
  role: string;
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

export type User2 = {
  id: string;
  task: string;
  name: string;
  email: string;
  completed: boolean;
  deleting: boolean;
};

export type Users = User[];
