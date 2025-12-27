export type Photo = {
    id: string;
    title: string;
    thumbnailUrl: string;
    originalUrl: string;
    likeCount: number;
    createdAt: string;
};

export interface PhotoDetail extends Photo {
  description?: string;
  uploadedBy?: string;   // 추가
  uploadedAt?: string;   // 추가
}

export type FeedResponse = {
    photos: Photo[];
    nextCursor?: string;
    hasMore: boolean;
};

export type EditPayload = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
};