import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import OAuthGoogleCallbackPage from './pages/OAuthGoogleCallbackPage';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import FeedPage from './components/FeedPage';
import PhotoDetailModal from './components/PhotoDetailModal';
import ProfilePage from './components/ProfilePage';
import FollowPage, { FollowUser } from './components/FollowPage';
import UploadPage from './components/UploadPage';
import { Photo, PhotoDetail } from './types';
import './App.css';

function MainApp() {
    const [activeNav, setActiveNav] = useState('home');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    // 팔로우 페이지용 타겟 유저
    const [targetUser, setTargetUser] = useState<FollowUser | null>(null);
    
    // AI 편집용 사진 정보 (RightPanel로 전달)
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

    // [AI 편집] 모달에서 버튼 클릭 시 실행
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
                <UploadPage onUploadSuccess={handleUploadSuccess} />
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
                        id: Number(targetUser.id), 
                        name: targetUser.name,
                        profileUrl: targetUser.profileUrl,
                        description: '안녕하세요, 반가워요!',
                        isFollowed: targetUser.isFollowed 
                    }}
                    onPhotoSelect={handlePhotoSelect}
                    onBack={handleBackToFollowList}
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

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const guest = localStorage.getItem('isGuest') === 'true';
        setIsLoggedIn(!!token);
        // 토큰이 있으면 게스트로 간주하지 않음
        setIsGuest(guest && !token);
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return <div>로딩 중...</div>;
    }

    const isAuthenticated = isLoggedIn || isGuest;

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/oauth/google/callback" element={<OAuthGoogleCallbackPage />} />
                <Route path="/" element={<MainApp />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}