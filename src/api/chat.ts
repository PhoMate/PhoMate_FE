import { Photo } from '../types';

export async function sendChatMessage(message: string): Promise<string> {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });
    const data = await response.json();
    return data.response;
}

export async function searchPhotos(query: string): Promise<Photo[]> {
    const response = await fetch(`/api/photos/search?q=${encodeURIComponent(query)}`);
    return response.json();
}

export async function searchMemberPhotos(memberId: string, q: string) {
  const base = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${base}/api/members/${memberId}/photos?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('사진 검색 실패');
  return res.json();
}