import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Photo } from '../types';
import type { PostListParams, PostFeedResponseDTO, Cursor } from '../types/post';
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
    const [cursor, setCursor] = useState<Cursor | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement | null>(null);

    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    // 초기 로드
    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = useCallback(async () => {
        if (loadingRef.current || !hasMoreRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const params: PostListParams = {
                sort: cursor?.sort,
                cursorTime: cursor?.cursorTime ?? undefined,
                cursorId: cursor?.cursorId ?? undefined,
                cursorLike: cursor?.cursorLike ?? undefined,
                size: PAGE_SIZE,
            };

            const response = await fetchPosts(params) as PostFeedResponseDTO;
            const chunk = (response.items || []).map<Photo>(item => ({
                id: String(item.postId),
                title: item.title,
                thumbnailUrl: item.thumbnailUrl,
                originalUrl: item.thumbnailUrl,
                likeCount: item.likeCount,
                createdAt: '',
            }));

            setPhotos(prev => (cursor ? [...prev, ...chunk] : chunk));

            const newHasMore = Boolean(response.hasNext);
            setHasMore(newHasMore);
            hasMoreRef.current = newHasMore;
            setCursor(response.nextCursor ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류');
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [PAGE_SIZE, cursor]);

    // 검색 결과 수신: 메인 피드를 해당 결과로 교체
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            const items = detail.items || [];
            const query = detail.query || null;
            if (!Array.isArray(items) || items.length === 0) return;

            const mapped: Photo[] = items.map((item: any) => ({
                id: String(item.postId ?? item.id ?? ''),
                title: item.title ?? '',
                thumbnailUrl: item.thumbnailUrl ?? item.imageUrl ?? item.originalUrl ?? item.url ?? '',
                originalUrl: item.originalUrl ?? item.imageUrl ?? item.thumbnailUrl ?? item.url ?? '',
                likeCount: item.likeCount ?? 0,
                createdAt: item.createdAt ?? '',
            }));

            setPhotos(mapped);
            setError(null);
            setHasMore(false);
            hasMoreRef.current = false;
            setCursor(null);
            setSearchQuery(query);
        };

        window.addEventListener('phomate:search-results', handler as EventListener);
        return () => window.removeEventListener('phomate:search-results', handler as EventListener);
    }, []);

    // 좋아요 업데이트 수신: 메인 피드의 좋아요 숫자 즉시 업데이트
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            const postId = detail.postId;
            const likeCount = detail.likeCount;
            
            if (postId === undefined || likeCount === undefined) return;

            setPhotos(prev => prev.map(photo =>
                photo.id === String(postId) ? { ...photo, likeCount } : photo
            ));
        };

        window.addEventListener('phomate:like-updated', handler as EventListener);
        return () => window.removeEventListener('phomate:like-updated', handler as EventListener);
    }, []);

    // Intersection Observer로 무한 스크롤
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
                    loadPhotos();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [loadPhotos]);

    const handlePhotoClick = (photo: Photo) => {
        onPhotoSelect?.(photo);
    };

    return (
        <main className={`main-feed ${isPanelOpen ? 'with-panel' : ''}`}>
            <div className="feed-header">
                <h2>PHOMATE {searchQuery ? `- 검색: ${searchQuery}` : ''}</h2>
            </div>

            {error && (
                <div className="feed-error">
                    <p>{error}</p>
                    <button onClick={() => {
                        setCursor(null);
                        setHasMore(true);
                        hasMoreRef.current = true;
                        loadPhotos();
                    }} className="retry-btn">
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