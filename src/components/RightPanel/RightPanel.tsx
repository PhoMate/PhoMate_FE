import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../styles/RightPanel.css';

import { PhotoDetail } from '../../types';
import EditTab from './EditTab';
import SearchTab from './SearchTab';

type RightPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    isGuest?: boolean;
    selectedPhoto?: PhotoDetail | null;
    onUpdatePhoto?: (newUrl: string) => void;
    autoSearchQuery?: string;
};

type TabType = 'search' | 'edit';

export default function RightPanel({ isOpen, onClose, isGuest = false, selectedPhoto, onUpdatePhoto, autoSearchQuery }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [mountKey, setMountKey] = useState(0);

    const panelClass = `right-panel ${isOpen ? 'open' : 'closed'}`;

    useEffect(() => {
        if (isOpen) {
            setMountKey(prev => prev + 1);
            if (selectedPhoto) {
                setActiveTab('edit');
            } else {
                setActiveTab('search');
            }
        }
    }, [isOpen, selectedPhoto]);

    const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        onClose(); 
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