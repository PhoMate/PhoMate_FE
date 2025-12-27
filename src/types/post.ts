// Post 관련 타입
export interface PostListParams {
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: number;
  sort?: string;
}

export interface AuthorPostListParams extends PostListParams {
  authorId: number;
}

export interface UpsertPostPayload {
  title: string;
  content: string;
  categoryId?: number;
  imageChanged?: boolean;
}

export interface PostDetail {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  likeCount: number;
  liked: boolean;
  author: { id: number; name: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  items: PostDetail[];
  total: number;
  page: number;
  size: number;
}

// Photo 관련 타입
export interface Photo {
  postId: number;
  title: string;
  thumbnailUrl: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface NextCursor {
  sort: string;
  cursorTime: string | null;
  cursorId: number | null;
  cursorLike?: number | null;
}

export interface PhotoResponse {
  items: Photo[];
  nextCursor: NextCursor | null;
  hasNext: boolean;
}