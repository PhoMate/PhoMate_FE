import React from 'react';
import { ArrowLeft } from 'lucide-react';
import '../styles/FollowPage.css';

export type FollowUser = {
    id: string;
    name: string;
    profileUrl: string;
};

type FollowPageProps = {
    onBack: () => void;
    onUserClick: (user: FollowUser) => void;
};

const mockUsers: FollowUser[] = [
    { id: 'u1', name: '바', profileUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=200&q=80' },
    { id: 'u2', name: '코', profileUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=200&q=80' },
    { id: 'u3', name: '드', profileUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80' },
];

export default function FollowPage({ onBack, onUserClick }: FollowPageProps) {
    return (
        <main className="follow-page">
            <div className="follow-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <h2>팔로우 목록</h2>
            </div>

            <div className="follow-grid">
                {mockUsers.map(user => (
                    <div 
                        key={user.id} 
                        className="follow-user-card"
                        onClick={() => onUserClick(user)} 
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="user-avatar-wrapper">
                            <img src={user.profileUrl} alt={user.name} className="user-avatar" />
                        </div>
                        <span className="user-name">{user.name}</span>
                        <button className="follow-btn" onClick={(e) => e.stopPropagation()}>
                            팔로잉
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}