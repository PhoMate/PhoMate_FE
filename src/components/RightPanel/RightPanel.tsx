import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../styles/RightPanel.css';

import { PhotoDetail } from '../../types';
import EditTab from './EditTab';
import SearchTab from './SearchTab';

type RightPanelProps = {
    isOpen: boolean;
    onClose: () => void; // 부모가 이 함수 안에서 setPhoto(null)을 해야 함
    isGuest?: boolean;
    selectedPhoto?: PhotoDetail | null;
    onUpdatePhoto?: (newUrl: string) => void;
    autoSearchQuery?: string;
};

type TabType = 'search' | 'edit';

export default function RightPanel({ isOpen, onClose, isGuest = false, selectedPhoto, onUpdatePhoto, autoSearchQuery }: RightPanelProps) {
    // 기본 탭은 'search'로 설정하여 사진이 없을 땐 항상 검색부터 나오게 함
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [mountKey, setMountKey] = useState(0);

    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    useEffect(() => {
        if (isOpen) {
            // 패널이 열릴 때마다 키를 바꿔서 컴포넌트를 완전히 새로고침 (초기화)
            setMountKey(prev => prev + 1);

            // 💡 부모가 사진을 줬을 때만 '편집' 탭으로 자동 이동
            if (selectedPhoto) {
                setActiveTab('edit');
            } else {
                setActiveTab('search');
            }
        }
    }, [isOpen, selectedPhoto]);

    const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur(); // 초점 해제 (접근성 경고 해결)
        onClose(); // 부모에게 "닫아줘(그리고 사진도 비워줘)" 요청
    };

    return (
        <aside className={panelClass} aria-hidden={!isOpen}>
            <div className="chat-header">
                <div className="tab-buttons">
                    <button className={`tab-button ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>검색</button>
                    <button className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>편집</button>
                </div>
                <button className="close-btn" onClick={handleClose}><X size={24} /></button>
            </div>

            <div className="panel-content-wrapper">
                {/* isOpen이 true일 때만 렌더링 -> 닫히면 모든 상태 증발(리셋) */}
                {isOpen && (
                    <div key={mountKey} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {activeTab === 'search' ? (
                            <SearchTab isGuest={isGuest} autoSearchQuery={autoSearchQuery} />
                        ) : (
                            selectedPhoto ? (
                                <EditTab 
                                    key={selectedPhoto.id}
                                    selectedPhoto={selectedPhoto} 
                                    onClose={onClose} 
                                    onUpdatePhoto={onUpdatePhoto} 
                                />
                            ) : (
                                // 🔥 사진 없이 '편집' 탭에 왔을 때 보이는 화면
                                <div style={{padding: '20px', color: '#888', textAlign: 'center', marginTop: '50px'}}>
                                    <div>편집할 사진을 선택해주세요.</div>
                                    <button 
                                        onClick={() => setActiveTab('search')} 
                                        style={{marginTop: '10px', padding: '8px 16px', cursor: 'pointer', background: '#333', color:'white', border:'none', borderRadius:'4px'}}
                                    >
                                        검색하러 가기
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}