import React, { useState, useEffect } from 'react';
import { Photo } from '../types';
import PhotoCard from './PhotoCard';
import { ArrowLeft } from 'lucide-react';
import { toggleFollow } from '../api/follow';
import { getMemberPhotos, getMemberProfile } from '../api/photos';
import '../styles/ProfilePage.css';

type UserInfo = {
    id: number;
    name: string;
    profileUrl: string;
    isFollowed?: boolean;
};

type MemberProfileResponse = {
    memberId: number;
    nickname: string;
    profileImageUrl: string;
};

type PhotoItem = {
    postId: number;
    thumbnailUrl: string;
    title: string;
    likeCount: number;
    likedByMe: boolean;
};

type PhotoResponse = {
    items: PhotoItem[];
};

type ProfilePageProps = {
    onPhotoSelect: (photo: Photo) => void;
    onFollowClick?: () => void;
    onBack?: () => void;
    userInfo?: UserInfo;
    isMe?: boolean;
    isPanelOpen?: boolean;
    onEditClick?: (photo: Photo) => void; // App.tsx의 handleEditRequest와 연결
    onDeleteClick?: (photo: Photo) => void; // App.tsx의 handleDeletePhoto와 연결
};

export default function ProfilePage({ 
    onPhotoSelect, 
    onFollowClick, 
    userInfo, 
    onBack,
    isMe = true,
    isPanelOpen = false,
    onEditClick,
    onDeleteClick
}: ProfilePageProps) {

    const [isFollowed, setIsFollowed] = useState(userInfo?.isFollowed || false);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [fetchedProfile, setFetchedProfile] = useState<UserInfo | null>(null);

    useEffect(() => {
        if (userInfo) {
            setIsFollowed(userInfo.isFollowed || false);
        }
    }, [userInfo]);

    useEffect(() => {
        const loadData = async () => {
            let targetId: string | undefined;

            if (isMe) {
                const storedId = localStorage.getItem('memberId');
                if (storedId) targetId = storedId;
            } else {
                if (userInfo?.id) targetId = String(userInfo.id);
            }

            if (targetId) {
                try {
                    // (1) 프로필 정보 가져오기
                    const profileData = await getMemberProfile(targetId) as MemberProfileResponse;
                    
                    setFetchedProfile({
                        id: profileData.memberId,
                        name: profileData.nickname,
                        profileUrl: profileData.profileImageUrl,
                    });

                    // (2) 사진 목록 가져오기
                    const data = await getMemberPhotos(targetId) as PhotoResponse;
                    
                    if (data && data.items) {
                        const photoList = data.items.map((item) => ({
                            id: String(item.postId),
                            thumbnailUrl: item.thumbnailUrl,
                            originalUrl: item.thumbnailUrl, // 명세에 맞춰 필요한 경우 수정
                            title: item.title,
                            likeCount: item.likeCount,
                            likedByMe: item.likedByMe,
                            createdAt: new Date().toISOString(),
                        } as Photo));
                        setPhotos(photoList);
                    }
                } catch (e) {
                    console.error('데이터 로딩 실패', e);
                }
            }
        };

        loadData();
    }, [userInfo, isMe]);

    const displayInfo = fetchedProfile || userInfo;

    const displayProfile = {
        name: displayInfo?.name || "사용자",
        img: displayInfo?.profileUrl || "https://d3peabjupjn5ke.cloudfront.net/default/profile.jpg",
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
                    {photos.length > 0 ? (
                        photos.map(photo => (
                            <PhotoCard 
                                key={photo.id} 
                                photo={photo} 
                                onClick={() => onPhotoSelect(photo)}
                                isMe={isMe}
                                onEditClick={() => onEditClick?.(photo)}
                                onDeleteClick={() => onDeleteClick?.(photo)}
                            />
                        ))
                    ) : (
                        <div className="empty-gallery">
                            아직 업로드한 사진이 없습니다.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}