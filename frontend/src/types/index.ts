export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: string; 
  createdAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: string; 
  post: string; 
  createdAt: string;
}