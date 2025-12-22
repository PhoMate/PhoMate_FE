import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Photo, FeedResponse } from '../types';
import { fetchFeedPhotos } from '../api/photos';
import FeedGrid from './FeedGrid';
import '../styles/FeedPage.css';

type FeedPageProps = {
    onPhotoSelect?: (photo: Photo) => void;
    isPanelOpen?: boolean;
};

export default function FeedPage({ onPhotoSelect, isPanelOpen = true }: FeedPageProps) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement | null>(null);

    // 초기 로드
    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = useCallback(async (nextCursor?: string) => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        setError(null);

        try {
            const response: FeedResponse = await fetchFeedPhotos(nextCursor, 12);
            setPhotos(prev => (nextCursor ? [...prev, ...response.photos] : response.photos));
            setCursor(response.nextCursor);
            setHasMore(response.hasMore);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore]);

    // Intersection Observer로 무한 스크롤
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadPhotos(cursor);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [loadPhotos, cursor, hasMore, isLoading]);

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
                    <button onClick={() => loadPhotos()} className="retry-btn">
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