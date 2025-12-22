import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import FeedPage from './components/FeedPage';
import PhotoDetailModal from './components/PhotoDetailModal';
import ProfilePage from './components/ProfilePage';
import FollowPage, { FollowUser } from './components/FollowPage'; 
import { Photo, PhotoDetail } from './types';
import './App.css';

export default function App() {
    const [activeNav, setActiveNav] = useState('home');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [targetUser, setTargetUser] = useState<FollowUser | null>(null);

    const handleGoToFollow = () => setActiveNav('follow');
    const handleBackToProfile = () => setActiveNav('profile');

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

    const handleBackToFollowList = () => {
        setActiveNav('follow');
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

            {activeNav === 'profile' && (
                <ProfilePage 
                    isMe={true} 
                    onPhotoSelect={handlePhotoSelect} 
                    onFollowClick={handleGoToFollow} 
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
                        name: targetUser.name,
                        profileUrl: targetUser.profileUrl,
                        description: '안녕하세요, 반가워요!'
                    }}
                    onPhotoSelect={handlePhotoSelect}
                    onBack={handleBackToFollowList}
                />
            )}

            <RightPanel
                isOpen={isRightPanelOpen}
                onClose={() => setIsRightPanelOpen(false)}
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
                onAiEdit={() => setIsRightPanelOpen(true)}
                onAiSearch={() => setIsRightPanelOpen(true)}
            />
        </div>
    );
}