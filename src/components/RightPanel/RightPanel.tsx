// src/components/RightPanel.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../styles/RightPanel.css'; 
import { PhotoDetail } from '../../types';

import SearchTab from './SearchTab';
import EditTab from './EditTab';

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

    useEffect(() => {
        if (selectedPhoto) {
            setActiveTab('edit');
        }
    }, [selectedPhoto]);

    const handleTabChange = (tab: TabType) => setActiveTab(tab);

    return (
        <aside className={panelClass} aria-hidden={!isOpen}>
            <div className="chat-header">
                <div className="tab-buttons">
                    <button
                        className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => handleTabChange('search')}
                    >
                        검색
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
                        onClick={() => handleTabChange('edit')}
                    >
                        편집
                    </button>
                </div>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>

            {activeTab === 'search' ? (
                <SearchTab isGuest={isGuest} />
            ) : (
                selectedPhoto ? (
                    <EditTab 
                        selectedPhoto={selectedPhoto} 
                        onClose={onClose} 
                        onUpdatePhoto={onUpdatePhoto} 
                    />
                ) : (
                    <div className="panel-content-wrapper" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'}}>
                        편집할 사진을 선택해주세요.
                    </div>
                )
            )}
        </aside>
    );
}