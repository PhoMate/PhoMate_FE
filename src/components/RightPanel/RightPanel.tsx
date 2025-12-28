import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../styles/RightPanel.css';

import { startChatSession, streamChatSearch } from '../../api/chat';
import { PhotoDetail } from '../../types';
import MessageItem, { Message } from './MessageItem';
import EditTab from './EditTab';
import SearchTab from './SearchTab'; // SearchTab도 분리했다면 import

type RightPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    isGuest?: boolean;
    selectedPhoto?: PhotoDetail | null;
    onUpdatePhoto?: (newUrl: string) => void;
};

type TabType = 'search' | 'edit';

export default function RightPanel({ isOpen, onClose, isGuest = false, selectedPhoto, onUpdatePhoto }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    // 🔥 [핵심] 사진이 선택되면 자동으로 '편집' 탭으로 전환
    useEffect(() => {
        if (selectedPhoto) {
            setActiveTab('edit');
        } else {
            // 사진이 없으면(닫으면) 검색 탭으로 돌아가거나 유지 (선택사항)
            // setActiveTab('search'); 
        }
    }, [selectedPhoto]);

    const handleTabChange = (tab: TabType) => setActiveTab(tab);

    return (
        <aside className={panelClass} aria-hidden={!isOpen}>
            <div className="chat-header">
                <div className="tab-buttons">
                    <button className={`tab-button ${activeTab === 'search' ? 'active' : ''}`} onClick={() => handleTabChange('search')}>검색</button>
                    <button className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => handleTabChange('edit')}>편집</button>
                </div>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>

            <div className="panel-content-wrapper">
                {activeTab === 'search' ? (
                    // SearchTab 컴포넌트가 있다면 <SearchTab isGuest={isGuest} /> 로 대체 권장
                    // 아래는 SearchTab 분리 전 코드를 SearchTab 컴포넌트로 대체한다고 가정
                    <SearchTab isGuest={isGuest} />
                ) : (
                    // 편집 탭
                    selectedPhoto ? (
                        <EditTab 
                            selectedPhoto={selectedPhoto} 
                            onClose={onClose} 
                            onUpdatePhoto={onUpdatePhoto} 
                        />
                    ) : (
                        <div style={{padding: '20px', color: '#888', textAlign: 'center', marginTop: '50px'}}>
                            <div>편집할 사진을 선택해주세요.</div>
                            <button onClick={() => setActiveTab('search')} style={{marginTop: '10px', padding: '8px 16px', cursor: 'pointer'}}>
                                검색하러 가기
                            </button>
                        </div>
                    )
                )}
            </div>
        </aside>
    );
}