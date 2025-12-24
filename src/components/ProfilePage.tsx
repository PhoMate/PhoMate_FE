import React, { useState, useEffect } from 'react';
import { Photo } from '../types';
import PhotoCard from './PhotoCard';
import { ArrowLeft } from 'lucide-react';
import { toggleFollow } from '../api/follow'; 
import '../styles/ProfilePage.css';

type UserInfo = {
    id: number;           
    name: string;
    profileUrl: string;
    description?: string;
    isFollowed?: boolean; 
};

type ProfilePageProps = {
    onPhotoSelect: (photo: Photo) => void;
    onFollowClick?: () => void;
    onBack?: () => void;
    userInfo?: UserInfo; 
    isMe?: boolean;
};

const myPhotos: Photo[] = [ /* ... */ ];

export default function ProfilePage({ 
    onPhotoSelect, 
    onFollowClick, 
    userInfo, 
    onBack,
    isMe = true 
}: ProfilePageProps) {

    const [isFollowed, setIsFollowed] = useState(userInfo?.isFollowed || false);

    useEffect(() => {
        if (userInfo) {
            setIsFollowed(userInfo.isFollowed || false);
        }
    }, [userInfo]);

    const displayProfile = {
        name: userInfo?.name || ".",
        img: userInfo?.profileUrl || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80",
        desc: userInfo?.description || "."
    };

    const handleToggleFollow = async () => {
        if (!userInfo?.id) return;

        const previousState = isFollowed;
        setIsFollowed(!isFollowed);

        try {
            const result = await toggleFollow(userInfo.id);
            setIsFollowed(result.followed);
        } catch (error) {
            console.error("팔로우 요청 실패:", error);
            setIsFollowed(previousState); 
        }
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
                    <img src={displayProfile.img} alt="Profile" className="profile-image" />
                </div>
                <div className="profile-text-info">
                    <h2>{displayProfile.name}</h2>
                    <p>{displayProfile.desc}</p>
                </div>
                
                <div className="profile-actions">
                    {isMe ? (
                        <button className="action-btn" onClick={onFollowClick}>
                            팔로우 목록
                        </button>
                    ) : (
                        <button 
                            className="action-btn" 
                            onClick={handleToggleFollow}
                            style={{ 
                                backgroundColor: isFollowed ? '#e0e0e0' : '#FFC107', 
                                color: isFollowed ? '#333' : '#fff',
                                border: 'none' 
                            }}
                        >
                            {isFollowed ? '팔로잉' : '팔로우 하기'}
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