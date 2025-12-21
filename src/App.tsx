import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import FeedPage from './components/FeedPage';
import PhotoDetailModal from './components/PhotoDetailModal';
import { Photo, PhotoDetail } from './types';
import './App.css';

export default function App() {
    const [activeNav, setActiveNav] = useState('home');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handlePhotoSelect = (photo: Photo) => {
        setSelectedPhoto({
            ...photo,
            description: '사진에 대한 설명이 여기에 표시됩니다.',
            uploadedBy: '사용자명',
            uploadedAt: new Date().toISOString(),
        });
        setIsDetailModalOpen(true);
    };

    return (
        <div className="app-container">
            <Sidebar activeNav={activeNav} onNavClick={setActiveNav} />
            <FeedPage
                onPhotoSelect={handlePhotoSelect}
                isPanelOpen={isRightPanelOpen}
            />
            <RightPanel
                isOpen={isRightPanelOpen}
                onClose={() => setIsRightPanelOpen(false)}
            />

            {/* 패널 토글 버튼 */}
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