import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import OAuthGoogleCallbackPage from './pages/OAuthGoogleCallbackPage';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel/RightPanel';
import FeedPage from './components/FeedPage';
import PhotoDetailModal from './components/PhotoDetailModal';
import ProfilePage from './components/ProfilePage';
import FollowPage, { FollowUser } from './components/FollowPage';
import UploadPage from './components/UploadPage';
import { Photo, PhotoDetail } from './types';
import './App.css';

type MainAppProps = {
    isGuest: boolean;
};

function MainApp({ isGuest }: MainAppProps) {
    const navigate = useNavigate();
    const [activeNav, setActiveNav] = useState('home');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const [targetUser, setTargetUser] = useState<FollowUser | null>(null);
    
    const [photoToEdit, setPhotoToEdit] = useState<PhotoDetail | null>(null);

    const handleNavClick = (nav: string) => {
        if (isGuest && nav !== 'home') {
            alert('로그인 후 이용 가능한 기능입니다.');
            return;
        }
        setActiveNav(nav);
    };

    const handleGoToFollow = () => handleNavClick('follow');
    const handleBackToProfile = () => handleNavClick('profile');
    const handleBackToFollowList = () => {
        handleNavClick('follow');
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
        if (isGuest) {
            alert('로그인 후 AI 편집 기능을 사용할 수 있습니다.');
            return;
        }
        setPhotoToEdit(photo);       
        setIsDetailModalOpen(false); 
        setIsRightPanelOpen(true);   
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    };

    // 게스트는 홈 외 이동을 막기 위한 안전장치
    useEffect(() => {
        if (isGuest && activeNav !== 'home') {
            setActiveNav('home');
        }
    }, [isGuest, activeNav]);

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    return (
        <div className="app-container">
            <Sidebar 
                activeNav={activeNav} 
                onNavClick={handleNavClick} 
                isGuest={isGuest}
                onLogout={handleLogout}
                onLogin={handleLoginRedirect}
            />
            
            {activeNav === 'home' && (
                <FeedPage
                    onPhotoSelect={handlePhotoSelect}
                    isPanelOpen={isRightPanelOpen}
                />
            )}

            {activeNav === 'upload' && !isGuest && (
                <UploadPage onUploadSuccess={handleUploadSuccess} />
            )}

            {activeNav === 'profile' && !isGuest && (
                <ProfilePage 
                    isMe={true} 
                    onPhotoSelect={handlePhotoSelect} 
                    onFollowClick={handleGoToFollow}
                    isPanelOpen={isRightPanelOpen} 
                />
            )}

            {activeNav === 'follow' && !isGuest && (
                <FollowPage 
                    onBack={handleBackToProfile} 
                    onUserClick={handleUserClick} 
                />
            )}

            {activeNav === 'user_profile' && targetUser && !isGuest && (
                <ProfilePage 
                    isMe={false} 
                    userInfo={{
                        id: Number(targetUser.id), 
                        name: targetUser.name,
                        profileUrl: targetUser.profileUrl,
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
                isGuest={isGuest}
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
        setIsGuest(guest);
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
                <Route 
                    path="/" 
                    element={isAuthenticated ? <MainApp isGuest={isGuest} /> : <Navigate to="/login" replace />} 
                />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
            </Routes>
        </BrowserRouter>
    );
}