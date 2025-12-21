export type Photo = {
    id: string;
    title: string;
    thumbnailUrl: string;
    originalUrl: string;
    likeCount: number;
    createdAt: string;
};

export type PhotoDetail = Photo & {
    description?: string;
    uploadedBy?: string;
    uploadedAt?: string;
};

export type FeedResponse = {
    photos: Photo[];
    nextCursor?: string;
    hasMore: boolean;
};