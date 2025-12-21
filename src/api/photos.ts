import { FeedResponse } from '../types';
import { getMockFeedData } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const USE_MOCK_DATA = true; // 🔄 백엔드 없을 때 true로 설정

export async function fetchFeedPhotos(
    cursor?: string,
    pageSize: number = 12
): Promise<FeedResponse> {
    // 모의 데이터 사용
    if (USE_MOCK_DATA) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(getMockFeedData(cursor, pageSize));
            }, 500); // 네트워크 지연 시뮬레이션
        });
    }

    // 실제 API (백엔드 준비되면)
    const params = new URLSearchParams({
        pageSize: pageSize.toString(),
    });

    if (cursor) {
        params.append('cursor', cursor);
    }

    const response = await fetch(`${API_BASE}/api/photos/feed?${params}`);
    if (!response.ok) throw new Error('피드 로드 실패');
    return response.json();
}

export async function getPhotoDetail(id: string) {
    if (USE_MOCK_DATA) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    id,
                    title: `사진 ${id}`,
                    thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop',
                    originalUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
                    likeCount: 500,
                    createdAt: '2024-12-20',
                });
            }, 300);
        });
    }

    const response = await fetch(`${API_BASE}/api/photos/${id}`);
    if (!response.ok) throw new Error('사진 로드 실패');
    return response.json();
}