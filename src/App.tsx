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
import { fetchPostDetail, updatePost, deletePost } from './api/posts';
import { getMemberInfo } from './api/members';
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
    const [editingPost, setEditingPost] = useState<PhotoDetail | null>(null);

    const handleNavClick = (nav: string) => {
        if (isGuest && nav !== 'home') {
            alert('로그인 후 이용 가능한 기능입니다.');
            return;
        }
        setEditingPost(null);
        setActiveNav(nav);
    };

    const handleGoToFollow = () => handleNavClick('follow');
    const handleBackToProfile = () => handleNavClick('profile');
    const handleBackToFollowList = () => handleNavClick('follow');

    const handleUserClick = (user: FollowUser) => {
        setTargetUser(user);
        setActiveNav('user_profile');
    };

    const handleAuthorClick = async (authorId: number) => {
        if (isGuest) {
            alert('로그인 후 프로필을 볼 수 있습니다.');
            return;
        }
        console.log('handleAuthorClick called with authorId:', authorId);
        try {
            const memberInfo = await getMemberInfo(authorId);
            const newTargetUser: FollowUser = {
                id: String(authorId),
                name: memberInfo.nickname,
                profileUrl: memberInfo.profileImageUrl,
                isFollowed: false,
            };
            setIsDetailModalOpen(false);
            setTargetUser(newTargetUser);
            setActiveNav('user_profile');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`프로필을 불러올 수 없습니다: ${errorMessage}`);
        }
    };

    const handlePhotoSelect = async (photo: Photo) => {
        try {
            const detail = await fetchPostDetail(Number(photo.id));
            setSelectedPhoto({
                ...photo,
                description: detail.description || '',
                uploadedBy: detail.authorNickname,
                authorId: detail.authorId,
                createdAt: detail.createdAt,
            });
            setIsDetailModalOpen(true);
        } catch (error) {
            setSelectedPhoto({
                ...photo,
                description: '',
                uploadedBy: 'Unknown',
                createdAt: new Date().toISOString(),
            });
            setIsDetailModalOpen(true);
        }
    };

    const handleUploadSuccess = () => {
        setEditingPost(null);
        setActiveNav('home');
    };

    const handleAiEditRequest = (photo: PhotoDetail) => {
        if (isGuest) {
            alert('로그인 후 AI 편집 기능을 사용할 수 있습니다.');
            return;
        }
        setPhotoToEdit(photo);
        setIsDetailModalOpen(false);
        setIsRightPanelOpen(true);
    };

    const handleEditRequest = (photo: PhotoDetail) => {
        setEditingPost(photo);
        setActiveNav('upload');
    };

    const handleDeletePhoto = async (photoId: number) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deletePost(photoId);
            alert("삭제되었습니다.");
            window.location.reload();
        } catch (error) {
            alert("삭제 실패했습니다.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    };

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
                <UploadPage 
                    onUploadSuccess={handleUploadSuccess} 
                    editData={editingPost}
                />
            )}

            {activeNav === 'profile' && !isGuest && (
                <ProfilePage 
                    isMe={true} 
                    onPhotoSelect={handlePhotoSelect} 
                    onFollowClick={handleGoToFollow}
                    isPanelOpen={isRightPanelOpen}
                    onEditClick={handleEditRequest}
                    onDeleteClick={(p: Photo) => handleDeletePhoto(Number(p.id))}
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
                onAuthorClick={handleAuthorClick}
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
                <Route 
                    path="/" 
                    element={isAuthenticated ? <MainApp isGuest={isGuest} /> : <Navigate to="/login" replace />} 
                />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
            </Routes>
        </BrowserRouter>
    );
}