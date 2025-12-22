import React from 'react';
import { Photo } from '../types';
import PhotoCard from './PhotoCard';
import { ArrowLeft } from 'lucide-react';
import '../styles/ProfilePage.css';

type UserInfo = {
    name: string;
    profileUrl: string;
    description?: string;
};

type ProfilePageProps = {
    onPhotoSelect: (photo: Photo) => void;
    onFollowClick?: () => void;

    onBack?: () => void;

    userInfo?: UserInfo; 
    isMe?: boolean;
};

const myPhotos: Photo[] = [
    { id: "101", title: "내 사진 1", likeCount: 142, thumbnailUrl: "https://images.unsplash.com/photo-1535268620699-00c64547120c?auto=format&fit=crop&w=400&q=80", originalUrl: "", createdAt: "" },
    { id: "102", title: "내 사진 2", likeCount: 77, thumbnailUrl: "https://images.unsplash.com/photo-1596236940860-630e2381223e?auto=format&fit=crop&w=400&q=80", originalUrl: "", createdAt: "" },
];

export default function ProfilePage({ 
    onPhotoSelect, 
    onFollowClick, 
    userInfo, 
    onBack,
    isMe = true 
}: ProfilePageProps) {

    const displayProfile = {
        name: userInfo?.name || ".",
        img: userInfo?.profileUrl || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80",
        desc: userInfo?.description || "."
    };

    return (
        <div className="profile-page-container">
            <aside className="profile-sidebar">
                {!isMe && (
                    <div className="profile-header-nav">
                        <button className="back-btn" onClick={onBack}>
                            <ArrowLeft size={24} />
                        </button>
                    </div>
                )}
                
                <div className="profile-image-container">
                    <img 
                        src={displayProfile.img} 
                        alt="Profile" 
                        className="profile-image" 
                    />
                </div>
                <div className="profile-text-info">
                    <h2>{displayProfile.name}</h2>
                    <p>{displayProfile.desc}</p>
                </div>
                
                <div className="profile-actions">
                    {isMe ? (
                        <>
                          <button className="action-btn" onClick={onFollowClick}>
                                팔로우 목록
                            </button>
                        </>
                    ) : (
                        <button className="action-btn" style={{ backgroundColor: '#FFC107', color: '#fff', border: 'none' }}>
                            팔로우 하기
                        </button>
                    )}
                </div>
            </aside>

            <main className="profile-gallery">
                <div className="gallery-grid">
                    {myPhotos.map(photo => (
                        <PhotoCard 
                            key={photo.id} 
                            photo={photo} 
                            onClick={() => onPhotoSelect(photo)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}