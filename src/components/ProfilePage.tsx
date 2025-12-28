import React, { useState, useEffect } from 'react';
import { Photo } from '../types';
import PhotoCard from './PhotoCard';
import { ArrowLeft } from 'lucide-react';
import { toggleFollow } from '../api/follow';
import { getMemberPhotos } from '../api/posts';
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
    isPanelOpen?: boolean;
    onEditPhoto?: (photo: Photo) => void;
    onDeletePhoto?: (photoId: string) => void;
};

export default function ProfilePage({ 
    onPhotoSelect, 
    onFollowClick, 
    userInfo, 
    onBack,
    isMe = true,
    isPanelOpen = false,
    onEditPhoto,
    onDeletePhoto
}: ProfilePageProps) {

    const [isFollowed, setIsFollowed] = useState(userInfo?.isFollowed || false);
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        if (userInfo) {
            setIsFollowed(userInfo.isFollowed || false);
        }
    }, [userInfo]);

    useEffect(() => {
        const fetchPhotos = async () => {
            const targetId = userInfo?.id;
            
            if (targetId) {
                try {
                    const data = await getMemberPhotos(String(targetId));
                    // PostFeedResponseDTO의 items 필드를 Photo 배열로 변환
                    const photoList = data.items.map(item => ({
                        id: String(item.postId),
                        thumbnailUrl: item.thumbnailUrl,
                        originalUrl: item.thumbnailUrl,
                        title: item.title,
                        likeCount: item.likeCount,
                        likedByMe: item.likedByMe,
                        createdAt: new Date().toISOString(),
                    } as Photo));
                    setPhotos(photoList);
                } catch (e) {
                    console.error(e);
                }
            }
        };

        fetchPhotos();
    }, [userInfo, isMe]);

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
            console.error(error);
            setIsFollowed(previousState); 
        }
    };

    return (
        <div className={`profile-page-container ${isPanelOpen ? 'with-panel' : ''}`}>
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
                    {photos.map(photo => (
                        <PhotoCard 
                            key={photo.id} 
                            photo={photo} 
                            onClick={() => onPhotoSelect(photo)}
                            isMe={isMe}
                            onEditClick={() => onEditPhoto?.(photo)}
                            onDeleteClick={() => onDeletePhoto?.(photo.id)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}