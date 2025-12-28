export interface PostCreateRequestDTO {
  title: string;
  description: string;
}

export interface LikesToggleResponseDTO {
  liked: boolean;
  likeCount: number;
}

export interface Cursor {
  sort: string;
  cursorTime: string | null;
  cursorId: number | null;
  cursorLike: number | null;
}

export interface PostResponseDTO {
  postId: number;
  title: string;
  thumbnailUrl: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface PostFeedResponseDTO {
  items: PostResponseDTO[];
  nextCursor: Cursor | null;
  hasNext: boolean;
}

export interface PostDetailResponseDTO {
  postId: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string;
  title: string;
  description: string;
  originalUrl: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface PostListParams {
  sort?: string;
  cursorTime?: string;
  cursorId?: number;
  cursorLike?: number;
  size?: number;
}