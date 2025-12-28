import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import FeedPage from './components/FeedPage';
import PhotoDetailModal from './components/PhotoDetailModal';
import ProfilePage from './components/ProfilePage';
import FollowPage, { FollowUser } from './components/FollowPage';
import UploadPage from './components/UploadPage';
import { Photo, PhotoDetail } from './types';
import './App.css';

export default function App() {
    const [activeNav, setActiveNav] = useState('home');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const [targetUser, setTargetUser] = useState<FollowUser | null>(null);
    
    const [photoToEdit, setPhotoToEdit] = useState<PhotoDetail | null>(null);

    const handleGoToFollow = () => setActiveNav('follow');
    const handleBackToProfile = () => setActiveNav('profile');
    const handleBackToFollowList = () => {
        setActiveNav('follow');
    };

    const handleUserClick = (user: FollowUser) => {
        setTargetUser(user); 
        setActiveNav('user_profile');
    };

    const handlePhotoSelect = (photo: Photo) => {
        setSelectedPhoto({
            ...photo,
            description: '상세 설명...',
            uploadedBy: 'User',
            uploadedAt: new Date().toISOString(),
        });
        setIsDetailModalOpen(true);
    };

    const handleUploadSuccess = () => setActiveNav('home');

    const handleAiEditRequest = (photo: PhotoDetail) => {
        setPhotoToEdit(photo);       
        setIsDetailModalOpen(false); 
        setIsRightPanelOpen(true);   
    };

    return (
        <div className="app-container">
            <Sidebar activeNav={activeNav} onNavClick={setActiveNav} />
            
            {activeNav === 'home' && (
                <FeedPage
                    onPhotoSelect={handlePhotoSelect}
                    isPanelOpen={isRightPanelOpen}
                />
            )}

            {activeNav === 'upload' && (
                <UploadPage 
                    onUploadSuccess={handleUploadSuccess}
                    isPanelOpen={isRightPanelOpen}
                 />
            )}

            {activeNav === 'profile' && (
                <ProfilePage 
                    isMe={true} 
                    onPhotoSelect={handlePhotoSelect} 
                    onFollowClick={handleGoToFollow}
                    isPanelOpen={isRightPanelOpen} 
                />
            )}

            {activeNav === 'follow' && (
                <FollowPage 
                    onBack={handleBackToProfile} 
                    onUserClick={handleUserClick} 
                />
            )}

            {activeNav === 'user_profile' && targetUser && (
                <ProfilePage 
                    isMe={false} 
                    userInfo={{
                        id: Number(targetUser.id), 
                        name: targetUser.name,
                        profileUrl: targetUser.profileUrl,
                        description: '안녕하세요, 반가워요!',
                        isFollowed: targetUser.isFollowed 
                    }}
                    onPhotoSelect={handlePhotoSelect}
                    onBack={handleBackToFollowList}
                    isPanelOpen={isRightPanelOpen}
                />
            )}

             <RightPanel
                isOpen={isRightPanelOpen}
                onClose={() => setIsRightPanelOpen(false)}
                selectedPhoto={photoToEdit} 
                onUpdatePhoto={(newUrl) => {
                    console.log("새 이미지:", newUrl);
                }}
            />

            <button
                className={`floating-chat-btn ${isRightPanelOpen ? 'with-panel' : ''}`}
                onClick={() => setIsRightPanelOpen(prev => !prev)}
            >
                {isRightPanelOpen ? '패널 닫기' : '채팅 열기'}
            </button>

            <PhotoDetailModal
                photo={selectedPhoto}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onAiEdit={handleAiEditRequest}
                onAiSearch={() => setIsRightPanelOpen(true)}
            />
        </div>
    );
}