export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

/** Shape returned by every mode of GET /api/posts (paginated, ?ids=, ?authorId=). */
export interface PostsResponse {
  posts: Post[];
  total: number;
  hasMore: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  author: string;
  post: string;
  createdAt: string;
}
