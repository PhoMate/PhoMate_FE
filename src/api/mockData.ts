import { Photo, FeedResponse } from '../types';

export const mockPhotos: Photo[] = [
    {
        id: '1',
        title: '서울 야경',
        thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
        likeCount: 342,
        createdAt: '2024-12-20',
    },
    {
        id: '2',
        title: '제주 바다',
        thumbnailUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0',
        likeCount: 521,
        createdAt: '2024-12-19',
    },
    {
        id: '3',
        title: '산 풍경',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        likeCount: 456,
        createdAt: '2024-12-18',
    },
    {
        id: '4',
        title: '벚꽃 길',
        thumbnailUrl: 'https://images.unsplash.com/photo-1490819871519-3121c25a6b5d?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1490819871519-3121c25a6b5d',
        likeCount: 789,
        createdAt: '2024-12-17',
    },
    {
        id: '5',
        title: '숲 속 산책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        likeCount: 234,
        createdAt: '2024-12-16',
    },
    {
        id: '6',
        title: '도시 거리',
        thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
        likeCount: 612,
        createdAt: '2024-12-15',
    },
    {
        id: '7',
        title: '호수 반영',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        likeCount: 445,
        createdAt: '2024-12-14',
    },
    {
        id: '8',
        title: '노을 풍경',
        thumbnailUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=400&h=400&fit=crop',
        originalUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913',
        likeCount: 923,
        createdAt: '2024-12-13',
    },
];

export function getMockFeedData(cursor?: string, pageSize: number = 12): FeedResponse {
    const startIdx = cursor ? parseInt(cursor, 10) : 0;
    const endIdx = startIdx + pageSize;
    
    // 실제로는 DB에서 페이징 하지만, 여기선 모의 데이터 반복
    const photos = mockPhotos.length > 0 
        ? Array.from({ length: pageSize }).map((_, i) => mockPhotos[(startIdx + i) % mockPhotos.length])
        : [];

    return {
        photos,
        nextCursor: endIdx < 100 ? endIdx.toString() : undefined,
        hasMore: endIdx < 100,
    };
}