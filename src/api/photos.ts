import { FeedResponse, EditPayload } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchFeedPhotos(cursor?: string, pageSize: number = 12): Promise<FeedResponse> {
  const params = new URLSearchParams();
  params.set('pageSize', String(pageSize));
  if (cursor) params.set('cursor', cursor);

  try {
    const res = await fetch(`${API_BASE}/api/photos${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('피드 로드 실패');
    return await res.json();
  } catch {
    // 백엔드 준비 전 간단 Mock
    const base = 'https://source.unsplash.com';
    const photos = Array.from({ length: pageSize }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      title: `Photo #${i + 1}`,
      thumbnailUrl: `${base}/featured/480x480?photo&sig=${i}`,
      originalUrl: `${base}/featured/1200x800?photo&sig=${i}`,
      likeCount: 100 + i * 7,
      createdAt: new Date().toISOString(),
    }));
    return { photos, nextCursor: cursor ? String(Number(cursor) + pageSize) : String(pageSize), hasMore: true };
  }
}

// 사진 상세(게시글 상세 경로 기준)
export async function getPostDetail(postId: string) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}`);
  if (!res.ok) throw new Error('사진 상세 로드 실패');
  return res.json();
}

// 유저 사진 검색(챗봇 연계용)
export async function getMemberPhotos(memberId: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const res = await fetch(`${API_BASE}/api/members/${memberId}/photos${params.toString() ? `?${params}` : ''}`);
  if (!res.ok) throw new Error('유저 사진 로드 실패');
  return res.json();
}

// 좋아요 토글
export async function togglePhotoLike(memberId: string, photoId: string) {
  const res = await fetch(`${API_BASE}/api/members/${memberId}/photos/${photoId}/likes`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('좋아요 처리 실패');
  return res.json();
}

// 사진 편집 저장
export async function editPhoto(memberId: string, photoId: string, payload: EditPayload) {
  const res = await fetch(`${API_BASE}/api/members/${memberId}/photos/${photoId}/edit`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('편집 저장 실패');
  return res.json();
}

// 게시글 CRUD (완료된 엔드포인트 기준)
export async function createPost(memberId: string, data: any) {
  const res = await fetch(`${API_BASE}/api/posts?memberId=${encodeURIComponent(memberId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('게시글 등록 실패');
  return res.json();
}

export async function updatePost(memberId: string, postId: string, data: any) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('게시글 수정 실패');
  return res.json();
}

export async function deletePost(memberId: string, postId: string) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('게시글 삭제 실패');
  return res.json();
}

// 사진 저장 (서버에 기록)
// payload는 상황에 맞게 확장 가능
export async function savePhoto(
  memberId: string,
  payload: { originalUrl: string; thumbnailUrl?: string; title?: string }
) {
  const res = await fetch(`${API_BASE}/api/members/${memberId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('사진 저장 실패');
  return res.json();
}