export type Photo = {
    id: string;
    title: string;
    thumbnailUrl: string;
    originalUrl: string;
    likeCount: number;
    createdAt: string;
};

export interface PhotoDetail extends Photo {
  tags: string[];
  description: string;
  aiGenerated: boolean;
  uploadedAt: string;
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