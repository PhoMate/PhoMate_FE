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