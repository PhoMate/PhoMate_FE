import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Photo, FeedResponse } from '../types';
import type { PostListParams, PostListResponse } from '../types/post';
import { fetchPosts } from '../api/posts';
import FeedGrid from './FeedGrid';
import '../styles/FeedPage.css';

type FeedPageProps = {
    onPhotoSelect?: (photo: Photo) => void;
    isPanelOpen?: boolean;
};

export default function FeedPage({ onPhotoSelect, isPanelOpen = true }: FeedPageProps) {
    const PAGE_SIZE = 12;
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement | null>(null);

    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    // 초기 로드
    useEffect(() => {
        loadPhotos(1);
    }, []);

    const loadPhotos = useCallback(async (pageToLoad: number) => {
        if (loadingRef.current || !hasMoreRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchPosts({ page: pageToLoad, size: PAGE_SIZE } as PostListParams) as unknown as PostListResponse;
            const chunk = (response as any).items ?? []; // items 기반 리스트
            const total = (response as any).total ?? 0;

            setPhotos(prev => (pageToLoad === 1 ? chunk : [...prev, ...chunk]));

            const loadedCount = pageToLoad * PAGE_SIZE;
            const newHasMore = chunk.length > 0 && loadedCount < total;
            setHasMore(newHasMore);
            hasMoreRef.current = newHasMore;

            setPage(pageToLoad + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류');
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [PAGE_SIZE]);

    // Intersection Observer로 무한 스크롤
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
                    loadPhotos(page);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [loadPhotos, page]);

    const handlePhotoClick = (photo: Photo) => {
        onPhotoSelect?.(photo);
    };

    return (
        <main className={`main-feed ${isPanelOpen ? 'with-panel' : ''}`}>
            <div className="feed-header">
                <h2>PHOMATE</h2>
            </div>

            {error && (
                <div className="feed-error">
                    <p>{error}</p>
                    <button onClick={() => loadPhotos(1)} className="retry-btn">
                        다시 시도
                    </button>
                </div>
            )}

            <FeedGrid
                photos={photos}
                isLoading={isLoading}
                onPhotoClick={handlePhotoClick}
            />

            <div ref={observerTarget} className="feed-observer" />
        </main>
    );
}