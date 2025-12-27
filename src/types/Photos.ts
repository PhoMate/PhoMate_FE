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